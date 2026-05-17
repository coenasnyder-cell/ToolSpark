import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import Header from '../../components/Shared/Header';

interface UserProfile {
  displayName: string;
  userEmail: string;
  userRole: string;
  createdAt: any;
  photoURL: string;
  bio: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'done' | 'ready' | 'coming-soon';
  route?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadCount, setThreadCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
        await loadStats(u);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadProfile = async (u: User) => {
    const userRef = doc(db, 'users', u.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      setProfile(data);
      if (data.createdAt) {
        const created = data.createdAt.toDate?.() ||
          new Date(data.createdAt);
        const days = Math.floor(
          (new Date().getTime() - created.getTime()) /
          (1000 * 60 * 60 * 24)
        );
        setDaysActive(days);
      }
    }
  };

  const loadStats = async (u: User) => {
    try {
      const threadsQuery = query(
        collection(db, 'threads'),
        where('authorId', '==', u.uid)
      );
      const threadsSnap = await getCountFromServer(threadsQuery);
      setThreadCount(threadsSnap.data().count);

      const sessionsQuery = query(
        collection(db, 'clarity_sessions'),
        where('userId', '==', u.uid)
      );
      const sessionsSnap = await getCountFromServer(sessionsQuery);
      setSessionCount(sessionsSnap.data().count);
    } catch (err) {
      console.log('Stats error:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/login' as any);
  };

  const checklist: ChecklistItem[] = [
    {
      id: 'account',
      label: 'Create your account',
      description: "You're in. Welcome to ToolSpark.",
      status: 'done',
    },
    {
      id: 'clarity',
      label: 'Complete your Clarity Session',
      description: 'Identify the right AI tool for your business.',
      status: sessionCount > 0 ? 'done' : 'ready',
    },
    {
      id: 'community',
      label: 'Post in the community',
      description: 'Connect with other builders.',
      status: threadCount > 0 ? 'done' : 'ready',
      route: '/(tabs)',
    },
    {
      id: 'call',
      label: 'Book a strategy call',
      description: 'Map out your tool-building roadmap.',
      status: 'coming-soon',
    },
  ];

  const getStatusColor = (status: string) => {
    if (status === 'done') return Colors.green;
    if (status === 'ready') return Colors.gold;
    return Colors.text3;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'done') return 'DONE';
    if (status === 'ready') return 'READY';
    return 'SOON';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const firstName = profile?.displayName?.split(' ')[0] ||
    user?.displayName?.split(' ')[0] || 'there';

  const photoURL = profile?.photoURL || user?.photoURL;

  return (
    <View style={styles.container}>
      <Header subtitle="My Profile" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile hero */}
        <View style={styles.hero}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {photoURL ? (
              <Image
                source={{ uri: photoURL }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          {/* Name and role */}
          <Text style={styles.name}>
            {profile?.displayName || user?.displayName || 'Member'}
          </Text>
          <Text style={styles.email}>
            {profile?.userEmail || user?.email}
          </Text>

          {/* Role badge */}
          <View style={[
            styles.roleBadge,
            profile?.userRole === 'admin' && styles.adminBadge
          ]}>
            <Text style={[
              styles.roleBadgeText,
              profile?.userRole === 'admin' && styles.adminBadgeText
            ]}>
              {profile?.userRole === 'admin'
                ? '★ Admin'
                : 'Member'}
            </Text>
          </View>

          {/* Bio */}
          {profile?.bio ? (
            <Text style={styles.bio}>{profile.bio}</Text>
          ) : (
            <Text style={styles.bioEmpty}>
              No bio yet
            </Text>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{threadCount}</Text>
            <Text style={styles.statLabel}>Threads</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{sessionCount}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{daysActive}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* Onboarding checklist */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          <View style={styles.checklistCard}>
            {checklist.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.checklistItem,
                  index < checklist.length - 1 &&
                    styles.checklistBorder,
                ]}
                onPress={() => {
                  if (item.route &&
                    item.status !== 'coming-soon') {
                    router.push(item.route as any);
                  }
                }}
                disabled={item.status === 'coming-soon'}
                activeOpacity={
                  item.status === 'coming-soon' ? 1 : 0.7
                }
              >
                <View style={[
                  styles.checklistIcon,
                  {
                    backgroundColor:
                      item.status === 'done'
                        ? Colors.green
                        : item.status === 'ready'
                        ? Colors.gold
                        : Colors.surface2,
                    borderColor:
                      item.status === 'done'
                        ? Colors.green
                        : item.status === 'ready'
                        ? Colors.gold
                        : Colors.border,
                  }
                ]}>
                  <Text style={styles.checklistIconText}>
                    {item.status === 'done'
                      ? '✓'
                      : String(index + 1)}
                  </Text>
                </View>
                <View style={styles.checklistContent}>
                  <Text style={[
                    styles.checklistLabel,
                    item.status === 'coming-soon' &&
                      styles.mutedText,
                  ]}>
                    {item.label}
                  </Text>
                  <Text style={styles.checklistDesc}>
                    {item.description}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  {
                    borderColor: getStatusColor(item.status)
                  }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(item.status) }
                  ]}>
                    {getStatusLabel(item.status)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Account section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.accountCard}>
            <TouchableOpacity
              style={styles.accountItem}
              onPress={() =>
                router.push('/edit-profile' as any)
              }
            >
              <Text style={styles.accountItemText}>
                Edit Profile
              </Text>
              <Text style={styles.accountItemArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.accountDivider} />

            <TouchableOpacity
              style={styles.accountItem}
              onPress={() =>
                router.push('/settings' as any)
              }
            >
              <Text style={styles.accountItemText}>
                Settings
              </Text>
              <Text style={styles.accountItemArrow}>→</Text>
            </TouchableOpacity>

            {profile?.userRole === 'admin' && (
              <>
                <View style={styles.accountDivider} />
                <TouchableOpacity
                  style={styles.accountItem}
                  onPress={() =>
                    router.push('/admin' as any)
                  }
                >
                  <Text style={[
                    styles.accountItemText,
                    { color: Colors.gold }
                  ]}>
                    Admin Dashboard
                  </Text>
                  <Text style={styles.accountItemArrow}>→</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.accountDivider} />

            <TouchableOpacity
              style={styles.accountItem}
              onPress={handleSignOut}
            >
              <Text style={[
                styles.accountItemText,
                { color: Colors.error }
              ]}>
                Sign Out
              </Text>
              <Text style={[
                styles.accountItemArrow,
                { color: Colors.error }
              ]}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Member since */}
        <Text style={styles.memberSince}>
          Member since{' '}
          {profile?.createdAt
            ? new Date(
                profile.createdAt.toDate?.() ||
                profile.createdAt
              ).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })
            : '2026'}
        </Text>
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
  content: {
    paddingBottom: Layout.tabBarHeight + Layout.xl,
  },
  hero: {
    backgroundColor: Colors.sidebar,
    alignItems: 'center',
    paddingHorizontal: Layout.md,
    paddingTop: Layout.lg,
    paddingBottom: Layout.xl,
    marginBottom: Layout.md,
  },
  avatarContainer: {
    marginBottom: Layout.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.gold,
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
    marginBottom: 4,
  },
  email: {
    fontSize: Typography.sm,
    color: Colors.text3,
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
    marginBottom: Layout.md,
    paddingHorizontal: Layout.lg,
  },
  bioEmpty: {
    fontSize: Typography.sm,
    color: Colors.text3,
    marginBottom: Layout.md,
    fontStyle: 'italic',
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
    marginBottom: Layout.md,
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
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  section: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.lg,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    gap: Layout.md,
    minHeight: Layout.minTouchTarget + 16,
  },
  checklistBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checklistIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  checklistIconText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checklistContent: {
    flex: 1,
  },
  checklistLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  checklistDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.5,
  },
  mutedText: {
    color: Colors.text3,
  },
  statusBadge: {
    borderWidth: 1,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  accountCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.md,
    minHeight: Layout.minTouchTarget + 8,
  },
  accountItemText: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: '500',
  },
  accountItemArrow: {
    fontSize: Typography.base,
    color: Colors.text3,
  },
  accountDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  memberSince: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textAlign: 'center',
    marginBottom: Layout.xl,
  },
});
