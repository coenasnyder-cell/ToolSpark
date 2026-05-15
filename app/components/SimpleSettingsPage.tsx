import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardAwareFormScreen from '../site-tools/KeyboardAwareFormScreen';
import { app } from '../../firebase';
import { useAuth } from '../../hooks/useAuth';

export default function SimpleSettingsPage({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      const fetchProfile = async () => {
        try {
          const db = getFirestore(app);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.name || user.displayName || '');
            setEmail(data.email || user.email || '');
            setPhone(data.phone || '');
            setZipCode(data.zipCode || '');
            setPhotoUrl(data.profileimage || '');
          }
        } catch (e) {
          setName(user.displayName || '');
          setEmail(user.email || '');
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.uid) return;
    try {
      const db = getFirestore(app);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        phone,
        zipCode,
      });
      Alert.alert('Profile updated', 'Your profile has been updated successfully.', [
        {
          text: 'OK',
          onPress: onClose,
        },
      ]);
      // Mark the updateProfile onboarding step as completed
      try {
        const key = `profile-onboarding-checks-v1:${user.uid}`;
        const saved = await AsyncStorage.getItem(key);
        const checks = saved ? JSON.parse(saved) : {};
        checks.updateProfile = true;
        await AsyncStorage.setItem(key, JSON.stringify(checks));
      } catch {}
    } catch (e) {
      Alert.alert('Error', 'There was a problem updating your profile.');
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need access to your photo library to upload a profile photo.');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
            allowsEditing: false,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (e) {
      console.error('Image picker error:', e);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadPhoto = async (uri: string) => {
    if (!user?.uid) return;
    
    setUploading(true);
    try {
      const response = await fetch(uri);
      if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
      const blob = await response.blob();
      
      const storage = getStorage(app);
      const photoRef = ref(storage, `profilePhotos/${user.uid}/picture`);
      
      console.log('Starting upload to:', `profilePhotos/${user.uid}/picture`);
      console.log('Blob size:', blob.size, 'Blob type:', blob.type);
      
      await uploadBytes(photoRef, blob);
      console.log('Upload successful, getting download URL...');
      
      const downloadUrl = await getDownloadURL(photoRef);
      console.log('Download URL obtained:', downloadUrl);
      
      setPhotoUrl(downloadUrl);
      
      const db = getFirestore(app);
      const userRef = doc(db, 'users', user.uid);
      console.log('Updating Firestore user document with profileimage field');
      await updateDoc(userRef, { profileimage: downloadUrl });
      
      Alert.alert('Success', 'Profile photo updated');
    } catch (e) {
      console.error('Full upload error:', e);
      const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);
      Alert.alert('Error', `Failed to upload photo:\n${errorMessage}`);
    }
    setUploading(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
      </View>

      {/* Content */}
      <KeyboardAwareFormScreen contentContainerStyle={styles.container}>
      <View style={styles.photoSection}>
        <TouchableOpacity 
          style={styles.photoContainer} 
          onPress={pickImage}
          disabled={uploading}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.photoImage} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Feather name="user" size={80} color="#bbb" />
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
          <View style={styles.photoEditButton}>
            <Feather name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.photoHint}>Tap to change profile photo</Text>
      </View>
      <Text style={styles.label}>Name</Text>
      <Text style={styles.disabledInput}>{name}</Text>
      <Text style={styles.label}>Email</Text>
      <Text style={styles.disabledInput}>{email}</Text>
      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="Enter phone number"
      />
      <Text style={styles.label}>Zip Code</Text>
      <TextInput
        style={styles.input}
        value={zipCode}
        onChangeText={setZipCode}
        keyboardType="number-pad"
        placeholder="Enter zip code"
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save changes</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
      </KeyboardAwareFormScreen>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  tabNavigation: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    backgroundColor: '#fff',
    paddingHorizontal: 0,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#2980b9',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  tabButtonTextActive: {
    color: '#2980b9',
  },
  label: {
    fontSize: 13, // Smaller font size
    color: '#555',
    marginBottom: 2,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 8, // Smaller padding
    fontSize: 14, // Smaller font size
    backgroundColor: '#f8f8f8',
    width: '100%',
  },
  disabledInput: {
    fontSize: 14, // Smaller font size
    color: '#888',
    backgroundColor: '#f0f0f0',
    padding: 8, // Smaller padding
    borderRadius: 6,
    width: '100%',
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: 14, // Smaller font size
    color: '#333',
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#2980b9',
    paddingVertical: 12, // Smaller padding
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14, // Smaller font size
  },
  cancelButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  cancelButtonText: {
    color: '#475569',
    fontWeight: 'bold',
    fontSize: 14,
  },
  policyInfoBox: {
    marginTop: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  policyInfoText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  policyLinkRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  policyLinkText: {
    fontSize: 12,
    color: '#1d4ed8',
    fontWeight: '600',
  },
  policyLinkSeparator: {
    fontSize: 12,
    color: '#94a3b8',
  },
  deleteButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    backgroundColor: '#fff1f2',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontWeight: 'bold',
    fontSize: 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  photoContainer: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2980b9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 60,
  },
  photoHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  headerRow: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 4, // Reduced margin
    paddingVertical: 4, // Reduced padding
    backgroundColor: '#fff',
  },
  exitText: {
    fontSize: 16,
    color: '#2980b9',
    fontWeight: 'bold',
  },
  headerCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14, // Smaller font size for Edit Profile
    fontWeight: 'bold',
    color: '#333',
  },
  settingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  settingLinkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  settingLinkText: {
    flex: 1,
  },
  settingLinkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  settingLinkSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
