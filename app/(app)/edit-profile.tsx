import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import { useRouter } from 'expo-router';
import { auth, db, storage } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

export default function EditProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadProfile = async (u: User) => {
    const userRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      setDisplayName(data.displayName || u.displayName || '');
      setBio(data.bio || '');
      setPhotoURL(data.photoURL || u.photoURL || '');
    }
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker
      .requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow access to your photo library.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0] && user) {
      setUploadingPhoto(true);
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const storageRef = ref(
          storage,
          `profile-images/${user.uid}/profile.jpg`
        );
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setPhotoURL(downloadURL);
      } catch (err) {
        Alert.alert('Error', 'Could not upload photo.');
        console.log('Photo upload error:', err);
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName.trim(),
        photoURL: photoURL || user.photoURL,
      });

      // Update Firestore user document
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: photoURL || user.photoURL || '',
      });

      // Backfill photo on all user's threads
      if (photoURL) {
        const threadsQuery = query(
          collection(db, 'threads'),
          where('authorId', '==', user.uid)
        );
        const threadsSnap = await getDocs(threadsQuery);
        const batch = writeBatch(db);
        threadsSnap.docs.forEach(d => {
          batch.update(d.ref, { authorPhotoURL: photoURL });
        });
        await batch.commit();
      }

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', 'Could not save profile.');
      console.log('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.gold} size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo picker */}
        <View style={styles.photoSection}>
          <TouchableOpacity
            style={styles.photoContainer}
            onPress={handlePickPhoto}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <View style={styles.photoFallback}>
                <ActivityIndicator
                  color={Colors.gold}
                  size="small"
                />
              </View>
            ) : photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.photo}
              />
            ) : (
              <View style={styles.photoFallback}>
                <Text style={styles.photoFallbackText}>
                  {displayName.charAt(0)?.toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <View style={styles.photoEditBadge}>
              <Text style={styles.photoEditBadgeText}>✎</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.photoHint}>
            Tap to change photo
          </Text>
        </View>

        {/* Form fields */}
        <View style={styles.form}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your name"
              placeholderTextColor={Colors.text3}
              autoCapitalize="words"
              maxLength={50}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell the community about yourself..."
              placeholderTextColor={Colors.text3}
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {bio.length}/200
            </Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveFullButton,
            saving && styles.disabledButton
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.saveFullButtonText}>
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingTop: 56,
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: '#F5F3EF',
  },
  saveButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingLeft: Layout.md,
  },
  saveButtonText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '700',
  },
  content: {
    padding: Layout.md,
    paddingBottom: Layout.xl,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: Layout.xl,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: Layout.sm,
  },
  photo: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  photoFallback: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  photoFallbackText: {
    fontSize: Typography.xxxl,
    fontWeight: '700',
    color: Colors.bg,
  },
  photoEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.sidebar,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  photoEditBadgeText: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '700',
  },
  photoHint: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  form: {
    gap: Layout.md,
    marginBottom: Layout.lg,
  },
  fieldBlock: {
    gap: 6,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: Layout.buttonHeight,
  },
  bioInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  charCount: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textAlign: 'right',
  },
  saveFullButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
  },
  saveFullButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
});