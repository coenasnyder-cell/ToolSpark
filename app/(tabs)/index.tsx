import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { useRouter } from 'expo-router';
import Header from '../../components/Shared/Header';
import FormInput from '../../components/Shared/FormInput';
import { Image } from 'expo-image';

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  category: string;
  likes: number;
  commentCount: number;
  pinned: boolean;
  createdAt: any;
}

const CATEGORIES = [
  'All', 'General', 'Questions', 'Wins',
  'Announcements', 'Tool Ideas', 'Feedback',
];

const CategoryFilter = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (cat: string) => void;
}) => (
  <View style={styles.categoryContainer}>
    <FormInput
      label=""
      value={selected}
      onChangeText={onSelect}
      type="picker"
      options={CATEGORIES}
      placeholder="All categories"
    />
  </View>
);

const ThreadComposer = ({
  onPost,
  onClose,
  posting,
}: {
  onPost: (title: string, content: string) => void;
  onClose: () => void;
  posting: boolean;
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const titleRef = useRef<TextInput>(null);

  return (
    <View style={styles.composer}>
      <TextInput
        ref={titleRef}
        style={styles.composerTitle}
        placeholder="Thread title..."
        placeholderTextColor={Colors.text3}
        value={title}
        onChangeText={setTitle}
        autoFocus
        blurOnSubmit={false}
        returnKeyType="next"
      />
      <TextInput
        style={styles.composerContent}
        placeholder="What's on your mind?"
        placeholderTextColor={Colors.text3}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={4}
        blurOnSubmit={false}
        textAlignVertical="top"
      />
      <View style={styles.composerActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.postButton,
            posting && styles.disabledButton
          ]}
          onPress={() => onPost(title, content)}
          disabled={posting}
        >
          {posting ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.postButtonText}>Post Thread</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function CommunityScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showComposer, setShowComposer] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'threads'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Thread[];
      setThreads(data);
      setLoading(false);
      setRefreshing(false);
    });
    return unsubscribe;
  }, []);

  const filteredThreads = selectedCategory === 'All'
    ? threads
    : threads.filter(t =>
        t.category?.toLowerCase() ===
        selectedCategory.toLowerCase()
      );

  const allThreads = [
    ...filteredThreads.filter(t => t.pinned),
    ...filteredThreads.filter(t => !t.pinned),
  ];

  const handlePost = async (title: string, content: string) => {
    if (!title.trim() || !content.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'threads'), {
        title: title.trim(),
        content: content.trim(),
        authorId: user.uid,
        authorName: user.displayName || 'Member',
        authorPhotoURL: user.photoURL || '',
        category: 'General',
        likes: 0,
        commentCount: 0,
        pinned: false,
        createdAt: serverTimestamp(),
      });
      setShowComposer(false);
    } catch (err) {
      console.log('Post error:', err);
    } finally {
      setPosting(false);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderThread = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      style={styles.threadCard}
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: '/(app)/thread-detail',
        params: { threadId: item.id }
      } as any)}
    >
      {item.pinned && (
        <View style={styles.pinnedBadge}>
          <Text style={styles.pinnedText}>📌 PINNED</Text>
        </View>
      )}
      <View style={styles.threadHeader}>
        <View style={styles.avatar}>
  {item.authorPhotoURL ? (
  <Image
    source={{ uri: item.authorPhotoURL }}
      style={styles.avatarImage}
      contentFit="cover"
    />
  ) : (
    <Text style={styles.avatarText}>
      {item.authorName?.charAt(0)?.toUpperCase() || 'M'}
    </Text>
  )}
</View>
        <View style={styles.threadMeta}>
  <Text style={styles.authorName}>
    {item.authorName}
    <Text style={styles.timeText}> · {formatTime(item.createdAt)}</Text>
  </Text>
</View>

        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {item.category}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.threadTitle}>{item.title}</Text>
      <Text style={styles.threadContent} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.threadFooter}>
        <TouchableOpacity style={styles.footerAction}>
          <Text style={styles.footerActionText}>
            ♥ {item.likes || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerAction}>
          <Text style={styles.footerActionText}>
            💬 {item.commentCount || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header with Post button */}
      <Header subtitle="Builder Platform" />

      {/* Post button row */}
      <View style={styles.postRow}>
        <Text style={styles.postRowTitle}>Community</Text>
        <TouchableOpacity
          style={styles.newPostButton}
          onPress={() => setShowComposer(!showComposer)}
        >
          <Text style={styles.newPostText}>
            {showComposer ? '✕ Close' : '+ Post'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Composer */}
      {showComposer && (
        <ThreadComposer
          onPost={handlePost}
          onClose={() => setShowComposer(false)}
          posting={posting}
        />
      )}

      {/* Category filter */}
      <CategoryFilter
        selected={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Thread list */}
      <FlatList
        data={allThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            tintColor={Colors.gold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✦</Text>
            <Text style={styles.emptyTitle}>No threads yet</Text>
            <Text style={styles.emptySubtitle}>
              Be the first to post in the community
            </Text>
          </View>
        }
      />
    </KeyboardAvoidingView>
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
  listContent: {
    paddingBottom: Layout.tabBarHeight + Layout.md,
    paddingTop: Layout.sm,
  },
  postRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    backgroundColor: Colors.bg,
  },
  postRowTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  newPostButton: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderRadius: Layout.radiusFull,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  newPostText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  categoryContainer: {
    paddingHorizontal: Layout.md,
    paddingBottom: Layout.sm,
  },
  composer: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginHorizontal: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  composerTitle: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    fontSize: Typography.base,
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  composerContent: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Layout.md,
  },
  composerActions: {
    flexDirection: 'row',
    gap: Layout.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: Colors.text2,
    fontWeight: '600',
    fontSize: Typography.base,
  },
  postButton: {
    flex: 2,
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
  },
  postButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  disabledButton: {
    opacity: 0.6,
  },
  threadCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginHorizontal: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
  },
  pinnedBadge: {
    marginBottom: Layout.sm,
  },
  pinnedText: {
    fontSize: Typography.xs,
    color: Colors.gold,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.sm,
    gap: Layout.sm,
  },
  avatar: {
    width: Layout.avatarSm,
    height: Layout.avatarSm,
    borderRadius: Layout.avatarSm / 2,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
  width: Layout.avatarSm,
  height: Layout.avatarSm,
  borderRadius: Layout.avatarSm / 2,
},
  avatarText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  threadMeta: {
    flex: 1,
  },
  authorName: {
  fontSize: Typography.sm,
  fontWeight: '700',        // bolder
  color: Colors.text,
},
timeText: {
  fontSize: Typography.xs,
  color: Colors.text3,
},
  categoryBadge: {
    backgroundColor: Colors.surface2,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryText: {
    fontSize: Typography.xs,
    color: Colors.text2,
    fontWeight: '500',
  },
  threadTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
    lineHeight: Typography.md * 1.4,
  },
  threadContent: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.md,
  },
  threadFooter: {
    flexDirection: 'row',
    gap: Layout.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.sm,
  },
  footerAction: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingRight: Layout.md,
  },
  footerActionText: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
    paddingHorizontal: Layout.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: Layout.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
});