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
  Alert,
  Modal,
  Image as RNImage,
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
  deleteDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { GIPHY_API_KEY } from '../../constants/config';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  displayName?: string;
  authorPhoto: string;
  authorPhotoURL?: string;
  gifUrl?: string;
  parentId?: string;
  likes?: number;
  createdAt: any;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  authorPhoto: string;
  displayName: string;
  category: string;
  likes: number;
  commentCount: number;
  pinned: boolean;
  reactions: Record<string, string>;
  reactionCount: number;
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
  const [replyTo, setReplyTo] = useState<{ id: string; authorName: string } | null>(null);
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showEditThread, setShowEditThread] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<any[]>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [pendingGifUrl, setPendingGifUrl] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
const insets = useSafeAreaInsets();
  const handleCommentLike = async (commentId: string) => {
    if (!user || !threadId || likedCommentIds.has(commentId)) return;
    setLikedCommentIds(prev => new Set(prev).add(commentId));
    await updateDoc(doc(db, 'threads', threadId, 'comments', commentId), {
      likes: increment(1),
    });
    setComments(prev => prev.map(c =>
      c.id === commentId ? { ...c, likes: (c.likes || 0) + 1 } : c
    ));
  };

  // Auth state + admin check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userSnap = await getDoc(doc(db, 'users', authUser.uid));
        setIsAdmin(userSnap.data()?.userRole === 'admin');
      } else {
        setIsAdmin(false);
      }
    });
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
      const data = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Comment[];
      setComments(data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
    return unsubscribe;
  }, [threadId]);

  const handlePostComment = async () => {
    if ((!newComment.trim() && !pendingGifUrl) || !user || !threadId) return;
    setPosting(true);
    try {
      await addDoc(
        collection(db, 'threads', threadId, 'comments'),
        {
          content: newComment.trim(),
          authorId: user.uid,
          authorName: user.displayName || 'Member',
          authorPhoto: user.photoURL || '',
          parentId: replyTo?.id || null,
          ...(pendingGifUrl ? { gifUrl: pendingGifUrl } : {}),
          createdAt: serverTimestamp(),
        }
      );
      await updateDoc(doc(db, 'threads', threadId), {
        commentCount: increment(1),
      });
      setNewComment('');
      setReplyTo(null);
      setPendingGifUrl(null);
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

  const handleDeleteComment = (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'threads', threadId!, 'comments', commentId));
          await updateDoc(doc(db, 'threads', threadId!), { commentCount: increment(-1) });
        },
      },
    ]);
  };

  const handleSaveEditComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    await updateDoc(doc(db, 'threads', threadId!, 'comments', commentId), {
      content: editingCommentText.trim(),
    });
    setEditingCommentId(null);
  };

  const handleDeleteThread = () => {
    Alert.alert('Delete Thread', 'Are you sure you want to delete this thread? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDoc(doc(db, 'threads', threadId!));
          router.back();
        },
      },
    ]);
  };

  const handleSaveEditThread = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    await updateDoc(doc(db, 'threads', threadId!), {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    setThread(prev => prev ? { ...prev, title: editTitle.trim(), content: editContent.trim() } : prev);
    setShowEditThread(false);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const commentLiked = likedCommentIds.has(item.id);
    const replies = comments.filter(c => c.parentId === item.id);

    return (
      <View style={styles.commentCard}>
        <View style={styles.commentHeader}>
          {(item.authorPhotoURL || item.authorPhoto) ? (
            <Image
              source={{ uri: item.authorPhotoURL || item.authorPhoto }}
              style={styles.avatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.displayName || item.authorName)?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
          )}
          <View style={styles.commentMeta}>
            <Text style={styles.commentAuthor}>
              {item.displayName || item.authorName || 'Member'}
            </Text>
            <Text style={styles.commentTime}>{formatTime(item.createdAt)}</Text>
          </View>
        </View>

        {editingCommentId === item.id ? (
          <View style={styles.inlineEditContainer}>
            <TextInput
              style={styles.inlineEditInput}
              value={editingCommentText}
              onChangeText={setEditingCommentText}
              multiline
              autoFocus
            />
            <View style={styles.inlineEditActions}>
              <TouchableOpacity
                style={styles.inlineEditCancel}
                onPress={() => setEditingCommentId(null)}
              >
                <Text style={styles.inlineEditCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.inlineEditSave}
                onPress={() => handleSaveEditComment(item.id)}
              >
                <Text style={styles.inlineEditSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            {item.content ? (
              <Text style={styles.commentContent}>{item.content}</Text>
            ) : null}
            {item.gifUrl ? (
              <RNImage
                source={{ uri: item.gifUrl }}
                style={styles.gifImage}
                resizeMode="contain"
              />
            ) : null}
          </>
        )}

        {/* Action buttons */}
        <View style={styles.commentActions}>
          <TouchableOpacity
            style={styles.commentActionBtn}
            onPress={() => handleCommentLike(item.id)}
          >
            <MaterialCommunityIcons
              name={commentLiked ? 'thumb-up' : 'thumb-up-outline'}
              size={14}
              color={commentLiked ? Colors.gold : Colors.text3}
            />
            {(item.likes || 0) > 0 && (
              <Text style={[styles.commentActionBtnText, commentLiked && styles.commentActionBtnTextActive]}>
                {item.likes}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.commentActionBtn}
            onPress={() => setReplyTo({ id: item.id, authorName: item.authorName })}
          >
            <Ionicons name="chatbubble-outline" size={14} color={Colors.text3} />
          </TouchableOpacity>
          {user?.uid === item.authorId && (
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => {
                setEditingCommentId(item.id);
                setEditingCommentText(item.content);
              }}
            >
              <Ionicons name="pencil-outline" size={14} color={Colors.text3} />
            </TouchableOpacity>
          )}
          {(user?.uid === item.authorId || isAdmin) && (
            <TouchableOpacity
              style={styles.commentActionBtn}
              onPress={() => handleDeleteComment(item.id)}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Replies */}
        {replies.length > 0 && (
          <View style={styles.repliesContainer}>
            {replies.map(reply => (
              <View key={reply.id} style={styles.replyCard}>
                <View style={styles.commentHeader}>
                  <View style={styles.avatar}>
                    {reply.authorPhoto ? (
                      <Image
                        source={{ uri: reply.authorPhoto }}
                        style={styles.avatarImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {reply.authorName?.charAt(0)?.toUpperCase() || 'M'}
                      </Text>
                    )}
                  </View>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{reply.authorName}</Text>
                    <Text style={styles.commentTime}>{formatTime(reply.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.commentContent}>{reply.content}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {thread && (
        <View style={styles.threadCard}>
          <View style={styles.threadHeader}>
            <View style={styles.avatarLarge}>
              {(thread.authorPhotoURL || thread.authorPhoto) ? (
                <Image
                  source={{ uri: thread.authorPhotoURL || thread.authorPhoto }}
                  style={styles.avatarLargeImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarLargeText}>
                  {thread.authorName?.charAt(0)?.toUpperCase() || 'M'}
                </Text>
              )}
            </View>
            <View style={styles.threadMeta}>
              <Text style={styles.authorName}>{thread.authorName}</Text>
              <Text style={styles.timeText}>{formatTime(thread.createdAt)}</Text>
            </View>
            {thread.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{thread.category}</Text>
              </View>
            )}
          </View>

          <Text style={styles.threadTitle}>{thread.title}</Text>
          <Text style={styles.threadContent}>{thread.content}</Text>

          {/* Actions bar */}
          <View style={styles.threadActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
              <MaterialCommunityIcons
                name={liked ? 'thumb-up' : 'thumb-up-outline'}
                size={16}
                color={liked ? Colors.gold : Colors.text2}
              />
              <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                {thread?.likes || 0}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionBtn}>
              <Ionicons name="chatbubble-outline" size={16} color={Colors.text2} />
              <Text style={styles.actionText}>{thread?.commentCount || 0}</Text>
            </View>

            <View style={styles.threadManageActions}>
              {user?.uid === thread.authorId && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => {
                    setEditTitle(thread.title);
                    setEditContent(thread.content);
                    setShowEditThread(true);
                  }}
                >
                  <Ionicons name="pencil-outline" size={16} color={Colors.text2} />
                </TouchableOpacity>
              )}
              {(user?.uid === thread.authorId || isAdmin) && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleDeleteThread}
                >
                  <Ionicons name="trash-outline" size={16} color={Colors.text2} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {showEditThread && (
            <View style={styles.threadEditContainer}>
              <TextInput
                style={styles.threadEditTitleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Thread title"
                placeholderTextColor={Colors.text3}
              />
              <TextInput
                style={styles.threadEditContentInput}
                value={editContent}
                onChangeText={setEditContent}
                placeholder="Thread content"
                placeholderTextColor={Colors.text3}
                multiline
              />
              <View style={styles.inlineEditActions}>
                <TouchableOpacity
                  style={styles.inlineEditCancel}
                  onPress={() => setShowEditThread(false)}
                >
                  <Text style={styles.inlineEditCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.inlineEditSave}
                  onPress={handleSaveEditThread}
                >
                  <Text style={styles.inlineEditSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={styles.commentsLabel}>
        <Text style={styles.commentsLabelText}>Comments</Text>
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
  keyboardVerticalOffset={insets.top + 44}
>
      {/* Back button header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thread</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Comments list */}
      <FlatList
        ref={flatListRef}
        data={comments.filter(c => !c.parentId)}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyComments}>
            <Text style={styles.emptyText}>No comments yet — be the first!</Text>
          </View>
        }
      />

      {/* Comment input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom }]}>
        {replyTo && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText}>Replying to @{replyTo.authorName}</Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}>
              <Text style={styles.replyBannerClose}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          {pendingGifUrl ? (
            <View style={styles.gifPreviewContainer}>
              <RNImage source={{ uri: pendingGifUrl }} style={styles.gifPreview} resizeMode="cover" />
              <TouchableOpacity style={styles.gifPreviewRemove} onPress={() => setPendingGifUrl(null)}>
                <Ionicons name="close-circle" size={18} color={Colors.text2} />
              </TouchableOpacity>
            </View>
          ) : (
            <TextInput
              style={styles.commentInput}
              placeholder={replyTo ? `Reply to ${replyTo.authorName}...` : 'Add a comment...'}
              placeholderTextColor={Colors.text3}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              submitBehavior="newline"
            />
          )}
          <TouchableOpacity
            style={styles.gifButton}
            onPress={() => { setShowGifPicker(true); fetchGifs(''); }}
          >
            <Text style={styles.gifButtonText}>GIF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newComment.trim() && !pendingGifUrl || posting) && styles.sendButtonDisabled,
            ]}
            onPress={handlePostComment}
            disabled={(!newComment.trim() && !pendingGifUrl) || posting}
          >
            {posting ? (
              <ActivityIndicator color={Colors.bg} size="small" />
            ) : (
              <Text style={styles.sendButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* GIF Picker Modal */}
      <Modal visible={showGifPicker} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.gifModal}>
          <View style={styles.gifModalHeader}>
            <Text style={styles.gifModalTitle}>Choose a GIF</Text>
            <TouchableOpacity onPress={() => setShowGifPicker(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.gifSearchRow}>
            <TextInput
              style={styles.gifSearchInput}
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
              columnWrapperStyle={styles.gifGrid}
              contentContainerStyle={{ paddingBottom: insets.bottom + Layout.md }}
              renderItem={({ item }) => {
                const url = item.images?.fixed_width?.url;
                return (
                  <TouchableOpacity
                    style={styles.gifCell}
                    onPress={() => {
                      setPendingGifUrl(item.images?.original?.url || url);
                      setShowGifPicker(false);
                      setGifQuery('');
                    }}
                  >
                    <RNImage source={{ uri: url }} style={styles.gifCellImage} resizeMode="cover" />
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
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
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 0,
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
    color: Colors.gold,
  },
  headerRight: {
    width: 60,
  },
  listContent: {
    paddingBottom: 0,
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
    overflow: 'hidden',
  },
  avatarLargeImage: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    borderRadius: Layout.avatarMd / 2,
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
    gap: Layout.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.sm,
    marginTop: Layout.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: Typography.xs,
    color: Colors.text2,
    fontWeight: '500',
  },
  actionTextActive: {
    color: Colors.gold,
    fontWeight: '700',
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
    paddingVertical: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: Layout.avatarSm,
    height: Layout.avatarSm,
    borderRadius: Layout.avatarSm / 2,
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
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
    flexWrap: 'wrap',
  },
  commentReactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  commentReactionChipActive: {
    backgroundColor: Colors.goldDim,
    borderColor: Colors.gold,
  },
  commentReactionEmoji: {
    fontSize: 12,
  },
  commentReactionCount: {
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '600',
  },
  commentReactionCountActive: {
    color: Colors.gold,
  },
  commentActionBtn: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  commentActionBtnText: {
    fontSize: Typography.xs,
    color: Colors.text3,
    fontWeight: '500',
  },
  commentActionBtnTextActive: {
    color: Colors.gold,
    fontWeight: '700',
  },
  commentReactionPicker: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radius,
    padding: Layout.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Layout.sm,
    alignSelf: 'flex-start',
  },
  repliesContainer: {
    marginTop: Layout.sm,
    marginLeft: Layout.md,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    paddingLeft: Layout.sm,
  },
  replyCard: {
    paddingVertical: 6,
  },
  reactionOption: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radiusSm,
  },
  reactionOptionActive: {
    backgroundColor: Colors.goldDim,
  },
  reactionOptionEmoji: {
    fontSize: 20,
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
  flexDirection: 'column',
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  backgroundColor: Colors.surface,
},
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    backgroundColor: Colors.surface2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  replyBannerText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '500',
  },
  replyBannerClose: {
    fontSize: Typography.base,
    color: Colors.text3,
    paddingLeft: Layout.md,
    lineHeight: Layout.minTouchTarget,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    gap: Layout.sm,
  },
  commentInput: {
   flex: 1,
  backgroundColor: Colors.bg,     // beige input
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Layout.radiusFull, // pill shape like iMessage
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
  fontSize: Typography.base,
  color: Colors.text,              // dark text
  maxHeight: 100,
  minHeight: Layout.buttonHeight,
  },
  sendButton: {
    backgroundColor: Colors.sidebar,  // dark button
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
    color: '#F5F3EF',
    fontWeight: '700',
    fontSize: Typography.base,
  },
  threadManageActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  threadEditContainer: {
    marginTop: Layout.md,
    paddingTop: Layout.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  threadEditTitleInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    padding: Layout.sm,
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  threadEditContentInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    padding: Layout.sm,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: Layout.sm,
  },
  inlineEditContainer: {
    marginTop: 4,
  },
  inlineEditInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    padding: Layout.sm,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: Layout.sm,
  },
  inlineEditActions: {
    flexDirection: 'row',
    gap: Layout.sm,
  },
  inlineEditCancel: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  inlineEditCancelText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '600',
  },
  inlineEditSave: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Layout.radiusSm,
    backgroundColor: Colors.gold,
  },
  inlineEditSaveText: {
    fontSize: Typography.sm,
    color: Colors.bg,
    fontWeight: '700',
  },
  commentAvatar: {
  width: Layout.avatarSm,
  height: Layout.avatarSm,
  borderRadius: Layout.avatarSm / 2,
},
gifImage: {
  width: 160,
  height: 120,
  borderRadius: Layout.radiusSm,
  marginTop: Layout.sm,
  alignSelf: 'flex-start',
  backgroundColor: 'transparent',
  overflow: 'hidden',
},
  gifButton: {
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    borderRadius: Layout.radiusSm,
    backgroundColor: Colors.sidebar,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Layout.buttonHeight,
  },
  gifButtonText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#F5F3EF',
    letterSpacing: 0.5,
  },
  gifPreviewContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  gifPreview: {
    width: 72,
    height: 52,
    borderRadius: Layout.radiusSm,
  },
  gifPreviewRemove: {
    marginLeft: 4,
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
