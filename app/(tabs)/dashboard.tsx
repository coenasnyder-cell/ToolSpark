import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface UserProfile {
  displayName: string;
  userEmail: string;
  userRole: string;
  createdAt: any;
  photoURL: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  status: 'done' | 'ready' | 'coming-soon';
  route?: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [threadCount, setThreadCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [daysActive, setDaysActive] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

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

      // Calculate days active
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
      // Thread count
      const threadsQuery = query(
        collection(db, 'threads'),
        where('authorId', '==', u.uid)
      );
      const threadsSnap = await getCountFromServer(threadsQuery);
      setThreadCount(threadsSnap.data().count);

      // Clarity sessions count
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

  const buildChecklist = (
    u: User,
    threadCount: number,
    sessionCount: number
  ): ChecklistItem[] => [
    {
      id: 'account',
      label: 'Create your account',
      description: "You're in. Welcome to ToolSpark.",
      status: 'done',
    },
    {
      id: 'clarity',
      label: 'Complete your Clarity Session',
      description:
        'Tell us about your business so we can identify the right tools for you.',
      status: sessionCount > 0 ? 'done' : 'ready',
      route: '/(app)/clarity-session',
    },
    {
      id: 'results',
      label: 'Review your tool recommendations',
      description:
        'See the AI tools best matched to your workflow and clients.',
      status: sessionCount > 0 ? 'ready' : 'coming-soon',
      route: '/(app)/results',
    },
    {
      id: 'community',
      label: 'Join the community discussion',
      description:
        'Connect with other builders, share wins, and get support.',
      status: threadCount > 0 ? 'done' : 'ready',
      route: '/(tabs)',
    },
    {
      id: 'call',
      label: 'Book a strategy call',
      description:
        'Work 1-on-1 to map out your tool-building roadmap.',
      status: 'coming-soon',
    },
  ];

  useEffect(() => {
    if (user) {
      setChecklist(
        buildChecklist(user, threadCount, sessionCount)
      );
    }
  }, [user, threadCount, sessionCount]);

  const getStatusColor = (status: string) => {
    if (status === 'done') return Colors.green;
    if (status === 'ready') return Colors.gold;
    return Colors.text3;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'done') return 'DONE';
    if (status === 'ready') return 'READY';
    return 'COMING SOON';
  };

  const getStatusIcon = (status: string, index: number) => {
    if (status === 'done') return '✓';
    return String(index + 1);
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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Welcome hero */}
      <View style={styles.hero}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>✦ MEMBERS AREA</Text>
        </View>
        <Text style={styles.welcomeText}>
          Welcome back,{' '}
          <Text style={styles.welcomeName}>{firstName}</Text>
        </Text>
        <Text style={styles.welcomeSub}>
          You're building something real. Everything you need to
          create, launch, and grow your AI-powered tools is
          right here.
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{threadCount}</Text>
            <Text style={styles.statLabel}>Threads Posted</Text>
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
      </View>

      {/* Onboarding checklist */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Start Here</Text>
        <Text style={styles.sectionSubtitle}>
          Complete these steps to get the most out of ToolSpark
        </Text>

        <View style={styles.checklistCard}>
          <View style={styles.checklistHeader}>
            <Text style={styles.checklistHeaderText}>
              Your Onboarding Checklist
            </Text>
            <Text style={styles.checklistHeaderSub}>
              Get set up and ready to build your first AI tool
            </Text>
          </View>

          {checklist.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.checklistItem,
                index < checklist.length - 1 &&
                  styles.checklistItemBorder,
              ]}
              onPress={() => {
                if (item.route && item.status !== 'coming-soon') {
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
                <Text style={[
                  styles.checklistIconText,
                  {
                    color:
                      item.status === 'coming-soon'
                        ? Colors.text3
                        : Colors.bg,
                  }
                ]}>
                  {getStatusIcon(item.status, index)}
                </Text>
              </View>

              <View style={styles.checklistContent}>
                <Text style={[
                  styles.checklistLabel,
                  item.status === 'coming-soon' && styles.mutedText
                ]}>
                  {item.label}
                </Text>
                <Text style={styles.checklistDesc}>
                  {item.description}
                </Text>
              </View>

              <View style={[
                styles.statusBadge,
                { borderColor: getStatusColor(item.status) }
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

      {/* Courses section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Courses & Training
            </Text>
            <Text style={styles.sectionSubtitle}>
              Step-by-step programs to help you build and sell
              AI tools
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View all</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome course card */}
        <TouchableOpacity
          style={styles.welcomeCourseCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(app)/course' as any)}
        >
          <View style={styles.welcomeCourseBadge}>
            <Text style={styles.welcomeCourseBadgeText}>
              ⭐ START HERE — Free for all members
            </Text>
          </View>
          <Text style={styles.welcomeCourseTitle}>
            Welcome to ToolSpark
          </Text>
          <Text style={styles.welcomeCourseSub}>
            Get clarity on your business and discover your
            first AI tool
          </Text>
          <View style={styles.progressRow}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '0%' }]} />
            </View>
            <Text style={styles.progressText}>0 of 5 lessons</Text>
          </View>
        </TouchableOpacity>

        {/* Placeholder courses */}
        {[
          {
            tag: 'FOUNDATIONS',
            title: 'AI Tool Builder Bootcamp',
            desc: 'Learn the end-to-end process of identifying, designing, and deploying AI tools.',
            lessons: '12 lessons · Beginner',
          },
          {
            tag: 'SYSTEMS',
            title: 'Automate Your Client Delivery',
            desc: 'Build repeatable systems that deliver results to clients without trading more time.',
            lessons: '8 lessons · Intermediate',
          },
          {
            tag: 'GROWTH',
            title: 'Sell Your AI Services',
            desc: 'Position and price your tool-building expertise so clients immediately see the value.',
            lessons: '10 lessons · Advanced',
          },
        ].map((course, index) => (
          <View key={index} style={styles.courseCard}>
            <View style={styles.courseCardTop}>
              <Text style={styles.courseTag}>{course.tag}</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>
                  COMING SOON
                </Text>
              </View>
            </View>
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseDesc}>{course.desc}</Text>
            <Text style={styles.courseMeta}>{course.lessons}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
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
  backgroundColor: Colors.sidebar,  // dark header
  // text inside hero stays light — override locally
    padding: Layout.lg,
    paddingTop: 60,
    marginBottom: Layout.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.md,
    paddingVertical: 4,
    marginBottom: Layout.md,
  },
  heroBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: Typography.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  welcomeName: {
    color: Colors.gold,
  },
  welcomeSub: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
    marginBottom: Layout.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Layout.md,
  },
  sectionTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.text2,
    marginBottom: Layout.md,
    lineHeight: Typography.sm * 1.6,
  },
  viewAllText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
    marginTop: 4,
  },
  checklistCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  checklistHeader: {
    padding: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  checklistHeaderText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  checklistHeaderSub: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    gap: Layout.md,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checklistIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  checklistIconText: {
    fontSize: Typography.sm,
    fontWeight: '700',
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
  welcomeCourseCard: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: `${Colors.gold}40`,
  },
  welcomeCourseBadge: {
    marginBottom: Layout.sm,
  },
  welcomeCourseBadgeText: {
    fontSize: Typography.xs,
    color: Colors.gold,
    fontWeight: '700',
  },
  welcomeCourseTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  welcomeCourseSub: {
    fontSize: Typography.sm,
    color: Colors.text2,
    marginBottom: Layout.md,
    lineHeight: Typography.sm * 1.6,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.xs,
    color: Colors.text2,
    flexShrink: 0,
  },
  courseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.sm,
  },
  courseTag: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 0.5,
  },
  comingSoonBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  comingSoonText: {
    fontSize: 10,
    color: Colors.text3,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  courseTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  courseDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Layout.sm,
  },
  courseMeta: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
});