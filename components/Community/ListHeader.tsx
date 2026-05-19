import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';
import { Image } from 'react-native';

const CATEGORIES = [
  'All', 'General', 'Questions', 'Wins',
  'Announcements', 'Tool Ideas', 'Feedback',
];

const ThreadComposer = ({
  onPost,
  onClose,
  posting,
}: {
  onPost: (title: string, content: string, category: string, imageUrl?: string) => void;
  onClose: () => void;
  posting: boolean;
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const titleRef = useRef<TextInput>(null);

  const handlePickImage = async () => {
    const permission = await ImagePicker
      .requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadingImage(true);
      try {
        const uri = result.assets[0].uri;
        const response = await fetch(uri);
        const blob = await response.blob();
        const fileName = `thread-images/${Date.now()}.jpg`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        const downloadURL = await getDownloadURL(storageRef);
        setImageUrl(downloadURL);
      } catch (err) {
        console.log('Image upload error:', err);
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const canPost = title.trim().length > 0 && content.trim().length > 0;

  return (
    <View style={composerStyles.container}>
      {/* Author row */}
      <View style={composerStyles.authorRow}>
        <View style={composerStyles.authorAvatar}>
          <Text style={composerStyles.authorAvatarText}>C</Text>
        </View>
        <Text style={composerStyles.authorText}>
          posting in <Text style={composerStyles.authorBold}>
            ToolSpark
          </Text>
        </Text>
      </View>

      {/* Title input */}
      <TextInput
        ref={titleRef}
        style={composerStyles.titleInput}
        placeholder="Title"
        placeholderTextColor="#BBBAB6"
        value={title}
        onChangeText={setTitle}
        autoFocus
        blurOnSubmit={false}
        returnKeyType="next"
      />

      {/* Content input */}
      <TextInput
        style={composerStyles.contentInput}
        placeholder="Write something..."
        placeholderTextColor="#BBBAB6"
        value={content}
        onChangeText={setContent}
        multiline
        blurOnSubmit={false}
        textAlignVertical="top"
      />

      {/* Image preview */}
      {imageUrl ? (
        <View style={composerStyles.imagePreview}>
          <Image
            source={{ uri: imageUrl }}
            style={composerStyles.previewImage}
          />
          <TouchableOpacity
            style={composerStyles.removeImage}
            onPress={() => setImageUrl('')}
          >
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Video URL input */}
      {showVideoInput && (
        <View style={composerStyles.videoInputRow}>
          <TextInput
            style={composerStyles.videoInput}
            placeholder="Paste YouTube or Loom URL..."
            placeholderTextColor="#BBBAB6"
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
          <TouchableOpacity
            onPress={() => {
              setVideoUrl('');
              setShowVideoInput(false);
            }}
          >
            <Ionicons name="close" size={18} color="#BBBAB6" />
          </TouchableOpacity>
        </View>
      )}

      {/* Category picker */}
      {showCategoryPicker && (
        <View style={composerStyles.categoryOptions}>
          {CATEGORIES.filter(c => c !== 'All').map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                composerStyles.categoryOption,
                category === cat && composerStyles.categoryOptionActive,
              ]}
              onPress={() => {
                setCategory(cat);
                setShowCategoryPicker(false);
              }}
            >
              <Text style={[
                composerStyles.categoryOptionText,
                category === cat && composerStyles.categoryOptionTextActive,
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Toolbar */}
      <View style={composerStyles.toolbar}>
        {/* Left icons */}
        <View style={composerStyles.toolbarLeft}>

          {/* Image */}
          <TouchableOpacity
            style={composerStyles.toolbarIcon}
            onPress={handlePickImage}
            disabled={uploadingImage}
          >
            {uploadingImage ? (
              <ActivityIndicator size="small" color="#BBBAB6" />
            ) : (
              <Ionicons
                name="image-outline"
                size={20}
                color={imageUrl ? Colors.gold : '#BBBAB6'}
              />
            )}
          </TouchableOpacity>

          {/* Video */}
          <TouchableOpacity
            style={composerStyles.toolbarIcon}
            onPress={() => setShowVideoInput(!showVideoInput)}
          >
            <Ionicons
              name="play-circle-outline"
              size={20}
              color={videoUrl ? Colors.gold : '#BBBAB6'}
            />
          </TouchableOpacity>

          {/* GIF placeholder */}
          <TouchableOpacity style={composerStyles.toolbarIcon}>
            <Text style={composerStyles.gifText}>GIF</Text>
          </TouchableOpacity>

          {/* Category */}
          <TouchableOpacity
            style={composerStyles.categoryButton}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          >
            <Text style={composerStyles.categoryButtonText}>
              {category}
            </Text>
            <Ionicons
              name="chevron-down"
              size={12}
              color="#BBBAB6"
            />
          </TouchableOpacity>
        </View>

        {/* Right actions */}
        <View style={composerStyles.toolbarRight}>
          <TouchableOpacity
            style={composerStyles.cancelBtn}
            onPress={onClose}
          >
            <Text style={composerStyles.cancelBtnText}>
              CANCEL
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              composerStyles.postBtn,
              !canPost && composerStyles.postBtnDisabled,
            ]}
            onPress={() => onPost(
              title,
              content,
              category,
              imageUrl || videoUrl || undefined
            )}
            disabled={!canPost || posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={[
                composerStyles.postBtnText,
                !canPost && composerStyles.postBtnTextDisabled,
              ]}>
                POST
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const composerStyles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingTop: Layout.md,
    paddingBottom: Layout.sm,
    gap: Layout.sm,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.bg,
  },
  authorText: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  authorBold: {
    fontWeight: '700',
    color: Colors.text,
  },
  titleInput: {
    fontSize: Typography.xl,
    fontWeight: '600',
    color: Colors.text,
    paddingHorizontal: Layout.md,
    paddingBottom: Layout.sm,
    minHeight: 40,
  },
  contentInput: {
    fontSize: Typography.base,
    color: Colors.text,
    paddingHorizontal: Layout.md,
    paddingBottom: Layout.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  imagePreview: {
    marginHorizontal: Layout.md,
    marginBottom: Layout.md,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: Layout.radiusSm,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Layout.md,
    marginBottom: Layout.sm,
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.sm,
  },
  videoInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
    paddingVertical: Layout.sm,
    minHeight: 40,
  },
  categoryPickerRow: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  toolbarIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: '#BBBAB6',
    letterSpacing: 0.5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  categoryButtonText: {
    fontSize: Typography.xs,
    color: '#BBBAB6',
    fontWeight: '500',
  },
  cancelBtn: {
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    minHeight: 36,
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.xs,
    color: '#BBBAB6',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  postBtn: {
    paddingHorizontal: Layout.md,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    backgroundColor: Colors.text,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBtnDisabled: {
    backgroundColor: Colors.border,
  },
  postBtnText: {
    fontSize: Typography.xs,
    color: '#F5F3EF',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  postBtnTextDisabled: {
    color: Colors.text3,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.md,
    paddingBottom: Layout.sm,
    gap: Layout.sm,
  },
  categoryOption: {
    paddingHorizontal: Layout.md,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  categoryOptionActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryOptionText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '500',
  },
  categoryOptionTextActive: {
    color: Colors.bg,
    fontWeight: '700',
  },
});

interface ListHeaderProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  showComposer: boolean;
  setShowComposer: (show: boolean) => void;
  isBanned: boolean;
  user: any;
  handlePost: (title: string, content: string, category: string, imageUrl?: string) => void;
  posting: boolean;
  nextEvent?: any;
}

export default function ListHeader({
  selectedCategory,
  setSelectedCategory,
  showComposer,
  setShowComposer,
  isBanned,
  user,
  handlePost,
  posting,
  nextEvent,
}: ListHeaderProps) {
  const router = useRouter();

  return (
    <View>
      {/* Event banner */}
      <TouchableOpacity
        style={styles.eventBanner}
        activeOpacity={0.8}
        onPress={() => router.push('/events' as any)}
      >
        <View style={styles.eventBannerInner}>
          <Ionicons name="calendar" size={16} color={Colors.text} />
          <Text style={styles.eventBannerText} numberOfLines={1}>
            {nextEvent
              ? `${nextEvent.eventTitle} · ${nextEvent.eventStart}`
              : 'No upcoming events · Check back soon'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Write something trigger */}
      {!isBanned && !showComposer && (
        <TouchableOpacity
          style={styles.composerTrigger}
          onPress={() => setShowComposer(true)}
          activeOpacity={0.7}
        >
          <View style={styles.composerTriggerAvatar}>
            <Text style={styles.composerTriggerAvatarText}>
              {user?.displayName?.charAt(0)?.toUpperCase() || 'M'}
            </Text>
          </View>
          <Text style={styles.composerTriggerText}>
            Write something...
          </Text>
        </TouchableOpacity>
      )}

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillList}
        style={styles.pillScroll}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, selectedCategory === cat && styles.pillActive]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, selectedCategory === cat && styles.pillTextActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Composer when open */}
      {showComposer && !isBanned && (
        <ThreadComposer
          onPost={handlePost}
          onClose={() => setShowComposer(false)}
          posting={posting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eventBanner: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    backgroundColor: Colors.gold,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventBannerInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  eventBannerText: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
    fontWeight: '500',
  },
  pillScroll: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pillList: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    gap: Layout.sm,
    flexDirection: 'row',
  },
  pill: {
    paddingHorizontal: Layout.md,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  pillText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '500',
  },
  pillTextActive: {
    color: Colors.surface,
    fontWeight: '700',
  },
  composerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.md,
    marginVertical: Layout.sm,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    minHeight: 52,
    gap: Layout.sm,
  },
  composerTriggerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTriggerAvatarText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.bg,
  },
  composerTriggerText: {
    fontSize: Typography.sm,
    color: Colors.text3,
    flex: 1,
  },
});
