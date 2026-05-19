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
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { auth, db } from '../../services/firebase';
import VideoPlayer from '../../components/Shared/VideoPlayer';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import Header from '../../components/Shared/Header';
import RenderHtml from 'react-native-render-html';
interface Lesson {
  id: string;
  lessonTitle: string;
  lessonDescription: string;
  lessonContent: string;
  lessonOrder: number;
  lessonType: string;
  lessonDuration: string;
  videoUrl: string;
  isFree: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  totallessons: number;
}

export default function CoursePlayerScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { courseId } = useLocalSearchParams<{ courseId: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && courseId) {
        await loadCourse(u);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [courseId]);

  const loadCourse = async (u: User) => {
    try {
      // Load course
      const courseRef = doc(db, 'courses', courseId!);
      const courseSnap = await getDoc(courseRef);
      if (courseSnap.exists()) {
        setCourse({ id: courseSnap.id, ...courseSnap.data() } as Course);
      }

      // Load lessons
      const lessonsQuery = query(
        collection(db, 'courses', courseId!, 'lessons'),
        orderBy('lessonOrder', 'asc')
      );
      const lessonsSnap = await getDocs(lessonsQuery);
      const lessonsData = lessonsSnap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Lesson[];
      setLessons(lessonsData);

      // Load progress
      const progressId = `${u.uid}_${courseId}`;
      const progressRef = doc(db, 'userProgress', progressId);
      const progressSnap = await getDoc(progressRef);

      if (progressSnap.exists()) {
        const data = progressSnap.data();
        setCompletedLessons(data.completedLessons || []);
        // Resume last lesson
        const lastLesson = lessonsData.find(
          l => l.id === data.lastLessonId
        );
        setCurrentLesson(lastLesson || lessonsData[0]);
      } else {
        // Start from beginning
        setCurrentLesson(lessonsData[0]);
        // Create progress doc
        await setDoc(progressRef, {
          userId: u.uid,
          clientEmail: u.email,
          displayName: u.displayName,
          courseId,
          completedLessons: [],
          lastLessonId: lessonsData[0]?.id || '',
          percentComplete: 0,
          startedAt: serverTimestamp(),
          completedAt: null,
        });
      }
    } catch (err) {
      console.log('Load course error:', err);
    }
  };

  const markComplete = async () => {
    if (!user || !currentLesson || !courseId) return;
    if (completedLessons.includes(currentLesson.id)) return;

    setMarking(true);
    try {
      const progressId = `${user.uid}_${courseId}`;
      const newCompleted = [...completedLessons, currentLesson.id];
      const percent = Math.round(
        (newCompleted.length / lessons.length) * 100
      );

      await updateDoc(doc(db, 'userProgress', progressId), {
        completedLessons: arrayUnion(currentLesson.id),
        lastLessonId: currentLesson.id,
        percentComplete: percent,
        ...(percent === 100 && {
          completedAt: serverTimestamp()
        }),
      });

      setCompletedLessons(newCompleted);

      // Auto advance to next lesson
      const currentIndex = lessons.findIndex(
        l => l.id === currentLesson.id
      );
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      }
    } catch (err) {
      console.log('Mark complete error:', err);
    } finally {
      setMarking(false);
    }
  };


  const isCompleted = (lessonId: string) =>
    completedLessons.includes(lessonId);

  const currentIndex = lessons.findIndex(
    l => l.id === currentLesson?.id
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
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {course?.title}
        </Text>
        <TouchableOpacity
          style={styles.lessonsButton}
          onPress={() => setShowSidebar(!showSidebar)}
        >
          <Text style={styles.lessonsButtonText}>Lessons</Text>
        </TouchableOpacity>
      </View>

      {/* Lesson sidebar drawer */}
      {showSidebar && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>Lessons</Text>
            <TouchableOpacity onPress={() => setShowSidebar(false)}>
              <Text style={styles.sidebarClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>
            {lessons.map((lesson, index) => (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonItem,
                  currentLesson?.id === lesson.id &&
                    styles.lessonItemActive,
                ]}
                onPress={() => {
                  setCurrentLesson(lesson);
                  setShowSidebar(false);
                }}
              >
                <View style={[
                  styles.lessonStatus,
                  isCompleted(lesson.id) && styles.lessonStatusDone,
                  currentLesson?.id === lesson.id &&
                    styles.lessonStatusCurrent,
                ]}>
                  <Text style={styles.lessonStatusText}>
                    {isCompleted(lesson.id)
                      ? '✓'
                      : String(index + 1)}
                  </Text>
                </View>
                <View style={styles.lessonItemContent}>
                  <Text style={[
                    styles.lessonItemTitle,
                    currentLesson?.id === lesson.id &&
                      styles.lessonItemTitleActive,
                  ]} numberOfLines={2}>
                    {lesson.lessonTitle}
                  </Text>
                  {lesson.lessonDuration && (
                    <Text style={styles.lessonItemDuration}>
                      {lesson.lessonDuration}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Main content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {currentLesson ? (
          <>
            {/* Video */}
            <VideoPlayer url={currentLesson.videoUrl} />

            {/* Lesson info */}
            <View style={styles.lessonInfo}>
              <View style={styles.lessonTopRow}>
                <Text style={styles.lessonNumber}>
                  Lesson {currentIndex + 1} of {lessons.length}
                </Text>
                {currentLesson.lessonDuration && (
                  <Text style={styles.lessonDuration}>
                    {currentLesson.lessonDuration}
                  </Text>
                )}
              </View>
              <Text style={styles.lessonTitle}>
                {currentLesson.lessonTitle}
              </Text>
              {currentLesson.lessonDescription && (
                <Text style={styles.lessonDesc}>
                  {currentLesson.lessonDescription}
                </Text>
              )}
              {currentLesson.lessonContent && (
                <RenderHtml
                  contentWidth={width - (Layout.md * 2)}
                  source={{ html: currentLesson.lessonContent }}
                  tagsStyles={{
                    body: { color: Colors.text, fontSize: Typography.base, lineHeight: Typography.base * 1.7 },
                    p: { marginBottom: Layout.md, color: Colors.text },
                    h1: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: Layout.md },
                    h2: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginBottom: Layout.sm },
                    h3: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Layout.sm },
                    strong: { fontWeight: '700', color: Colors.text },
                    em: { fontStyle: 'italic', color: Colors.text },
                    a: { color: Colors.gold, textDecorationLine: 'underline' },
                    ul: { marginBottom: Layout.md },
                    ol: { marginBottom: Layout.md },
                    li: { color: Colors.text, marginBottom: Layout.sm, fontSize: Typography.base },
                    blockquote: { borderLeftWidth: 3, borderLeftColor: Colors.gold, paddingLeft: Layout.md, marginLeft: 0, color: Colors.text2 },
                  }}
                />
              )}
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Mark complete button */}
              <TouchableOpacity
                style={[
                  styles.markButton,
                  isCompleted(currentLesson.id) &&
                    styles.markButtonDone,
                ]}
                onPress={markComplete}
                disabled={
                  marking || isCompleted(currentLesson.id)
                }
              >
                {marking ? (
                  <ActivityIndicator
                    color={Colors.bg}
                    size="small"
                  />
                ) : (
                  <Text style={styles.markButtonText}>
                    {isCompleted(currentLesson.id)
                      ? '✓ Completed'
                      : 'Mark as Complete'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Navigation */}
              <View style={styles.navButtons}>
                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === 0 && styles.navButtonDisabled,
                  ]}
                  onPress={() => {
                    if (currentIndex > 0) {
                      setCurrentLesson(lessons[currentIndex - 1]);
                    }
                  }}
                  disabled={currentIndex === 0}
                >
                  <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.navButton,
                    currentIndex === lessons.length - 1 &&
                      styles.navButtonDisabled,
                  ]}
                  onPress={() => {
                    if (currentIndex < lessons.length - 1) {
                      setCurrentLesson(lessons[currentIndex + 1]);
                    }
                  }}
                  disabled={currentIndex === lessons.length - 1}
                >
                  <Text style={styles.navButtonText}>Next →</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No lessons yet</Text>
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
    paddingRight: Layout.sm,
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#F5F3EF',
    textAlign: 'center',
    marginHorizontal: Layout.sm,
  },
  lessonsButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingLeft: Layout.sm,
  },
  lessonsButtonText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    zIndex: 100,
    paddingTop: 56,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sidebarTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  sidebarClose: {
    fontSize: Typography.lg,
    color: Colors.text2,
    padding: Layout.sm,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Layout.md,
    minHeight: Layout.minTouchTarget + 16,
  },
  lessonItemActive: {
    backgroundColor: Colors.goldDim,
  },
  lessonStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lessonStatusDone: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  lessonStatusCurrent: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  lessonStatusText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lessonItemContent: {
    flex: 1,
  },
  lessonItemTitle: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: '500',
  },
  lessonItemTitleActive: {
    color: Colors.gold,
    fontWeight: '700',
  },
  lessonItemDuration: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: Layout.tabBarHeight + Layout.xl,
  },
  lessonInfo: {
    padding: Layout.md,
  },
  lessonTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.sm,
  },
  lessonNumber: {
    fontSize: Typography.xs,
    color: Colors.text3,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lessonDuration: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  lessonTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
    lineHeight: Typography.xl * 1.3,
  },
  lessonDesc: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.md,
  },
  lessonContent: {
    fontSize: Typography.base,
    color: Colors.text,
    lineHeight: Typography.base * 1.7,
  },
  actions: {
    padding: Layout.md,
    gap: Layout.md,
  },
  markButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
  },
  markButtonDone: {
    backgroundColor: Colors.green,
  },
  markButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.base,
  },
  navButtons: {
    flexDirection: 'row',
    gap: Layout.sm,
  },
  navButton: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: Typography.base,
    color: Colors.text,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.xl,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.text3,
  },
});
