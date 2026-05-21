import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  increment,
  getDocs,
  getCountFromServer,
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
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ListHeader from '../../components/Community/ListHeader';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { onThreadPosted, onLikeReceived } from '../../services/gamification';
import { sendLikeNotification } from '../../services/notifications';

interface Thread {
   id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  displayName: string;
  authorPhotoURL: string;
  authorPhoto: string;
  category: string;
  likes: number;
  commentCount: number;
  pinned: boolean;
  pinnedOrder?: number;
  imageURL: string;
   gifUrl: string;
  isPoll?: boolean;
  poll?: {
    question: string;
    options: string[];
    votes: Record<string, number>;
    totalVotes: number;
  };
  createdAt: any;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL: string;
  displayName: string;
  gifUrl: string;
  likes: number;
  likedBy: string[];
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


export default function CommunityScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userPhotoURL, setUserPhotoURL] = useState<string>('');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pinnedThreads, setPinnedThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showComposer, setShowComposer] = useState(false);
  const [posting, setPosting] = useState(false);
  const [likedThreadIds, setLikedThreadIds] = useState<Set<string>>(new Set());
  const [isBanned, setIsBanned] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [nextEvent, setNextEvent] = useState<any>(null);
  const unreadCount = useUnreadCount();

  const handleLike = async (threadId: string) => {
    if (likedThreadIds.has(threadId)) return;
    setLikedThreadIds(prev => new Set(prev).add(threadId));

    const thread = threads.find(t => t.id === threadId);

    await updateDoc(doc(db, 'threads', threadId), { likes: increment(1) });
    setThreads(prev => prev.map(t =>
      t.id === threadId ? { ...t, likes: (t.likes || 0) + 1 } : t
    ));

    if (thread && thread.authorId !== user?.uid) {
      const recipientToken = await sendLikeNotification(
        thread.authorId,
        user?.displayName || 'Someone',
        thread.title,
        threadId
      );

      await addDoc(collection(db, 'notifications'), {
        userId: thread.authorId,
        type: 'like',
        message: `${user?.displayName || 'Someone'} liked your thread`,
        threadId,
        threadTitle: thread.title,
        read: false,
        recipientToken: recipientToken || '',
        createdAt: serverTimestamp(),
      });

      const userSnap = await getDoc(doc(db, 'users', thread.authorId));
      const totalLikes = (userSnap.data()?.totalLikesReceived || 0) + 1;
      await updateDoc(doc(db, 'users', thread.authorId), {
        totalLikesReceived: increment(1),
      });
      await onLikeReceived(thread.authorId, totalLikes);
    }
  };

 useEffect(() => {
  const q = query(
    collection(db, 'Events'),
    limit(10)
  );
  getDocs(q).then(snap => {
    const upcoming = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as any))
      .find(e => e.status === 'upcoming');
    setNextEvent(upcoming ?? null);
  }).catch(() => setNextEvent(null));
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userSnap = await getDoc(doc(db, 'users', authUser.uid));
        setIsBanned(userSnap.data()?.banned === true);
        setUserPhotoURL(userSnap.data()?.photoURL || authUser.photoURL || '');
      } else {
        setIsBanned(false);
        setUserPhotoURL('');
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const pinnedQ = query(
      collection(db, 'threads'),
      where('pinned', '==', true),
      orderBy('pinnedOrder', 'asc')
    );
    const unsubscribePinned = onSnapshot(pinnedQ, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Thread[];
      setPinnedThreads(data);
    }, (error) => {
      console.log('Pinned threads error:', error);
    });
    return unsubscribePinned;
  }, []);

  useEffect(() => {
  setLoading(true);

  // Fallback — stop showing spinner after 5 seconds
  const timeout = setTimeout(() => {
    setLoading(false);
  }, 5000);

  const q = query(
    collection(db, 'threads'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );
  const unsubscribe = onSnapshot(q, (snapshot) => {
    clearTimeout(timeout);  // cancel timeout if data arrives
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Thread[];
    setThreads(data);
    setLoading(false);
    setRefreshing(false);
  }, (error) => {
    clearTimeout(timeout);
    console.log('Firestore error:', error);
    setLoading(false);
  });

  return () => {
    unsubscribe();
    clearTimeout(timeout);
  };
}, []);

  const filteredThreads = threads.filter(t => {
    const matchesCategory = selectedCategory === 'All' ||
      t.category?.toLowerCase() === selectedCategory.toLowerCase();
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      t.title?.toLowerCase().includes(q) ||
      t.content?.toLowerCase().includes(q) ||
      t.authorName?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const allThreads = [
    ...pinnedThreads,
    ...filteredThreads.filter(t => !t.pinned),
  ];

  const handlePost = async (
  title: string,
  content: string,
  category: string,
  mediaUrl?: string,
  poll?: any
) => {
  if (!title.trim() || !content.trim() || !user) return;
  setPosting(true);
  try {
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    const photoURL = userSnap.exists()
      ? (userSnap.data().photoURL || user.photoURL || '')
      : (user.photoURL || '');

    const isGif = mediaUrl?.includes('giphy.com') || 
                  mediaUrl?.endsWith('.gif');

    await addDoc(collection(db, 'threads'), {
      title: title.trim(),
      content: content.trim(),
      authorId: user.uid,
      authorName: user.displayName || 'Member',
      authorPhotoURL: photoURL,
      category: category || 'General',
      imageURL: !isGif ? (mediaUrl || '') : '',
      gifUrl: isGif ? (mediaUrl || '') : '',
      isPoll: !!poll,
      poll: poll || null,
      likes: 0,
      commentCount: 0,
      pinned: false,
      createdAt: serverTimestamp(),
    });

    const threadsQuery = query(
      collection(db, 'threads'),
      where('authorId', '==', user.uid)
    );
    const threadsSnap = await getCountFromServer(threadsQuery);
    await onThreadPosted(user.uid, threadsSnap.data().count);

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

  const renderPoll = (item: Thread, poll: NonNullable<Thread['poll']>) => {
    const totalVotes = poll.totalVotes || 0;
    const hasVoted = !!(user && poll.votes?.[user.uid] !== undefined);
    const userVote = user ? poll.votes?.[user.uid] : undefined;

    return (
      <View style={styles.pollPreview}>
        <View style={styles.pollBadge}>
          <Ionicons name="stats-chart-outline" size={11} color={Colors.gold} />
          <Text style={styles.pollBadgeText}>POLL</Text>
        </View>
        <Text style={styles.pollPreviewQuestion} numberOfLines={2}>
          {poll.question}
        </Text>
        {poll.options.map((opt, i) => {
          const optionVotes = Object.values(poll.votes || {}).filter(v => v === i).length;
          const percent = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
          const isSelected = userVote === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.pollOption, isSelected && styles.pollOptionSelected]}
              onPress={async () => {
                if (!user || hasVoted) return;
                await updateDoc(doc(db, 'threads', item.id), {
                  [`poll.votes.${user.uid}`]: i,
                  'poll.totalVotes': increment(1),
                });
              }}
              disabled={hasVoted}
              activeOpacity={hasVoted ? 1 : 0.7}
            >
              {hasVoted && <View style={[styles.pollProgressBar, { width: `${percent}%` as any }]} />}
              <View style={styles.pollOptionInner}>
                <Text style={[styles.pollOptionText, isSelected && styles.pollOptionTextSelected]} numberOfLines={1}>
                  {isSelected ? '✓ ' : ''}{opt}
                </Text>
                {hasVoted && <Text style={styles.pollPercent}>{percent}%</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.pollVoteCount}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
        </Text>
      </View>
    );
  };

  const renderThread = ({ item }: { item: Thread }) => (
    <TouchableOpacity
      style={[styles.threadCard, item.pinned && styles.threadCardPinned]}
      activeOpacity={0.7}
      onPress={() => router.push({
        pathname: '/thread-detail',
        params: { threadId: item.id }
      } as any)}
    >
     <View style={styles.threadHeader}>
  <View style={styles.avatar}>
    {(item.authorPhotoURL || item.authorPhoto || (item.authorId === user?.uid && userPhotoURL)) ? (
      <Image
        source={{ uri: item.authorPhotoURL || item.authorPhoto || userPhotoURL }}
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
      {item.authorName || item.displayName || 'Member'}
    </Text>
    <Text style={styles.timeText}>
      {formatTime(item.createdAt)}{item.category ? ` · ${item.category}` : ''}
    </Text>
  </View>
  {item.pinned ? (
    <View style={styles.pinnedBadge}>
      <Text style={styles.pinnedText}>📌 Pinned</Text>
    </View>
  ) : null}
</View>
<View style={styles.contentRow}>
  <View style={styles.contentLeft}>
    <Text style={styles.threadTitle}>{item.title}</Text>
    <Text style={styles.threadContent} numberOfLines={2}>
      {item.content}
    </Text>
  </View>

  {item.imageURL ? (
    <Image
      source={{ uri: item.imageURL }}
      style={styles.threadThumbnail}
      contentFit="cover"
    />
  ) : null}
</View>

      {item.gifUrl ? (
        <Image
          source={{ uri: item.gifUrl }}
          style={styles.threadGif}
          contentFit="cover"
        />
      ) : null}

    {item.isPoll && item.poll && renderPoll(item, item.poll)}

      <View style={styles.threadFooter}>
        <TouchableOpacity
          style={styles.footerAction}
          onPress={() => handleLike(item.id)}
        >
          <MaterialCommunityIcons
            name={likedThreadIds.has(item.id) ? 'thumb-up' : 'thumb-up-outline'}
            size={14}
            color={likedThreadIds.has(item.id) ? Colors.gold : Colors.text}
          />
          <Text style={[styles.footerActionText, likedThreadIds.has(item.id) && styles.footerActionTextActive]}>
            {' '}{item.likes || 0}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
        style={styles.footerAction}
        onPress={() => router.push({
        pathname: '/thread-detail',
        params: { threadId: item.id }
        } as any)}
        >
      <Ionicons name="chatbubble-outline"
        size={14}
        color={Colors.text}
        />
      <Text style={styles.footerActionText}>
      {' '}{item.commentCount || 0}
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
      <Header
        notificationCount={unreadCount}
        showSearch
        isSearching={isSearching}
        searchQuery={searchQuery}
        onSearchPress={() => setIsSearching(true)}
        onSearchChange={setSearchQuery}
        onSearchClose={() => { setIsSearching(false); setSearchQuery(''); }}
      />

      {isBanned && (
        <View style={styles.bannedBanner}>
          <Text style={styles.bannedBannerText}>
            Your account has been restricted from posting.
          </Text>
        </View>
      )}

      <FlatList
        data={allThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
       ListHeaderComponent={() => (
  <ListHeader
    selectedCategory={selectedCategory}
    setSelectedCategory={setSelectedCategory}
    showComposer={showComposer}
    setShowComposer={setShowComposer}
    isBanned={isBanned}
    isSearching={isSearching}
    user={user}
    userPhotoURL={userPhotoURL}
    nextEvent={nextEvent}
    handlePost={handlePost}
    posting={posting}
  />
)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              const q = query(
                collection(db, 'threads'),
                orderBy('createdAt', 'desc'),
                limit(20)
              );
              getDocs(q).then(snapshot => {
                const data = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data(),
                })) as Thread[];
                setThreads(data);
                setRefreshing(false);
              }).catch(() => setRefreshing(false));
            }}
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
  paddingTop: 0, 
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
  newPostText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  categoryContainer: {
    paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
  backgroundColor: Colors.bg,  // match page background
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  },
  threadGif: {
  width: '100%',
  height: 200,
  borderRadius: Layout.radiusSm,
  marginTop: Layout.sm,
  backgroundColor: Colors.surface2,
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
  filterRow: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: Layout.md,
  paddingVertical: 6,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  backgroundColor: Colors.surface,
  gap: Layout.sm,
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
  paddingHorizontal: Layout.lg,
  paddingVertical: Layout.md,
  paddingTop: Layout.lg,
  marginBottom: 6,
  marginHorizontal: Layout.md,
  borderRadius: Layout.radiusSm,
  borderWidth: 1,
  borderColor: Colors.border,
  },
  threadCardPinned: {
  borderWidth: 1.5,
  borderColor: Colors.gold,
  borderBottomWidth: 1.5,
  borderBottomColor: Colors.gold,
  shadowColor: Colors.gold,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.12,
  shadowRadius: 4,
  elevation: 2,
  },
  pinnedBadge: {
  backgroundColor: Colors.goldDim,
  borderRadius: Layout.radiusFull,
  paddingHorizontal: Layout.sm,
  paddingVertical: 2,
  borderWidth: 1,
  borderColor: Colors.gold,
  },
  pinnedText: {
    fontSize: Typography.xs,
  color: Colors.gold,
  fontWeight: '700',
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Layout.sm,
    gap: Layout.sm,
  },
  avatar: {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: Colors.gold,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
},
  avatarImage: {
  width: 36,
  height: 36,
  borderRadius: 18,
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
  fontSize: Typography.base,    // smaller than before
  fontWeight: '700',
  color: Colors.text,
  marginBottom: 4,
  lineHeight: Typography.base * 1.3,
  },
  threadContent: {
   fontSize: Typography.sm,      // smaller preview text
  color: Colors.text2,
  lineHeight: Typography.sm * 1.5,
  marginBottom: Layout.sm,     // less margin
  },
  threadFooter: {
  flexDirection: 'row',
  gap: Layout.md,
  paddingTop: Layout.xs, 
  },
  footerAction: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  minHeight: 32,               // smaller touch target
  justifyContent: 'center',
  paddingRight: Layout.sm,
  },
  footerActionText: {
    fontSize: Typography.sm,     // smaller count text
  color: Colors.text,
  },
  footerActionTextActive: {
    color: Colors.gold,
    fontWeight: '700',
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
  bannedBanner: {
    marginHorizontal: Layout.md,
    marginBottom: Layout.sm,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
  },
  bannedBannerText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    textAlign: 'center',
  },
  composerTrigger: {
   flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: Colors.surface,
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.md,
  borderBottomWidth: 1,
  borderTopWidth: 1,
  borderColor: Colors.border,
  minHeight: 52,
  gap: Layout.sm,
},
composerTriggerAvatarImage: {
  width: 28,
  height: 28,
  borderRadius: 14,
},
composerTriggerAvatar: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: Colors.gold,
  alignItems: 'center',
  justifyContent: 'center'
},
composerTriggerAvatarText: {
  fontSize: Typography.sm,
  fontWeight: '700',
  color: Colors.bg,
},
composerTriggerText: {
   fontSize: Typography.base,   
  color: Colors.text2,         
  flex: 1,
},
contentRow: {
  flexDirection: 'row',
  gap: Layout.sm,
  marginBottom: Layout.sm,
},
contentLeft: {
  flex: 1,
},
threadThumbnail: {
  width: 72,
  height: 72,
  borderRadius: Layout.radiusSm,
  flexShrink: 0,
  backgroundColor: Colors.surface2,
},
eventBanner: {
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
  backgroundColor: Colors.bg,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
  minHeight: 36,
  justifyContent: 'center',
},
eventBannerText: {
  fontSize: Typography.xs,
  color: Colors.text3,
},
eventBannerInner: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: Layout.sm,
  justifyContent: 'center',
},
topTabScroll: {
 backgroundColor: Colors.surface,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},
topTabList: {
  paddingHorizontal: Layout.md,
  gap: 0,
},
topTab: {
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
  paddingBottom: Layout.md,    // more bottom padding
  minHeight: 44,               // taller
  justifyContent: 'center',
  borderBottomWidth: 3,        // thicker underline
  borderBottomColor: 'transparent',
},
topTabActive: {
  borderBottomColor: Colors.gold,
},
topTabText: {
  fontSize: Typography.sm,
  color: Colors.text2,
  fontWeight: '500',
},
topTabTextActive: {
  color: Colors.text,
  fontWeight: '700',
},
filterDropdown: {
  width: 100,
},
searchInput: {
  flex: 1,
  backgroundColor: Colors.surface2,
  borderWidth: 1,
  borderColor: Colors.border,
  borderRadius: Layout.radiusSm,
  paddingHorizontal: Layout.md,
  paddingVertical: 6,
  fontSize: Typography.sm,
  color: Colors.text,
  minHeight: 36,
},
pollPreview: {
  backgroundColor: Colors.surface,
  borderRadius: Layout.radiusSm,
  padding: Layout.md,
  marginTop: Layout.sm,
  borderWidth: 1,
  borderColor: Colors.border,
  gap: Layout.sm,
},
pollBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
},
pollBadgeText: {
  fontSize: 10,
  fontWeight: '700',
  color: Colors.gold,
  letterSpacing: 0.5,
},
pollPreviewQuestion: {
  fontSize: Typography.base,
  fontWeight: '700',
  color: Colors.text,
},
pollOption: {
  borderRadius: Layout.radiusSm,
  borderWidth: 1,
  borderColor: Colors.border,
  backgroundColor: Colors.surface,
  overflow: 'hidden',
  minHeight: 40,
  justifyContent: 'center',
  position: 'relative',
},
pollOptionSelected: {
  borderColor: Colors.gold,
},
pollProgressBar: {
  position: 'absolute',
  top: 0,
  left: 0,
  bottom: 0,
  backgroundColor: Colors.goldDim,
  borderRadius: Layout.radiusSm,
},
pollOptionInner: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.sm,
},
pollOptionText: {
  fontSize: Typography.sm,
  color: Colors.text,
  flex: 1,
},
pollOptionTextSelected: {
  color: Colors.gold,
  fontWeight: '600',
},
pollPercent: {
  fontSize: Typography.xs,
  color: Colors.text2,
  fontWeight: '600',
  marginLeft: Layout.sm,
},
pollVoteCount: {
  fontSize: Typography.xs,
  color: Colors.text3,
  marginTop: 4,
},
});
