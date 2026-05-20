import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
} from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { BADGE_INFO } from '../../services/gamification';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Member {
  displayName: string;
  photoURL: string;
  userRole: string;
  bio: string;
  createdAt: any;
  userEmail: string;
  website: string;
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
  projectTitle: string;
  projectDescription: string;
  projectImageURL: string;
  badges: string[];
  points: number;
  streak: number;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  likes: number;
  commentCount: number;
  createdAt: any;
  category: string;
}

export default function MemberProfileScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [member, setMember] = useState<Member | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadCount, setThreadCount] = useState(0);
  const [expandedBadge, setExpandedBadge] = useState<string | null>(null);
  useEffect(() => {
    if (userId) {
      loadMember();
      loadMemberThreads();
    }
  }, [userId]);

  const loadMember = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', userId!));
      if (snap.exists()) setMember(snap.data() as Member);
    } catch (err) {
      console.log('Load member error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMemberThreads = async () => {
    try {
      const q = query(
        collection(db, 'threads'),
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Thread[];
      setThreads(data);
      setThreadCount(snap.docs.length);
    } catch (err) {
      console.log('Load threads error:', err);
    }
  };

  const formatJoined = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    const now = new Date();
    const diff = Math.floor(
      (now.getTime() - date.getTime()) / 1000
    );
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const openURL = (url: string) => {
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    Linking.openURL(fullUrl);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Member not found</Text>
      </View>
    );
  }

  const hasSocials = member.website || member.instagram ||
    member.twitter || member.linkedin || member.youtube;
  const badges = member.badges || [];

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
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Compact profile row */}
        <View style={styles.profileRow}>
          {member.photoURL ? (
            <Image
              source={{ uri: member.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {member.displayName?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
          )}

          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{member.displayName}</Text>
              {member.userRole === 'admin' && (
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>★ Admin</Text>
                </View>
              )}
            </View>
            <Text style={styles.joined}>
              Member since {formatJoined(member.createdAt)}
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>
                <Text style={styles.statNumber}>{threadCount}</Text>
                {' '}posts
              </Text>
              {(member.points || 0) > 0 && (
                <Text style={styles.statText}>
                  <Text style={styles.statNumber}>{member.points}</Text>
                  {' '}pts
                </Text>
              )}
              {(member.streak || 0) >= 3 && (
                <Text style={styles.statText}>
                  🔥 <Text style={styles.statNumber}>{member.streak}</Text>
                  {' '}day streak
                </Text>
              )}
            </View>
          </View>

          <TouchableOpacity
  style={styles.messageButton}
  onPress={() => router.push({
    pathname: '/conversation',
    params: {
      otherUserId: userId,
      otherUserName: member.displayName,
    }
  } as any)}
>
  <Ionicons
    name="chatbubble-outline"
    size={18}
    color={Colors.text2}
  />
</TouchableOpacity>
        </View>

        {/* Bio */}
        {member.bio ? (
          <View style={styles.bioSection}>
            <Text style={styles.bioText}>{member.bio}</Text>
          </View>
        ) : null}

        {/* Social links */}
        {hasSocials && (
          <View style={styles.socialsRow}>
            {member.website && (
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => openURL(member.website)}
              >
                <Ionicons name="globe-outline" size={20} color={Colors.text2} />
              </TouchableOpacity>
            )}
            {member.instagram && (
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => openURL(`https://instagram.com/${member.instagram}`)}
              >
                <Ionicons name="logo-instagram" size={20} color={Colors.text2} />
              </TouchableOpacity>
            )}
            {member.twitter && (
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => openURL(`https://twitter.com/${member.twitter}`)}
              >
                <Ionicons name="logo-twitter" size={20} color={Colors.text2} />
              </TouchableOpacity>
            )}
            {member.linkedin && (
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => openURL(`https://linkedin.com/in/${member.linkedin}`)}
              >
                <Ionicons name="logo-linkedin" size={20} color={Colors.text2} />
              </TouchableOpacity>
            )}
            {member.youtube && (
              <TouchableOpacity
                style={styles.socialIcon}
                onPress={() => openURL(member.youtube)}
              >
                <Ionicons name="logo-youtube" size={20} color={Colors.text2} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Badges ── */}
        {badges.length > 0 && (
          <>
            <View style={styles.divider} />
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Badges · {badges.length}
              </Text>
              <View style={styles.badgeGrid}>
                {badges.map((badgeId) => {
                  const info = BADGE_INFO[badgeId];
                  if (!info) return null;
                  const isExpanded = expandedBadge === badgeId;
                  return (
                    <TouchableOpacity
                      key={badgeId}
                      style={[
                        styles.badgeChip,
                        isExpanded && styles.badgeChipExpanded,
                      ]}
                      onPress={() =>
                        setExpandedBadge(isExpanded ? null : badgeId)
                      }
                      activeOpacity={0.7}
                    >
                      <Text style={styles.badgeEmoji}>{info.emoji}</Text>
                      <View style={styles.badgeTextBlock}>
                        <Text style={styles.badgeLabel}>{info.label}</Text>
                        {isExpanded && (
                          <Text style={styles.badgeDesc}>
                            {info.description}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <View style={styles.divider} />

        {/* Project */}
        {member.projectTitle && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Project I'm Building</Text>
              <View style={styles.projectCard}>
                {member.projectImageURL && (
                  <Image
                    source={{ uri: member.projectImageURL }}
                    style={styles.projectImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle}>
                    {member.projectTitle}
                  </Text>
                  {member.projectDescription && (
                    <Text style={styles.projectDesc}>
                      {member.projectDescription}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Recent posts */}
        {threads.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Posts</Text>
            {threads.map(thread => (
              <TouchableOpacity
                key={thread.id}
                style={styles.threadCard}
                onPress={() => router.push({
                  pathname: '/thread-detail',
                  params: { threadId: thread.id }
                } as any)}
                activeOpacity={0.7}
              >
                <View style={styles.threadCardInner}>
                  <View style={styles.threadCardContent}>
                    <Text style={styles.threadTitle}>{thread.title}</Text>
                    <Text style={styles.threadContent} numberOfLines={2}>
                      {thread.content}
                    </Text>
                    <View style={styles.threadFooter}>
                      <Text style={styles.threadTime}>
                        {formatTime(thread.createdAt)}
                      </Text>
                      <View style={styles.threadStats}>
                        <Text style={styles.threadStat}>
                          ♥ {thread.likes || 0}
                        </Text>
                        <Text style={styles.threadStat}>
                          💬 {thread.commentCount || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={Colors.text3}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
  errorText: {
    fontSize: Typography.base,
    color: Colors.text3,
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
  headerRight: {
    width: 60,
  },
  content: {
    paddingBottom: Layout.xl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    gap: Layout.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    flexShrink: 0,
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarFallbackText: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.bg,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  adminBadge: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  adminBadgeText: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '700',
  },
  joined: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.md,
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  statNumber: {
    fontWeight: '700',
    color: Colors.text,
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    flexShrink: 0,
  },
  bioSection: {
    padding: Layout.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bioText: {
    fontSize: Typography.base,
    color: Colors.text,
    lineHeight: Typography.base * 1.6,
  },
  socialsRow: {
    flexDirection: 'row',
    gap: Layout.md,
    padding: Layout.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  socialIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  divider: {
    height: 8,
    backgroundColor: Colors.bg,
  },
  section: {
    padding: Layout.md,
    backgroundColor: Colors.surface,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.md,
  },

  // Badge grid
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Layout.sm,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
  },
  badgeChipExpanded: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusSm,
  },
  badgeEmoji: {
    fontSize: 16,
  },
  badgeTextBlock: {
    flexShrink: 1,
  },
  badgeLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text,
  },
  badgeDesc: {
    fontSize: Typography.xs,
    color: Colors.text2,
    marginTop: 2,
  },

  projectCard: {
    borderRadius: Layout.radius,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  projectImage: {
    width: '100%',
    height: 160,
    backgroundColor: Colors.surface2,
  },
  projectInfo: {
    padding: Layout.md,
  },
  projectTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
  },
  threadCard: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Layout.md,
  },
  threadCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  threadCardContent: {
    flex: 1,
  },
  threadTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  threadContent: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.5,
    marginBottom: Layout.sm,
  },
  threadFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadTime: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  threadStats: {
    flexDirection: 'row',
    gap: Layout.md,
  },
  threadStat: {
    fontSize: Typography.xs,
    color: Colors.text2,
  },
});
