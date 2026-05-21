import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  Linking,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  isPublished: boolean;
  isFree: boolean;
  order: number;
  totallessons: number;
}

export default function AdminCoursesScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const q = query(
        collection(db, 'courses'),
        orderBy('order', 'asc')
      );
      const snap = await getDocs(q);
      setCourses(snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Course[]);
    } catch (err) {
      console.log('Load courses error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublished = async (course: Course) => {
    setSaving(course.id);
    try {
      await updateDoc(doc(db, 'courses', course.id), {
        isPublished: !course.isPublished,
      });
      setCourses(prev => prev.map(c =>
        c.id === course.id
          ? { ...c, isPublished: !c.isPublished }
          : c
      ));
    } catch (err) {
      Alert.alert('Error', 'Could not update course.');
    } finally {
      setSaving(null);
    }
  };

  const handleOrderChange = async (
    course: Course,
    direction: 'up' | 'down'
  ) => {
    const index = courses.findIndex(c => c.id === course.id);
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === courses.length - 1) return;

    setSaving(course.id);
    try {
      const newOrder = direction === 'up'
        ? (courses[index - 1].order || index) - 1
        : (courses[index + 1].order || index) + 1;

      await updateDoc(doc(db, 'courses', course.id), {
        order: newOrder,
      });
      await loadCourses();
    } catch (err) {
      Alert.alert('Error', 'Could not update order.');
    } finally {
      setSaving(null);
    }
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Courses</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Web admin banner */}
        <View style={styles.webBanner}>
          <View style={styles.webBannerText}>
            <Text style={styles.webBannerTitle}>
              Full Course Editor
            </Text>
            <Text style={styles.webBannerDesc}>
              For advanced options like creating courses, adding lessons, and uploading videos, use the web admin panel.
            </Text>
          </View>
          <TouchableOpacity
            style={styles.webBannerButton}
            onPress={async () => {
              const url = 'https://toolspark.co/admindashboard';
              const ok = await Linking.canOpenURL(url);
              if (ok) Linking.openURL(url);
            }}
            activeOpacity={0.8}
          >
            <Ionicons
              name="open-outline"
              size={14}
              color={Colors.bg}
            />
            <Text style={styles.webBannerButtonText}>
              Open Web Admin
            </Text>
          </TouchableOpacity>
        </View>

        {/* Course list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            All Courses · {courses.length}
          </Text>
          <Text style={styles.sectionSubtitle}>
            Toggle publish status or reorder courses
          </Text>

          {courses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                No courses yet — create one in the web admin
              </Text>
            </View>
          ) : (
            courses.map((course, index) => (
              <View key={course.id} style={styles.courseCard}>
                {/* Order buttons */}
                <View style={styles.orderButtons}>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() => handleOrderChange(course, 'up')}
                    disabled={saving === course.id || index === 0}
                  >
                    <Ionicons
                      name="chevron-up"
                      size={16}
                      color={index === 0 ? Colors.border : Colors.text2}
                    />
                  </TouchableOpacity>
                  <Text style={styles.orderNumber}>{index + 1}</Text>
                  <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={() => handleOrderChange(course, 'down')}
                    disabled={
                      saving === course.id ||
                      index === courses.length - 1
                    }
                  >
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={
                        index === courses.length - 1
                          ? Colors.border
                          : Colors.text2
                      }
                    />
                  </TouchableOpacity>
                </View>

                {/* Course info */}
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle} numberOfLines={1}>
                    {course.title}
                  </Text>
                  <View style={styles.courseMeta}>
                    <Text style={styles.courseMetaText}>
                      {course.totallessons || 0} lessons
                    </Text>
                    {course.isFree && (
                      <View style={styles.freeBadge}>
                        <Text style={styles.freeBadgeText}>Free</Text>
                      </View>
                    )}
                    <View style={[
                      styles.categoryBadge,
                    ]}>
                      <Text style={styles.categoryBadgeText}>
                        {course.category}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Published toggle */}
                {saving === course.id ? (
                  <ActivityIndicator
                    size="small"
                    color={Colors.gold}
                    style={styles.savingIndicator}
                  />
                ) : (
                  <View style={styles.publishToggle}>
                    <Text style={styles.publishLabel}>
                      {course.isPublished ? 'Live' : 'Draft'}
                    </Text>
                    <Switch
                      value={course.isPublished}
                      onValueChange={() => handleTogglePublished(course)}
                      trackColor={{
                        false: Colors.border,
                        true: Colors.gold,
                      }}
                      thumbColor={Colors.surface}
                    />
                  </View>
                )}
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingTop: 60,
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 0,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingRight: Layout.md,
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.gold,
  },
  headerRight: {
    width: 60,
  },
  content: {
    padding: Layout.md,
    paddingBottom: Layout.xxl,
  },

  // Web banner
  webBanner: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.lg,
    gap: Layout.md,
  },
  webBannerText: {
    gap: 4,
  },
  webBannerTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  webBannerDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.5,
  },
  webBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.sm,
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 12,
  },
  webBannerButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.bg,
  },

  // Sections
  section: {
    marginBottom: Layout.lg,
  },
  sectionTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: Layout.md,
  },
  emptyState: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.text3,
    textAlign: 'center' as const,
  },

  // Course card
  courseCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.sm,
    gap: Layout.sm,
  },
  orderButtons: {
    alignItems: 'center' as const,
    gap: 2,
    flexShrink: 0,
  },
  orderBtn: {
    width: 28,
    height: 28,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  orderNumber: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.gold,
    minWidth: 16,
    textAlign: 'center' as const,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  courseMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Layout.sm,
    flexWrap: 'wrap' as const,
  },
  courseMetaText: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  freeBadge: {
    backgroundColor: 'rgba(39,174,96,0.15)',
    borderRadius: Layout.radiusFull,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(39,174,96,0.4)',
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#27ae60',
  },
  categoryBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: Colors.text3,
  },
  savingIndicator: {
    width: 60,
    flexShrink: 0,
  },
  publishToggle: {
    alignItems: 'center' as const,
    gap: 2,
    flexShrink: 0,
  },
  publishLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text3,
  },
});