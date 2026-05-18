import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Event {
  id: string;
  eventTitle: string;
  eventStart: string;
  eventURL: string;
  eventLocation: string;
  status: string;
  isRecurring: boolean;
  eventLength: number;
  description: string;
}

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const q = query(
        collection(db, 'Events'),
        orderBy('eventStart', 'asc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Event[];
      setEvents(data);
    } catch (err) {
      console.log('Load events error:', err);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const upcomingEvents = events.filter(
    e => e.status === 'upcoming'
  );
  const pastEvents = events.filter(
    e => e.status !== 'upcoming'
  );

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      {/* Date badge */}
      <View style={styles.dateBadge}>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={Colors.gold}
        />
      </View>

      {/* Event info */}
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle}>{item.eventTitle}</Text>
        <Text style={styles.eventMeta}>
          {item.eventStart}
          {item.eventLocation ? ` · ${item.eventLocation}` : ''}
        </Text>
        {item.isRecurring && (
          <View style={styles.recurringBadge}>
            <Text style={styles.recurringText}>↻ Recurring</Text>
          </View>
        )}
      </View>

      {/* Join button */}
      {item.eventURL ? (
        <TouchableOpacity
          style={styles.joinButton}
         onPress={() => {
  // Extract just the zoom URL from the text
  const urlMatch = item.eventURL.match(
    /https:\/\/[^\s]+zoom\.us\/j\/[^\s]+/
  );
  const zoomUrl = urlMatch ? urlMatch[0] : null;
  if (zoomUrl) {
    Linking.openURL(zoomUrl);
  }
}}
        >
          <Text style={styles.joinButtonText}>Join</Text>
        </TouchableOpacity>
      ) : null}
    </View>
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={styles.headerRight} />
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Upcoming events */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Upcoming Events
              </Text>
              {upcomingEvents.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>
                    No upcoming events · Check back soon
                  </Text>
                </View>
              ) : (
                upcomingEvents.map(event => (
                  <View key={event.id}>
                    {renderEvent({ item: event })}
                  </View>
                ))
              )}
            </View>

            {/* Past events */}
            {pastEvents.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Past Events
                </Text>
                {pastEvents.map(event => (
                  <View
                    key={event.id}
                    style={styles.pastEventWrapper}
                  >
                    {renderEvent({ item: event })}
                  </View>
                ))}
              </View>
            )}
          </View>
        }
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    paddingBottom: Layout.xl,
  },
  section: {
    paddingHorizontal: Layout.md,
    paddingTop: Layout.lg,
    marginBottom: Layout.sm,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.md,
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: Layout.radiusSm,
    backgroundColor: Colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  eventMeta: {
    fontSize: Typography.sm,
    color: Colors.text2,
    marginBottom: 4,
  },
  recurringBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  recurringText: {
    fontSize: 10,
    color: Colors.text2,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    minHeight: 36,
    justifyContent: 'center',
    flexShrink: 0,
  },
  joinButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.sm,
  },
  pastEventWrapper: {
    opacity: 0.6,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.sm,
    color: Colors.text3,
  },
});