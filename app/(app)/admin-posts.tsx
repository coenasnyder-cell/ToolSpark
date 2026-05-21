import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  pinnedOrder: number;
  authorName: string;
  createdAt: any;
}

const CATEGORIES = [
  'General', 'Questions', 'Wins',
  'Announcements', 'Tool Ideas', 'Feedback',
];

export default function AdminPostsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [pinnedThreads, setPinnedThreads] = useState<Thread[]>([]);
  const [recentThreads, setRecentThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Quick post form
  const [showComposer, setShowComposer] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postCategory, setPostCategory] = useState('Announcements');
  const [pinPost, setPinPost] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load pinned threads
      const pinnedQuery = query(
        collection(db, 'threads'),
        where('pinned', '==', true),
        orderBy('pinnedOrder', 'asc')
      );
      const pinnedSnap = await getDocs(pinnedQuery);
      setPinnedThreads(pinnedSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Thread[]);

      // Load recent threads
      const recentQuery = query(
        collection(db, 'threads'),
        orderBy('createdAt', 'desc'),
        limit(15)
      );
      const recentSnap = await getDocs(recentQuery);
      setRecentThreads(recentSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Thread[]);
    } catch (err) {
      console.log('Load posts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePin = async (thread: Thread) => {
    setSaving(thread.id);
    try {
      await updateDoc(doc(db, 'threads', thread.id), {
        pinned: true,
        pinnedOrder: 99,
      });
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'Could not pin thread.');
    } finally {
      setSaving(null);
    }
  };

  const handleUnpin = async (thread: Thread) => {
    Alert.alert(
      'Unpin Thread',
      `Unpin "${thread.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpin',
          style: 'destructive',
          onPress: async () => {
            setSaving(thread.id);
            try {
              await updateDoc(doc(db, 'threads', thread.id), {
                pinned: false,
                pinnedOrder: 99,
              });
              await loadData();
            } catch (err) {
              Alert.alert('Error', 'Could not unpin thread.');
            } finally {
              setSaving(null);
            }
          },
        },
      ]
    );
  };

  const handleOrderChange = async (thread: Thread, newOrder: number) => {
    setSaving(thread.id);
    try {
      await updateDoc(doc(db, 'threads', thread.id), {
        pinnedOrder: newOrder,
      });
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'Could not update order.');
    } finally {
      setSaving(null);
    }
  };

  const handleQuickPost = async () => {
    if (!postTitle.trim() || !postContent.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'threads'), {
        title: postTitle.trim(),
        content: postContent.trim(),
        category: postCategory,
        authorId: user.uid,
        authorName: user.displayName || 'Admin',
        displayName: user.displayName || 'Admin',
        authorPhotoURL: user.photoURL || '',
        pinned: pinPost,
        pinnedOrder: pinPost ? 99 : 0,
        likes: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
      });
      setPostTitle('');
      setPostContent('');
      setPinPost(true);
      setShowComposer(false);
      Alert.alert('Posted', 'Thread created successfully.');
      await loadData();
    } catch (err) {
      Alert.alert('Error', 'Could not create post.');
    } finally {
      setPosting(false);
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Posts</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowComposer(!showComposer)}
        >
          <Ionicons
            name={showComposer ? 'close' : 'add'}
            size={24}
            color={Colors.gold}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick composer */}
        {showComposer && (
          <View style={styles.composerCard}>
            <Text style={styles.composerTitle}>Quick Post</Text>

            <TextInput
              style={styles.composerInput}
              placeholder="Thread title..."
              placeholderTextColor={Colors.text3}
              value={postTitle}
              onChangeText={setPostTitle}
            />
            <TextInput
              style={[styles.composerInput, styles.composerTextarea]}
              placeholder="Write your post..."
              placeholderTextColor={Colors.text3}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              textAlignVertical="top"
            />

            {/* Category picker */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    postCategory === cat && styles.categoryChipActive,
                  ]}
                  onPress={() => setPostCategory(cat)}
                >
                  <Text style={[
                    styles.categoryChipText,
                    postCategory === cat && styles.categoryChipTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pin toggle */}
            <TouchableOpacity
              style={styles.pinToggle}
              onPress={() => setPinPost(!pinPost)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.pinToggleCheck,
                pinPost && styles.pinToggleCheckActive,
              ]}>
                {pinPost && (
                  <Ionicons name="checkmark" size={12} color={Colors.bg} />
                )}
              </View>
              <Text style={styles.pinToggleText}>
                Pin this post to the top of the feed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.postButton,
                (!postTitle.trim() || !postContent.trim()) &&
                  styles.postButtonDisabled,
              ]}
              onPress={handleQuickPost}
              disabled={
                posting || !postTitle.trim() || !postContent.trim()
              }
            >
              {posting ? (
                <ActivityIndicator size="small" color={Colors.bg} />
              ) : (
                <Text style={styles.postButtonText}>Post Thread</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Pinned threads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pinned Posts · {pinnedThreads.length}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Tap order buttons to rearrange
          </Text>

          {pinnedThreads.length === 0 ? (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No pinned posts</Text>
            </View>
          ) : (
            pinnedThreads.map((thread, index) => (
              <View key={thread.id} style={styles.pinnedCard}>
                <View style={styles.orderButtons}>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() =>
                      handleOrderChange(thread, Math.max(1, (thread.pinnedOrder || index + 1) - 1))
                    }
                    disabled={saving === thread.id || index === 0}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={16}
                      color={index === 0 ? Colors.border : Colors.text2}
                    />
                  </TouchableOpacity>
                  <Text style={styles.orderNumber}>{index + 1}</Text>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() =>
                      handleOrderChange(thread, (thread.pinnedOrder || index + 1) + 1)
                    }
                    disabled={
                      saving === thread.id ||
                      index === pinnedThreads.length - 1
                    }
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={
                        index === pinnedThreads.length - 1
                          ? Colors.border
                          : Colors.text2
                      }
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.threadInfo}>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {thread.title}
                  </Text>
                  <Text style={styles.threadMeta}>
                    {thread.category} · {thread.authorName}
                  </Text>
                </View>

                {saving === thread.id ? (
                  <ActivityIndicator size="small" color={Colors.gold} />
                ) : (
                  <TouchableOpacity
                    style={styles.unpinButton}
                    onPress={() => handleUnpin(thread)}
                  >
                    <Text style={styles.unpinButtonText}>Unpin</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Recent threads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Threads</Text>
          <Text style={styles.sectionSubtitle}>
            Pin any thread to the top of the feed
          </Text>

          {recentThreads
            .filter(t => !t.pinned)
            .map(thread => (
              <View key={thread.id} style={styles.recentCard}>
                <View style={styles.threadInfo}>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {thread.title}
                  </Text>
                  <Text style={styles.threadMeta}>
                    {thread.category} · {thread.authorName}
                  </Text>
                </View>

                {saving === thread.id ? (
                  <ActivityIndicator size="small" color={Colors.gold} />
                ) : (
                  <TouchableOpacity
                    style={styles.pinButton}
                    onPress={() => handlePin(thread)}
                  >
                    <Ionicons
                      name="bookmark-outline"
                      size={14}
                      color={Colors.gold}
                    />
                    <Text style={styles.pinButtonText}>Pin</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
        </View>

        {/* Web admin note */}
        <View style={styles.webNote}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={Colors.text3}
          />
          <Text style={styles.webNoteText}>
            For advanced options like bulk management and analytics, visit the web admin at{' '}
            <Text style={styles.webNoteLink}>toolspark.co/adminthreads</Text>
          </Text>
        </View>
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
  addButton: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: Layout.md,
    paddingBottom: Layout.xxl,
  },

  // Composer
  composerCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    marginBottom: Layout.lg,
  },
  composerTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
  },
  composerInput: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: 12,
    fontSize: Typography.base,
    color: Colors.text,
    marginBottom: Layout.sm,
    minHeight: 48,
  },
  composerTextarea: {
    minHeight: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  fieldLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.sm,
    marginTop: Layout.sm,
  },
  categoryScroll: {
    marginBottom: Layout.md,
  },
  categoryChip: {
    paddingHorizontal: Layout.md,
    paddingVertical: 6,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
    marginRight: Layout.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text2,
  },
  categoryChipTextActive: {
    color: Colors.bg,
    fontWeight: '700',
  },
  pinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    marginBottom: Layout.md,
  },
  pinToggleCheck: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinToggleCheckActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  pinToggleText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    flex: 1,
  },
  postButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    opacity: 0.4,
  },
  postButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.bg,
  },

  // Sections
  section: {
    marginBottom: Layout.lg,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: Layout.md,
  },
  emptySection: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.text3,
  },

  // Pinned card
  pinnedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.sm,
    gap: Layout.md,
  },
  orderButtons: {
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  orderBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderNumber: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.gold,
    minWidth: 16,
    textAlign: 'center',
  },
  threadInfo: {
    flex: 1,
  },
  threadTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  threadMeta: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  unpinButton: {
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
    borderColor: Colors.error,
    flexShrink: 0,
  },
  unpinButtonText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.error,
  },

  // Recent card
  recentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.sm,
    gap: Layout.md,
  },
  pinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
    flexShrink: 0,
  },
  pinButtonText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.gold,
  },

  // Web note
  webNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.sm,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Layout.sm,
  },
  webNoteText: {
    flex: 1,
    fontSize: Typography.xs,
    color: Colors.text3,
    lineHeight: Typography.xs * 1.6,
  },
  webNoteLink: {
    color: Colors.gold,
    fontWeight: '600',
  },
});