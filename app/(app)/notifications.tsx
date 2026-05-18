import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Notification {
  id: string;
  type: string;
  message: string;
  threadId: string;
  threadTitle: string;
  read: boolean;
  createdAt: any;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Notification[];
      setNotifications(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await updateDoc(
      doc(db, 'notifications', notificationId),
      { read: true }
    );
  };

  const handleNotificationPress = async (item: Notification) => {
    await markAsRead(item.id);
    if (item.threadId) {
      router.push({
        pathname: '/thread-detail',
        params: { threadId: item.threadId }
      } as any);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    await Promise.all(
      unread.map(n =>
        updateDoc(doc(db, 'notifications', n.id), { read: true })
      )
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'comment': return 'chatbubble-outline';
      case 'like': return 'thumbs-up-outline';
      case 'mention': return 'at-outline';
      case 'event': return 'calendar-outline';
      default: return 'notifications-outline';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !item.read && styles.unreadCard,
      ]}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
    >
      {/* Icon */}
      <View style={[
        styles.iconContainer,
        !item.read && styles.iconContainerUnread,
      ]}>
        <Ionicons
          name={getNotificationIcon(item.type) as any}
          size={18}
          color={item.read ? Colors.text3 : Colors.gold}
        />
      </View>

      {/* Content */}
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationMessage,
          !item.read && styles.unreadMessage,
        ]}>
          {item.message}
        </Text>
        {item.threadTitle && (
          <Text style={styles.threadTitle} numberOfLines={1}>
            {item.threadTitle}
          </Text>
        )}
        <Text style={styles.notificationTime}>
          {formatTime(item.createdAt)}
        </Text>
      </View>

      {/* Unread dot */}
      {!item.read && (
        <View style={styles.unreadDot} />
      )}
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllRead}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {/* Unread count */}
      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="notifications-outline"
              size={48}
              color={Colors.text3}
            />
            <Text style={styles.emptyTitle}>
              No notifications yet
            </Text>
            <Text style={styles.emptySubtitle}>
              You'll see activity on your threads here
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
  markAllButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
  },
  headerRight: {
    width: 80,
  },
  unreadBanner: {
    backgroundColor: Colors.goldDim,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unreadBannerText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: Layout.xl,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: Layout.md,
  },
  unreadCard: {
    backgroundColor: Colors.bg,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconContainerUnread: {
    backgroundColor: Colors.goldDim,
  },
  notificationContent: {
    flex: 1,
  },
  notificationMessage: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.4,
    marginBottom: 4,
  },
  unreadMessage: {
    color: Colors.text,
    fontWeight: '600',
  },
  threadTitle: {
    fontSize: Typography.sm,
    color: Colors.text3,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gold,
    marginTop: 6,
    flexShrink: 0,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
    gap: Layout.md,
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
  },
});