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
  Switch,
} from 'react-native';
import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db, storage } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import FormInput from '../../components/Shared/FormInput';

const CATEGORIES = [
  'AI', 'No-code', 'Marketing', 'Community',
  'Payments', 'Design', 'Productivity', 'Other'
];

export default function AdminToolEditScreen() {
  const router = useRouter();
  const { toolId } = useLocalSearchParams<{ toolId: string }>();
  const isEditing = !!toolId;

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [affiliateUrl, setAffiliateUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [order, setOrder] = useState('0');
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (isEditing) loadTool();
  }, [toolId]);

  const loadTool = async () => {
    try {
      const snap = await getDoc(doc(db, 'tools', toolId!));
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || '');
        setCategory(data.category || '');
        setDescription(data.description || '');
        setImageUrl(data.imageUrl || '');
        setVideoUrl(data.videoUrl || '');
        setArticleContent(data.articleContent || '');
        setAffiliateUrl(data.affiliateUrl || '');
        setIsFeatured(data.isFeatured || false);
        setOrder(String(data.order || 0));
      }
    } catch (err) {
      console.log('Load tool error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = async () => {
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
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `tool-images/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setImageUrl(downloadURL);
      } catch (err) {
        Alert.alert('Error', 'Could not upload image.');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a tool name.');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category.');
      return;
    }

    setSaving(true);
    try {
      const toolData = {
        name: name.trim(),
        category,
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        videoUrl: videoUrl.trim(),
        articleContent: articleContent.trim(),
        affiliateUrl: affiliateUrl.trim(),
        isFeatured,
        order: parseInt(order) || 0,
      };

      if (isEditing) {
        await updateDoc(doc(db, 'tools', toolId!), toolData);
        Alert.alert('Saved', 'Tool updated successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        await addDoc(collection(db, 'tools'), {
          ...toolData,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Added', 'Tool added successfully.', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not save tool.');
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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Tool' : 'Add Tool'}
        </Text>
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
        {/* Image upload */}
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <View style={styles.imageFallback}>
                <ActivityIndicator color={Colors.gold} />
              </View>
            ) : imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.toolImage}
              />
            ) : (
              <View style={styles.imageFallback}>
                <Ionicons
                  name="image-outline"
                  size={32}
                  color={Colors.text3}
                />
                <Text style={styles.imageHint}>
                  Tap to upload image
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {imageUrl && (
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handlePickImage}
            >
              <Text style={styles.changeImageText}>
                Change Image
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Basic info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Basic Info</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Tool Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Claude AI"
              placeholderTextColor={Colors.text3}
              maxLength={100}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Category *</Text>
            <FormInput
              label=""
              value={category}
              onChangeText={setCategory}
              type="picker"
              options={CATEGORIES}
              placeholder="Select category"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="What does this tool do?"
              placeholderTextColor={Colors.text3}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>

        {/* Links */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Links</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Affiliate URL</Text>
            <TextInput
              style={styles.input}
              value={affiliateUrl}
              onChangeText={setAffiliateUrl}
              placeholder="https://..."
              placeholderTextColor={Colors.text3}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>
              Video URL (YouTube or Loom)
            </Text>
            <TextInput
              style={styles.input}
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://youtube.com/..."
              placeholderTextColor={Colors.text3}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </View>

        {/* Article content */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Article Content</Text>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>How to use this tool</Text>
            <TextInput
              style={[styles.input, styles.articleInput]}
              value={articleContent}
              onChangeText={setArticleContent}
              placeholder="Write about how to use this tool..."
              placeholderTextColor={Colors.text3}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
            <Text style={styles.charCount}>
              {articleContent.length}/2000
            </Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>
                Featured Tool
              </Text>
              <Text style={styles.settingDesc}>
                Shows at the top of the tools list
              </Text>
            </View>
            <Switch
              value={isFeatured}
              onValueChange={setIsFeatured}
              trackColor={{
                false: Colors.border,
                true: Colors.gold,
              }}
              thumbColor={Colors.surface}
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Display Order</Text>
            <TextInput
              style={styles.input}
              value={order}
              onChangeText={setOrder}
              placeholder="0"
              placeholderTextColor={Colors.text3}
              keyboardType="numeric"
            />
            <Text style={styles.fieldHint}>
              Lower numbers appear first
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
              {isEditing ? 'Save Changes' : 'Add Tool'}
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
    paddingBottom: Layout.xl,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: Layout.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Layout.md,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: Layout.radius,
    overflow: 'hidden',
    marginBottom: Layout.sm,
  },
  toolImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radius,
    gap: Layout.sm,
  },
  imageHint: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textAlign: 'center',
  },
  changeImageButton: {
    paddingVertical: Layout.sm,
  },
  changeImageText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.md,
  },
  sectionLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.md,
    paddingBottom: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  fieldBlock: {
    marginBottom: Layout.md,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text2,
    marginBottom: 6,
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
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  articleInput: {
    minHeight: 160,
    paddingTop: 14,
  },
  charCount: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textAlign: 'right',
    marginTop: 4,
  },
  fieldHint: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.md,
    gap: Layout.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  saveFullButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: Layout.md,
    marginTop: Layout.md,
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