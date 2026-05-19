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

  useEffect(() => {
    if (userId) {
      loadMember();
      loadMemberThreads();
    }
  }, [userId]);

  const loadMember = async () => {
    try {
      const userRef = doc(db, 'users', userId!);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setMember(snap.data() as Member);
      }
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

  const hasSocials = member && (
    member.website ||
    member.instagram ||
    member.twitter ||
    member.linkedin ||
    member.youtube
  );

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
        {/* Profile hero */}
        <View style={styles.hero}>
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

          <Text style={styles.name}>{member.displayName}</Text>

          <View style={[
            styles.roleBadge,
            member.userRole === 'admin' && styles.adminBadge
          ]}>
            <Text style={[
              styles.roleBadgeText,
              member.userRole === 'admin' && styles.adminBadgeText
            ]}>
              {member.userRole === 'admin' ? '★ Admin' : 'Member'}
            </Text>
          </View>

          {member.bio ? (
            <Text style={styles.bio}>{member.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>No bio yet</Text>
          )}

          <Text style={styles.joined}>
            Joined {formatJoined(member.createdAt)}
          </Text>

          {/* Message button */}
          <TouchableOpacity
            style={styles.messageButton}
            onPress={() => {}}
          >
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={Colors.bg}
            />
            <Text style={styles.messageButtonText}>
              Message
            </Text>
          </TouchableOpacity>
        </View>

        {/* Social links */}
        {hasSocials && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect</Text>
            <View style={styles.socialsCard}>
              {member.website && (
                <TouchableOpacity
                  style={styles.socialRow}
                  onPress={() => openURL(member.website)}
                >
                  <View style={styles.socialIcon}>
                    <Ionicons
                      name="globe-outline"
                      size={18}
                      color={Colors.gold}
                    />
                  </View>
                  <Text style={styles.socialText}>
                    {member.website}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={Colors.text3}
                  />
                </TouchableOpacity>
              )}

              {member.instagram && (
                <TouchableOpacity
                  style={styles.socialRow}
                  onPress={() => openURL(
                    `https://instagram.com/${member.instagram}`
                  )}
                >
                  <View style={styles.socialIcon}>
                    <Ionicons
                      name="logo-instagram"
                      size={18}
                      color='#E1306C'
                    />
                  </View>
                  <Text style={styles.socialText}>
                    @{member.instagram}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={Colors.text3}
                  />
                </TouchableOpacity>
              )}

              {member.twitter && (
                <TouchableOpacity
                  style={styles.socialRow}
                  onPress={() => openURL(
                    `https://twitter.com/${member.twitter}`
                  )}
                >
                  <View style={styles.socialIcon}>
                    <Ionicons
                      name="logo-twitter"
                      size={18}
                      color='#1DA1F2'
                    />
                  </View>
                  <Text style={styles.socialText}>
                    @{member.twitter}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={Colors.text3}
                  />
                </TouchableOpacity>
              )}

              {member.linkedin && (
                <TouchableOpacity
                  style={styles.socialRow}
                  onPress={() => openURL(
                    `https://linkedin.com/in/${member.linkedin}`
                  )}
                >
                  <View style={styles.socialIcon}>
                    <Ionicons
                      name="logo-linkedin"
                      size={18}
                      color='#0077B5'
                    />
                  </View>
                  <Text style={styles.socialText}>
                    {member.linkedin}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={Colors.text3}
                  />
                </TouchableOpacity>
              )}

              {member.youtube && (
                <TouchableOpacity
                  style={styles.socialRow}
                  onPress={() => openURL(member.youtube)}
                >
                  <View style={styles.socialIcon}>
                    <Ionicons
                      name="logo-youtube"
                      size={18}
                      color='#FF0000'
                    />
                  </View>
                  <Text style={styles.socialText}>
                    {member.youtube}
                  </Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={Colors.text3}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Project */}
        {member.projectTitle && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Project I'm Building
            </Text>
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
        )}

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{threadCount}</Text>
            <Text style={styles.statLabel}>Threads</Text>
          </View>
        </View>

        {/* Recent threads */}
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
                <Text style={styles.threadTitle}>
                  {thread.title}
                </Text>
                <Text
                  style={styles.threadContent}
                  numberOfLines={2}
                >
                  {thread.content}
                </Text>
                <View style={styles.threadFooter}>
                  <Text style={styles.threadMeta}>
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
  hero: {
    backgroundColor: Colors.sidebar,
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingTop: Layout.lg,
    paddingBottom: Layout.xl,
    marginBottom: Layout.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.gold,
    marginBottom: Layout.md,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.md,
  },
  avatarFallbackText: {
    fontSize: Typography.xxxl,
    fontWeight: '700',
    color: Colors.bg,
  },
  name: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#F5F3EF',
    marginBottom: Layout.sm,
  },
  roleBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.md,
  },
  adminBadge: {
    backgroundColor: Colors.goldDim,
    borderColor: Colors.gold,
  },
  roleBadgeText: {
    fontSize: Typography.xs,
    color: Colors.text2,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adminBadgeText: {
    color: Colors.gold,
  },
  bio: {
    fontSize: Typography.base,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.sm,
    paddingHorizontal: Layout.lg,
  },
  bioEmpty: {
    fontSize: Typography.sm,
    color: Colors.text3,
    marginBottom: Layout.sm,
    fontStyle: 'italic',
  },
  joined: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: Layout.md,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.lg,
    paddingVertical: Layout.sm,
    minHeight: Layout.minTouchTarget,
  },
  messageButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  section: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.lg,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
  },
  socialsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Layout.md,
    minHeight: Layout.minTouchTarget + 8,
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
  },
  projectCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 180,
    backgroundColor: Colors.surface2,
  },
  projectInfo: {
    padding: Layout.md,
  },
  projectTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  projectDesc: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.md,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.gold,
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  threadCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  threadTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
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
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.sm,
  },
  threadMeta: {
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