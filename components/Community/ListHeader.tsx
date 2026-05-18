import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

const CATEGORIES = [
  'All', 'General', 'Questions', 'Wins',
  'Announcements', 'Tool Ideas', 'Feedback',
];

interface ListHeaderProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  showComposer: boolean;
  setShowComposer: (show: boolean) => void;
  isBanned: boolean;
  user: any;
  handlePost: (title: string, content: string) => void;
  posting: boolean;
  ThreadComposer: React.ComponentType<any>;
  nextEvent?: any;
}

function formatEventTime(eventDate: any): string {
  const date = eventDate?.toDate?.() ?? new Date(eventDate);
  const diff = Math.floor((date.getTime() - Date.now()) / 1000);
  if (diff < 3600) return `in ${Math.floor(diff / 60)} minutes`;
  if (diff < 86400) return `in ${Math.floor(diff / 3600)} hours`;
  return `in ${Math.floor(diff / 86400)} days`;
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
  ThreadComposer,
  nextEvent,
}: ListHeaderProps) {
  const router = useRouter();
  return (
    <View>


      {/* Event banner */}
      <TouchableOpacity style={styles.eventBanner} activeOpacity={0.8} onPress={() => router.push('/(app)/events' as any)}>
        <View style={styles.eventBannerInner}>
          <Ionicons name="calendar" size={16} color={Colors.text} />
          <Text style={[styles.eventBannerText, nextEvent && styles.eventBannerTextActive]} numberOfLines={1}>
            {nextEvent
              ? `${nextEvent.eventTitle ?? 'Event'} · is happening ${formatEventTime(nextEvent.eventDate)}`
              : 'No upcoming events · Check back soon'}
          </Text>
        </View>
        <Text style={styles.viewAllText}>View all →</Text>
      </TouchableOpacity>

      {/* Write something */}
      {!isBanned && !showComposer && (
        <TouchableOpacity
          style={styles.composerTrigger}
          onPress={() => setShowComposer(true)}
          activeOpacity={0.7}
        >
          {user?.photoURL ? (
            <Image
              source={{ uri: user.photoURL }}
              style={styles.composerTriggerAvatarImage}
              contentFit="cover"
            />
          ) : (
            <View style={styles.composerTriggerAvatar}>
              <Text style={styles.composerTriggerAvatarText}>
                {user?.displayName?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
          )}
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
        <>
          <View style={styles.postRow}>
            <Text style={styles.postRowTitle}>New Post</Text>
            <TouchableOpacity onPress={() => setShowComposer(false)}>
              <Text style={styles.closeText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <ThreadComposer
            onPost={handlePost}
            onClose={() => setShowComposer(false)}
            posting={posting}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  eventBanner: {
    paddingHorizontal: Layout.md,
    paddingTop: Layout.md,
    paddingBottom: Layout.md,
    backgroundColor: Colors.gold,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    justifyContent: 'center',
  },
  eventBannerText: {
    fontSize: Typography.sm,
    color: Colors.text,
  },
  eventBannerTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: Typography.xs,
    color: Colors.text,
    fontWeight: '600',
    marginLeft: Layout.sm,
    flexShrink: 0,
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
    paddingBottom: Layout.md,
    minHeight: 44,
    justifyContent: 'center',
    borderBottomWidth: 3,
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
  searchRow: {
    paddingHorizontal: Layout.md,
    paddingVertical: 6,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  composerTriggerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerTriggerAvatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
  closeText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '600',
  },
});
