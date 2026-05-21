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
  updateDoc,
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  orderBy,
  limit,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import Header from '../../components/Shared/Header';
import { useUnreadCount } from '../../hooks/useUnreadCount';

interface UserProfile {
  displayName: string;
  userEmail: string;
  userRole: string;
  createdAt: any;
  photoURL: string;
  bio: string;
}

interface Event {
  id: string;
  eventTitle: string;
  eventStart: string;
  eventURL: string;
  eventLocation: string;
  status: string;
  isRecurring: boolean;
}

export default function DashboardHubScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadCount, setThreadCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [onboarding, setOnboarding] = useState<any>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const unreadCount = useUnreadCount();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadProfile(u);
        await loadStats(u);
        await loadEvents();
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
      setPoints((data as any).points || 0);
      setStreak((data as any).streak || 0);
      const onboardingData = (data as any).onboarding;
      if (onboardingData) {
        setOnboarding(onboardingData.steps);
        setOnboardingCompleted(onboardingData.completed || false);

        if (!onboardingData.steps?.clarityTool) {
          const clarityQuery = query(
            collection(db, 'clarity_sessions'),
            where('clientEmail', '==', data.userEmail),
            where('status', '==', 'completed'),
            limit(1)
          );
          const claritySnap = await getDocs(clarityQuery);
          if (!claritySnap.empty) {
            await updateDoc(doc(db, 'users', u.uid), {
              'onboarding.steps.clarityTool': true,
            });
            await updateDoc(claritySnap.docs[0].ref, {
              userId: u.uid,
            });
            setOnboarding((prev: any) => ({ ...prev, clarityTool: true }));
          }
        }
      } else {
        const defaultSteps = {
          welcomePost: false,
          welcomeCourse: false,
          clarityTool: false,
          toolIdeaPost: false,
        };
        await updateDoc(userRef, {
          onboarding: { completed: false, steps: defaultSteps },
        });
        setOnboarding(defaultSteps);
        setOnboardingCompleted(false);
      }
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

  const loadEvents = async () => {
    try {
      const eventsQuery = query(
        collection(db, 'Events'),
        orderBy('date', 'asc'),
        limit(3)
      );
      const snap = await getDocs(eventsQuery);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Event[];
      setEvents(data);
    } catch (err) {
      console.log('Events error:', err);
    }
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

  const hubCards = [
  {
  id: 'profile',
  title: 'My Profile',
  subtitle: profile?.displayName || 'Edit your profile',
  icon: 'person-outline' as const,
  color: Colors.gold,
  route: '/edit-profile',
},
{
  id: 'view-profile',
  title: 'Public Profile',
  subtitle: 'See how others see you',
  icon: 'eye-outline' as const,
  color: Colors.gold,
  route: `/member-profile?userId=${user?.uid}`,
},
 
  {
    id: 'members',
    title: 'Members',
    subtitle: 'View the community',
    icon: 'people-outline' as const,
    color: Colors.green,
    route: '/members',
  },
  {
  id: 'leaderboard',
  title: 'Leaderboard',
  subtitle: 'Top community members',
  icon: 'trophy-outline' as const,
  color: Colors.gold,
  route: '/leaderboard',
},
  {
    id: 'events',
    title: 'Events',
    subtitle: events.length > 0
      ? `${events.length} upcoming`
      : 'No upcoming events',
    icon: 'calendar-outline' as const,
    color: Colors.purple,
    route: '/events',
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Account & preferences',
    icon: 'settings-outline' as const,
    color: Colors.text2,
    route: '/settings',
  },
  // Admin only
  ...(profile?.userRole === 'admin' ? [
    {
  id: 'manage-posts',
  title: 'Manage Posts',
  subtitle: 'Pin and order community threads',
  icon: 'bookmark-outline' as const,
  color: Colors.gold,
  route: '/admin-posts',
},
    {
      id: 'manage-tools',
      title: 'Manage Tools',
      subtitle: 'Add and edit tools',
      icon: 'construct-outline' as const,
      color: Colors.coral,
      route: '/admin-tools',
    },
    {
      id: 'manage-events',
      title: 'Manage Events',
      subtitle: 'Add and edit events',
      icon: 'calendar-outline' as const,
      color: Colors.green,
      route: '/admin-events',
    },
    {
  id: 'manage-members',
  title: 'Manage Members',
  subtitle: 'Roles and permissions',
  icon: 'people-outline' as const,
  color: Colors.purple,
  route: '/admin-members',
},

  ] : []),
];

  return (
    <View style={styles.container}>
      <Header subtitle="Dashboard" notificationCount={unreadCount} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome + avatar row */}
        <View style={styles.welcomeRow}>
          {photoURL ? (
            <Image
              source={{ uri: photoURL }}
              style={styles.welcomeAvatar}
            />
          ) : (
            <View style={styles.welcomeAvatarFallback}>
              <Text style={styles.welcomeAvatarText}>
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.welcomeName}>
            Welcome back, {firstName} 👋
          </Text>
        </View>

        {/* Stats grid */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
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
          <View style={styles.statsRowDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statStreakRow}>
                <Text style={styles.statNumber}>{streak}</Text>
                <Ionicons name="flame" size={18} color={Colors.gold} />
              </View>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
          </View>
        </View>

        {/* View public profile link */}
        <TouchableOpacity
          style={styles.viewProfileLink}
          onPress={() => router.push(`/member-profile?userId=${user?.uid}` as any)}
          activeOpacity={0.7}
        >
          <Ionicons name="eye-outline" size={14} color={Colors.gold} />
          <Text style={styles.viewProfileLinkText}>View Public Profile</Text>
        </TouchableOpacity>
{/* Onboarding progress */}
{!onboardingCompleted && onboarding && (
  <View style={styles.onboardingCard}>
    <View style={styles.onboardingHeader}>
      <Text style={styles.onboardingTitle}>Getting Started</Text>
      <Text style={styles.onboardingCount}>
        {Object.values(onboarding).filter(Boolean).length} of 4 complete
      </Text>
    </View>

    {/* Progress bar */}
    <View style={styles.progressBarBg}>
      <View style={[
        styles.progressBarFill,
        { width: `${(Object.values(onboarding).filter(Boolean).length / 4) * 100}%` as any }
      ]} />
    </View>

    {/* Steps */}
    {[
      {
        key: 'welcomePost',
        label: 'Introduce yourself',
        desc: 'Post in the welcome thread',
        route: '/thread-detail',
        params: { threadId: 'xYncX74z03ukOFguxCWf' },
      },
      {
        key: 'welcomeCourse',
        label: 'Complete "Welcome To Tool Spark"',
        desc: 'Watch all 4 lessons',
        route: '/course-player',
        params: { courseId: 'JQYsP0RQUPWZ0twQtiQg' },
      },
      {
        key: 'clarityTool',
        label: 'Complete your Clarity Session',
        desc: 'Discover your first tool idea',
        route: '/clarity',
        params: {},
      },
      {
        key: 'toolIdeaPost',
        label: 'Post your Tool Idea',
        desc: 'Share in the Tool Ideas category',
        route: '/(tabs)',
        params: {},
      },
    ].map((step, index) => {
      const done = onboarding[step.key];
      return (
        <TouchableOpacity
          key={step.key}
          style={styles.onboardingStep}
          activeOpacity={done ? 1 : 0.7}
          onPress={() => {
            if (!done) {
              router.push({
                pathname: step.route,
                params: step.params,
              } as any);
            }
          }}
        >
          <View style={[
            styles.stepCheck,
            done && styles.stepCheckDone,
          ]}>
            {done
              ? <Ionicons name="checkmark" size={14} color={Colors.bg} />
              : <Text style={styles.stepNumber}>{index + 1}</Text>
            }
          </View>
          <View style={styles.stepInfo}>
            <Text style={[
              styles.stepLabel,
              done && styles.stepLabelDone,
            ]}>
              {step.label}
            </Text>
            <Text style={styles.stepDesc}>{step.desc}</Text>
          </View>
          {!done && (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={Colors.text3}
            />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
)}
        {/* Hub cards grid */}
        <View style={styles.cardGrid}>
          {hubCards.map(card => (
            <TouchableOpacity
              key={card.id}
              style={styles.hubCard}
              activeOpacity={0.8}
              onPress={() => router.push(card.route as any)}
            >
              <View style={[
                styles.hubCardIcon,
                { backgroundColor: card.color + '20' }
              ]}>
                <Ionicons
                  name={card.icon}
                  size={24}
                  color={card.color}
                />
              </View>
              <Text style={styles.hubCardTitle}>{card.title}</Text>
              <Text style={styles.hubCardSubtitle} numberOfLines={1}>
                {card.subtitle}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming events */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity
              onPress={() => router.push('/events' as any)}
            >
              <Text style={styles.sectionLink}>View all</Text>
            </TouchableOpacity>
          </View>

          {events.length === 0 ? (
            <View style={styles.emptyEvents}>
              <Text style={styles.emptyEventsText}>
                No upcoming events · Check back soon
              </Text>
            </View>
          ) : (
        events.map(event => (
      <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      activeOpacity={0.8}
      >
    <View style={styles.eventDateBadge}>
      <Ionicons
        name="calendar-outline"
        size={16}
        color={Colors.gold}
      />
    </View>
    <View style={styles.eventInfo}>
      <Text style={styles.eventTitle}>
        {event.eventTitle}
      </Text>
      <Text style={styles.eventDate}>
        {event.eventStart} · {event.eventLocation}
      </Text>
    </View>
    <Text style={styles.eventArrow}>→</Text>
    </TouchableOpacity>
    ))
          )}
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
  content: {
    paddingBottom: Layout.tabBarHeight + Layout.xl,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.md,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.lg,
    backgroundColor: Colors.surface,
  },
  welcomeName: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  welcomeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.gold,
  },
  welcomeAvatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeAvatarText: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.bg,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.md,
    marginTop: Layout.md,
    borderRadius: Layout.radius,
    paddingVertical: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.md,
  },
  statsRowDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.md,
    marginVertical: Layout.sm,
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
  statStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
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
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Layout.md,
    gap: Layout.md,
    marginBottom: Layout.lg,
  },
  hubCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '47%',
    minHeight: 110,
  },
  hubCardIcon: {
    width: 40,
    height: 40,
    borderRadius: Layout.radiusSm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.sm,
  },
  hubCardTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  hubCardSubtitle: {
    fontSize: Typography.xs,
    color: Colors.text2,
  },
  section: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionLink: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
  },
  emptyEvents: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyEventsText: {
    fontSize: Typography.sm,
    color: Colors.text3,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.sm,
    gap: Layout.md,
  },
  eventDateBadge: {
    width: 36,
    height: 36,
    borderRadius: Layout.radiusSm,
    backgroundColor: Colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  eventDate: {
    fontSize: Typography.xs,
    color: Colors.text2,
  },
  eventArrow: {
    fontSize: Typography.base,
    color: Colors.text3,
  },
  viewProfileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginHorizontal: Layout.md,
    marginBottom: Layout.md,
  },
  viewProfileLinkText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.gold,
    gap: Layout.md,
  },
  adminCardText: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.gold,
  },
  onboardingCard: {
  backgroundColor: Colors.surface,
  borderRadius: Layout.radius,
  marginHorizontal: Layout.md,
  marginBottom: Layout.lg,
  borderWidth: 1,
  borderColor: Colors.border,
  overflow: 'hidden',
},
onboardingHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: Layout.md,
  borderBottomWidth: 1,
  borderBottomColor: Colors.border,
},
onboardingTitle: {
  fontSize: 16,
  fontWeight: '700',
  color: Colors.text,
},
onboardingCount: {
  fontSize: Typography.xs,
  color: Colors.gold,
  fontWeight: '600',
},
progressBarBg: {
  height: 3,
  backgroundColor: Colors.border,
  marginHorizontal: Layout.md,
  marginTop: Layout.sm,
  borderRadius: 2,
},
progressBarFill: {
  height: 3,
  backgroundColor: Colors.gold,
  borderRadius: 2,
},
onboardingStep: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: Layout.md,
  paddingVertical: Layout.md,
  borderTopWidth: 1,
  borderTopColor: Colors.border,
  gap: Layout.md,
},
stepCheck: {
  width: 28,
  height: 28,
  borderRadius: 14,
  borderWidth: 2,
  borderColor: Colors.border,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
},
stepCheckDone: {
  backgroundColor: Colors.gold,
  borderColor: Colors.gold,
},
stepNumber: {
  fontSize: Typography.xs,
  fontWeight: '700',
  color: Colors.text3,
},
stepInfo: {
  flex: 1,
},
stepLabel: {
  fontSize: Typography.sm,
  fontWeight: '600',
  color: Colors.text,
  marginBottom: 2,
},
stepLabelDone: {
  color: Colors.text3,
  textDecorationLine: 'line-through',
},
stepDesc: {
  fontSize: Typography.xs,
  color: Colors.text3,
},
});