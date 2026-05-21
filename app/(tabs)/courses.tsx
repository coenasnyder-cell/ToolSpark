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
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import Header from '../../components/Shared/Header';
import { useUnreadCount } from '../../hooks/useUnreadCount';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  isFree: boolean;
  isPublished: boolean;
  order: number;
  totallessons: number;
}

interface UserProgress {
  completedLessons: string[];
  percentComplete: number;
  lastLessonId: string;
}

export default function DashboardScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, UserProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [welcomeCourseComplete, setWelcomeCourseComplete] = useState(false);
  const WELCOME_COURSE_ID = 'JQYsP0RQUPWZ0twQtiQg';
  const unreadCount = useUnreadCount();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadCourses(u);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loadCourses = async (u: User) => {
    try {
      // Load published courses
      const coursesQuery = query(
        collection(db, 'courses'),
        where('isPublished', '==', true),
        orderBy('order', 'asc')
      );
      const coursesSnap = await getDocs(coursesQuery);
      const coursesData = coursesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(coursesData);

      // Load progress for each course
      const progressData: Record<string, UserProgress> = {};
      for (const course of coursesData) {
        const progressId = `${u.uid}_${course.id}`;
        const progressRef = doc(db, 'userProgress', progressId);
        const progressSnap = await getDoc(progressRef);
        if (progressSnap.exists()) {
          progressData[course.id] = progressSnap.data() as UserProgress;
        }
      }
      setProgress(progressData);

      // Check if welcome course is complete
      const userSnap = await getDoc(doc(db, 'users', u.uid));
      if (userSnap.exists()) {
        const onboarding = userSnap.data().onboarding;
        setWelcomeCourseComplete(
          onboarding?.steps?.welcomeCourse || false
        );
      }
    } catch (err: any) {
      console.error('Load courses error:', err);
      setError(err?.message ?? 'Failed to load courses');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'foundations': return Colors.green;
      case 'systems': return Colors.purple;
      case 'growth': return Colors.coral;
      default: return Colors.gold;
    }
  };

  const getCompletedCount = (courseId: string, totalLessons: number) => {
    const p = progress[courseId];
    if (!p || !p.completedLessons) return 0;
    return p.completedLessons.length;
  };

  const getProgressPercent = (courseId: string, totalLessons: number) => {
    const completed = getCompletedCount(courseId, totalLessons);
    if (!totalLessons) return 0;
    return Math.round((completed / totalLessons) * 100);
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
      <Header subtitle="Builder Platform" notificationCount={unreadCount} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Courses & Training</Text>
          <Text style={styles.sectionSubtitle}>
            Step-by-step programs to help you build and sell AI tools
          </Text>
        </View>

        {/* Course cards */}
        {error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚠️</Text>
            <Text style={styles.emptyTitle}>Error loading courses</Text>
            <Text style={styles.emptySubtitle}>{error}</Text>
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptySubtitle}>
              Check back soon — courses are coming
            </Text>
          </View>
        ) : (
          courses.map((course) => {
            const completed = getCompletedCount(course.id, course.totallessons);
            const percent = getProgressPercent(course.id, course.totallessons);
            const total = course.totallessons || 0;
            const isStarted = completed > 0;
            const isComplete = completed >= total && total > 0;
            const isWelcomeCourse = course.id === WELCOME_COURSE_ID;
            const isLocked = !isWelcomeCourse && !welcomeCourseComplete;

            return (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseCard,
                  isLocked && styles.courseCardLocked,
                ]}
                activeOpacity={isLocked ? 1 : 0.8}
                onPress={() => {
                  if (isLocked) return;
                  router.push({
                    pathname: '/course-player',
                    params: { courseId: course.id },
                  } as any);
                }}
              >
                {/* Category tag */}
                <View style={styles.courseTop}>
                  <View style={[
                    styles.categoryTag,
                    { borderColor: isLocked ? Colors.border : getCategoryColor(course.category) },
                  ]}>
                    <Text style={[
                      styles.categoryTagText,
                      { color: isLocked ? Colors.text3 : getCategoryColor(course.category) },
                    ]}>
                      {course.category?.toUpperCase() || 'COURSE'}
                    </Text>
                  </View>

                  {isLocked ? (
                    <View style={styles.lockedBadge}>
                      <Text style={styles.lockedBadgeText}>🔒 Locked</Text>
                    </View>
                  ) : isComplete ? (
                    <View style={styles.completeBadge}>
                      <Text style={styles.completeBadgeText}>✓ Complete</Text>
                    </View>
                  ) : isStarted ? (
                    <View style={styles.inProgressBadge}>
                      <Text style={styles.inProgressBadgeText}>In Progress</Text>
                    </View>
                  ) : course.isFree ? (
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeText}>Free</Text>
                    </View>
                  ) : null}
                </View>

                {/* Title and description */}
                <Text style={[
                  styles.courseTitle,
                  isLocked && { color: Colors.text3 },
                ]}>
                  {course.title}
                </Text>
                <Text style={styles.courseDesc} numberOfLines={2}>
                  {isLocked
                    ? 'Complete the Welcome Course to unlock this content'
                    : course.description}
                </Text>

                {/* Progress bar — only show if not locked */}
                {!isLocked && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${percent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {completed} of {total} lessons
                    </Text>
                  </View>
                )}

                {/* CTA */}
                <View style={styles.courseFooter}>
                  <Text style={[
                    styles.courseAction,
                    isLocked && { color: Colors.text3 },
                  ]}>
                    {isLocked
                      ? 'Complete Welcome Course first'
                      : isComplete
                      ? 'Review course →'
                      : isStarted
                      ? 'Continue →'
                      : 'Start course →'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
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
  content: {
    padding: Layout.md,
    paddingBottom: Layout.tabBarHeight + Layout.xl,
  },
  sectionHeader: {
    marginBottom: Layout.lg,
    paddingTop: Layout.sm,
  },
  sectionTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
  },
  courseCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLg,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseCardLocked: {
    opacity: 0.6,
  },
  lockedBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  lockedBadgeText: {
    fontSize: 11,
    color: Colors.text3,
    fontWeight: '600',
  },
  courseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.sm,
  },
  categoryTag: {
    borderWidth: 1,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  completeBadge: {
    backgroundColor: Colors.green,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
  },
  completeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  inProgressBadge: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  inProgressBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
  },
  freeBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  freeBadgeText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '600',
  },
  courseTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  courseDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Layout.md,
  },
  progressSection: {
    marginBottom: Layout.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  courseFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.sm,
  },
  courseAction: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.gold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
  },
  emptyIcon: {
    fontSize: 40,
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
  },
});