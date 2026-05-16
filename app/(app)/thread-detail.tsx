import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  createdAt: any;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  likes: number;
  commentCount: number;
  createdAt: any;
}

export default function ThreadDetailScreen() {
  const router = useRouter();
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [liked, setLiked] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  // Load thread
  useEffect(() => {
    if (!threadId) return;
    const loadThread = async () => {
      const threadRef = doc(db, 'threads', threadId);
      const snap = await getDoc(threadRef);
      if (snap.exists()) {
        setThread({ id: snap.id, ...snap.data() } as Thread);
      }
      setLoading(false);
    };
    loadThread();
  }, [threadId]);

  // Load comments real-time
  useEffect(() => {
    if (!threadId) return;
    const q = query(
      collection(db, 'threads', threadId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      setComments(data);
      // Auto scroll to bottom on new comment
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return unsubscribe;
  }, [threadId]);

  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !threadId) return;
    setPosting(true);
    try {
      // Add comment to subcollection
      await addDoc(
        collection(db, 'threads', threadId, 'comments'),
        {
          content: newComment.trim(),
          authorId: user.uid,
          authorName: user.displayName || 'Member',
          authorPhoto: user.photoURL || '',
          createdAt: serverTimestamp(),
        }
      );
      // Update comment count on thread
      await updateDoc(doc(db, 'threads', threadId), {
        commentCount: increment(1),
      });
      setNewComment('');
    } catch (err) {
      console.log('Comment error:', err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async () => {
    if (!threadId || liked) return;
    setLiked(true);
    await updateDoc(doc(db, 'threads', threadId), {
      likes: increment(1),
    });
    setThread(prev => prev
      ? { ...prev, likes: (prev.likes || 0) + 1 }
      : prev
    );
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

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.authorName?.charAt(0)?.toUpperCase() || 'M'}
          </Text>
        </View>
        <View style={styles.commentMeta}>
          <Text style={styles.commentAuthor}>
            {item.authorName}
          </Text>
          <Text style={styles.commentTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Thread content */}
      {thread && (
        <View style={styles.threadCard}>
          <View style={styles.threadHeader}>
            <View style={styles.avatarLarge}>
              <Text style={styles.avatarLargeText}>
                {thread.authorName?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
            <View style={styles.threadMeta}>
              <Text style={styles.authorName}>
                {thread.authorName}
              </Text>
              <Text style={styles.timeText}>
                {formatTime(thread.createdAt)}
              </Text>
            </View>
            {thread.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {thread.category}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.threadTitle}>{thread.title}</Text>
          <Text style={styles.threadContent}>{thread.content}</Text>

          <View style={styles.threadActions}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                liked && styles.actionButtonActive
              ]}
              onPress={handleLike}
            >
              <Text style={[
                styles.actionText,
                liked && styles.actionTextActive
              ]}>
                ♥ {thread.likes || 0}
              </Text>
            </TouchableOpacity>
            <View style={styles.actionButton}>
              <Text style={styles.actionText}>
                💬 {thread.commentCount || 0} comments
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Comments label */}
      <View style={styles.commentsLabel}>
        <Text style={styles.commentsLabelText}>
          Comments
        </Text>
      </View>
    </View>
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
      {/* Back button header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Comments list */}
      <FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyText}>
              No comments yet — be the first!
            </Text>
          </View>
        }
      />

      {/* Comment input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="Add a comment..."
          placeholderTextColor={Colors.text3}
          value={newComment}
          onChangeText={setNewComment}
          multiline
          maxLength={500}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!newComment.trim() || posting) && styles.sendButtonDisabled
          ]}
          onPress={handlePostComment}
          disabled={!newComment.trim() || posting}
        >
          {posting ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingTop: 60,
    paddingBottom: Layout.md,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingRight: Layout.md,
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
  },
  headerRight: {
    width: 60,
  },
  listContent: {
    paddingBottom: Layout.md,
  },
  threadCard: {
    backgroundColor: Colors.surface,
    padding: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Layout.sm,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.md,
    gap: Layout.sm,
  },
  avatarLarge: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    borderRadius: Layout.avatarMd / 2,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLargeText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  threadMeta: {
    flex: 1,
  },
  authorName: {
    fontSize: Typography.base,
    fontWeight: '600',
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
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
    lineHeight: Typography.xl * 1.3,
  },
  threadContent: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.7,
    marginBottom: Layout.md,
  },
  threadActions: {
    flexDirection: 'row',
    gap: Layout.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.md,
  },
  actionButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingRight: Layout.md,
  },
  actionButtonActive: {
    opacity: 0.8,
  },
  actionText: {
    fontSize: Typography.base,
    color: Colors.text2,
  },
  actionTextActive: {
    color: Colors.gold,
  },
  commentsLabel: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentsLabelText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  commentCard: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.sm,
    gap: Layout.sm,
  },
  avatar: {
    width: Layout.avatarSm,
    height: Layout.avatarSm,
    borderRadius: Layout.avatarSm / 2,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarText: {
    color: Colors.gold,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  commentTime: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  commentContent: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
  },
  emptyComments: {
    padding: Layout.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.text3,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Layout.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Layout.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radius,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    fontSize: Typography.base,
    color: Colors.text,
    maxHeight: 100,
    minHeight: Layout.buttonHeight,
  },
  sendButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.base,
  },
});