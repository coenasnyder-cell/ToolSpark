import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
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
import { Modal, Image as RNImage } from 'react-native';
import { GIPHY_API_KEY } from '../../constants/config';

const CATEGORIES = [
  'All', 'General', 'Questions', 'Wins',
  'Announcements', 'Tool Ideas', 'Feedback',
];

interface Poll {
  question: string;
  options: string[];
  votes: Record<string, string>;
  totalVotes: number;
}

const ThreadComposer = ({
  onPost,
  onClose,
  posting,
}: {
  onPost: (title: string, content: string, category: string, mediaUrl?: string, poll?: Poll) => void;
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
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [pendingGifUrl, setPendingGifUrl] = useState<string | null>(null);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
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
const fetchGifs = async (q: string) => {
  setGifLoading(true);
  const endpoint = q.trim()
    ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=24&rating=g`
    : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=g`;
  try {
    const res = await fetch(endpoint);
    const json = await res.json();
    setGifResults(json.data || []);
  } catch {
    setGifResults([]);
  } finally {
    setGifLoading(false);
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
        <Text style={[composerStyles.authorText, { flex: 1 }]}>
          posting in <Text style={composerStyles.authorBold}>
            ToolSpark
          </Text>
        </Text>
        <TouchableOpacity
          style={composerStyles.cancelBtn}
          onPress={onClose}
        >
          <Text style={composerStyles.cancelBtnText}>CANCEL</Text>
        </TouchableOpacity>
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

      {pendingGifUrl && (
        <View style={composerStyles.gifPreviewContainer}>
          <RNImage
            source={{ uri: pendingGifUrl }}
            style={composerStyles.gifPreview}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={composerStyles.gifPreviewRemove}
            onPress={() => setPendingGifUrl(null)}
          >
            <Ionicons name="close-circle" size={18} color={Colors.text2} />
          </TouchableOpacity>
        </View>
      )}

{showPoll && (
  <View style={composerStyles.pollContainer}>
    <Text style={composerStyles.pollLabel}>Poll</Text>

    <TextInput
      style={composerStyles.pollQuestion}
      placeholder="Ask a question..."
      placeholderTextColor="#BBBAB6"
      value={pollQuestion}
      onChangeText={setPollQuestion}
    />

    {pollOptions.map((option, index) => (
      <View key={index} style={composerStyles.pollOptionRow}>
        <TextInput
          style={composerStyles.pollOption}
          placeholder={`Option ${index + 1}`}
          placeholderTextColor="#BBBAB6"
          value={option}
          onChangeText={(text) => {
            const updated = [...pollOptions];
            updated[index] = text;
            setPollOptions(updated);
          }}
        />
        {pollOptions.length > 2 && (
          <TouchableOpacity
            onPress={() => {
              setPollOptions(
                pollOptions.filter((_, i) => i !== index)
              );
            }}
          >
            <Ionicons
              name="close"
              size={18}
              color="#BBBAB6"
            />
          </TouchableOpacity>
        )}
      </View>
    ))}

    {pollOptions.length < 6 && (
      <TouchableOpacity
        style={composerStyles.addOptionButton}
        onPress={() => setPollOptions([...pollOptions, ''])}
      >
        <Ionicons
          name="add"
          size={16}
          color="#BBBAB6"
        />
        <Text style={composerStyles.addOptionText}>
          Add option
        </Text>
      </TouchableOpacity>
    )}
  </View>
)}
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
                color={imageUrl ? Colors.gold : 'text2'}
              />
            )}
          </TouchableOpacity>
          {/* Poll icon */}
          <TouchableOpacity
          style={composerStyles.toolbarIcon}
          onPress={() => setShowPoll(!showPoll)}
          >
          <Ionicons
            name="stats-chart-outline"
            size={20}
          color={showPoll ? Colors.gold : '#text2'}
          />
          </TouchableOpacity>
          {/* Video */}
          <TouchableOpacity
            style={composerStyles.toolbarIcon}
            onPress={() => setShowVideoInput(!showVideoInput)}
          >
            <Ionicons
              name="play-circle-outline"
              size={20}
              color={videoUrl ? Colors.gold : 'text2'}
            />
          </TouchableOpacity>

          {/* GIF */}
<TouchableOpacity
  style={composerStyles.toolbarIcon}
  onPress={() => {
    setShowGifPicker(true);
    fetchGifs('');
  }}
>
  <Text style={[
    composerStyles.gifText,
    pendingGifUrl ? { color: Colors.gold } : null
  ]}>GIF</Text>
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
              color="text2"
            />
          </TouchableOpacity>
        </View>

        {/* Right actions */}
        <View style={composerStyles.toolbarRight}>
          <TouchableOpacity
            style={[
              composerStyles.postBtn,
              !canPost && composerStyles.postBtnDisabled,
            ]}
            onPress={() => onPost(
              title,
              content,
              category,
              imageUrl || pendingGifUrl || videoUrl || undefined,
              showPoll && pollQuestion && pollOptions.filter(o => o.trim()).length >= 2
                ? {
                    question: pollQuestion,
                    options: pollOptions.filter(o => o.trim()),
                    votes: {},
                    totalVotes: 0,
                  }
                : undefined
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
      {/* GIF Picker Modal */}
      <Modal
        visible={showGifPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={composerStyles.gifModal}>
          <View style={composerStyles.gifModalHeader}>
            <Text style={composerStyles.gifModalTitle}>Choose a GIF</Text>
            <TouchableOpacity onPress={() => setShowGifPicker(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={composerStyles.gifSearchRow}>
            <TextInput
              style={composerStyles.gifSearchInput}
              placeholder="Search GIFs..."
              placeholderTextColor={Colors.text3}
              value={gifQuery}
              onChangeText={(q) => { setGifQuery(q); fetchGifs(q); }}
              autoFocus
            />
          </View>
          {gifLoading ? (
            <ActivityIndicator color={Colors.gold} style={{ marginTop: Layout.xl }} />
          ) : (
            <FlatList
              data={gifResults}
              keyExtractor={(g) => g.id}
              numColumns={2}
              columnWrapperStyle={composerStyles.gifGrid}
              renderItem={({ item }) => {
                const url = item.images?.fixed_width?.url;
                return (
                  <TouchableOpacity
                    style={composerStyles.gifCell}
                    onPress={() => {
                      setPendingGifUrl(item.images?.original?.url || url);
                      setShowGifPicker(false);
                      setGifQuery('');
                    }}
                  >
                    <RNImage
                      source={{ uri: url }}
                      style={composerStyles.gifCellImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
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
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    gap: Layout.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  toolbarIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gifText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: 'Colors.text2',
    letterSpacing: 0.5,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.sm,
    paddingVertical: 4,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  categoryButtonText: {
    fontSize: Typography.xs,
    color: 'Colors.text2',
    fontWeight: '500',
  },
  cancelBtn: {
    paddingHorizontal: Layout.sm,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.xs,
    color: Colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  postBtn: {
    paddingHorizontal: Layout.md,
    paddingVertical: 4,
    borderRadius: Layout.radiusFull,
    backgroundColor: Colors.sidebar,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postBtnDisabled: {},
  postBtnText: {
    fontSize: Typography.xs,
    color: Colors.gold,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  postBtnTextDisabled: {},
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
  pollContainer: {
  marginHorizontal: Layout.md,
  marginBottom: Layout.sm,
  backgroundColor: Colors.surface2,
  borderRadius: Layout.radiusSm,
  padding: Layout.md,
  borderWidth: 1,
  borderColor: Colors.border,
  gap: Layout.sm,
},
pollLabel: {
  fontSize: Typography.xs,
  fontWeight: '700',
  color: Colors.text3,
  textTransform: 'uppercase',
  letterSpacing: 0.5,
},
pollQuestion: {
  fontSize: Typography.base,
  color: Colors.text,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  paddingVertical: Layout.sm,
},
pollOptionRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Layout.sm,
},
pollOption: {
  flex: 1,
  fontSize: Typography.base,
  color: Colors.text,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  paddingVertical: Layout.sm,
},
addOptionButton: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingTop: Layout.sm,
},
addOptionText: {
  fontSize: Typography.sm,
  color: '#BBBAB6',
},
gifPreviewContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginHorizontal: Layout.md,
  marginBottom: Layout.sm,
},
gifPreview: {
  width: 80,
  height: 60,
  borderRadius: Layout.radiusSm,
},
gifPreviewRemove: {
  marginLeft: Layout.xs,
},
gifModal: {
  flex: 1,
  backgroundColor: Colors.bg,
},
gifModalHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: Layout.md,
  paddingTop: Layout.lg,
  paddingBottom: Layout.sm,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},
gifModalTitle: {
  fontSize: Typography.md,
  fontWeight: '700',
  color: Colors.text,
},
gifSearchRow: {
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
},
gifSearchInput: {
  backgroundColor: Colors.surface,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Layout.radiusFull,
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
  fontSize: Typography.base,
  color: Colors.text,
},
gifGrid: {
  paddingHorizontal: Layout.sm,
  gap: Layout.sm,
},
gifCell: {
  flex: 1,
  margin: Layout.xs,
  borderRadius: Layout.radiusSm,
  overflow: 'hidden',
  backgroundColor: Colors.surface,
},
gifCellImage: {
  width: '100%',
  height: 120,
},
});

interface ListHeaderProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  showComposer: boolean;
  setShowComposer: (show: boolean) => void;
  isBanned: boolean;
  user: any;
  handlePost: (
    title: string,
    content: string,
    category: string,
    mediaUrl?: string,
    poll?: any
  ) => void;
  posting: boolean;
  nextEvent: any;
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
