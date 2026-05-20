import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import Header from '../../components/Shared/Header';
import { useUnreadCount } from '../../hooks/useUnreadCount';

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  unreadCount: Record<string, number>;
  otherUserName: string;
  otherUserPhoto: string;
  otherUserId: string;
}

export default function InboxScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = useUnreadCount();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const docData = d.data();
        const otherUserId = (docData.participants as string[]).find(
          (p) => p !== user.uid
        ) || '';
        return {
          id: d.id,
          ...docData,
          otherUserId,
          otherUserName: docData.participantNames?.[otherUserId] || 'Member',
          otherUserPhoto: docData.participantPhotos?.[otherUserId] || '',
        };
      }) as Conversation[];
      setConversations(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const myUnread = item.unreadCount?.[user?.uid || ''] || 0;
    const hasUnread = myUnread > 0;

    return (
      <TouchableOpacity
        style={[styles.row, hasUnread && styles.rowUnread]}
        activeOpacity={0.7}
        onPress={() => router.push({
          pathname: '/conversation',
          params: {
            conversationId: item.id,
            otherUserId: item.otherUserId,
            otherUserName: item.otherUserName,
          }
        } as any)}
      >
        {/* Avatar */}
        {item.otherUserPhoto ? (
          <Image
            source={{ uri: item.otherUserPhoto }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {item.otherUserName?.charAt(0)?.toUpperCase() || 'M'}
            </Text>
          </View>
        )}

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.name, hasUnread && styles.nameUnread]}>
              {item.otherUserName}
            </Text>
            <Text style={styles.time}>
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
          <View style={styles.rowBottom}>
            <Text
              style={[styles.lastMessage, hasUnread && styles.lastMessageUnread]}
              numberOfLines={1}
            >
              {item.lastMessage || 'No messages yet'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{myUnread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
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
      <Header subtitle="Inbox" notificationCount={unreadCount} />
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Visit a member's profile to start a conversation
            </Text>
          </View>
        }
      />
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
  listContent: {
    paddingBottom: Layout.tabBarHeight + Layout.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Layout.md,
  },
  rowUnread: {
    backgroundColor: Colors.bg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    flexShrink: 0,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarFallbackText: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.bg,
  },
  rowContent: {
    flex: 1,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text2,
  },
  nameUnread: {
    color: Colors.text,
    fontWeight: '700',
  },
  time: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: Typography.sm,
    color: Colors.text3,
    flex: 1,
  },
  lastMessageUnread: {
    color: Colors.text2,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusFull,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Layout.sm,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.bg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
    paddingHorizontal: Layout.xl,
    gap: Layout.md,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
  },
});