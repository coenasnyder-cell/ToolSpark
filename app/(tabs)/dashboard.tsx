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
  const [events, setEvents] = useState<Event[]>([]);

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
      id: 'members',
      title: 'Members',
      subtitle: 'View the community',
      icon: 'people-outline' as const,
      color: Colors.green,
      route: '/members',
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
  ];

  return (
    <View style={styles.container}>
      <Header subtitle="Dashboard" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome + avatar row */}
        <View style={styles.welcomeRow}>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeLabel}>Welcome back</Text>
            <Text style={styles.welcomeName}>{firstName} 👋</Text>
          </View>
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
        </View>

        {/* Stats row */}
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

        {/* Admin link */}
        {profile?.userRole === 'admin' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.adminCard}
              onPress={() => router.push('/admin' as any)}
            >
              <Ionicons
                name="shield-outline"
                size={20}
                color={Colors.gold}
              />
              <Text style={styles.adminCardText}>
                Admin Dashboard
              </Text>
              <Text style={styles.eventArrow}>→</Text>
            </TouchableOpacity>
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
  content: {
    paddingBottom: Layout.tabBarHeight + Layout.xl,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.lg,
    backgroundColor: Colors.sidebar,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: Typography.sm,
    color: Colors.text3,
    marginBottom: 2,
  },
  welcomeName: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: '#F5F3EF',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.md,
    marginTop: Layout.md,
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
});