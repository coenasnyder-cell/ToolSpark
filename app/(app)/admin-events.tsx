import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
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
  eventLocation: string;
  eventURL: string;
  status: string;
  isRecurring: boolean;
}

export default function AdminEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'Events'),
      orderBy('eventStart', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Event[];
      setEvents(data);
      setLoading(false);
    }, () => setLoading(false));

    return unsubscribe;
  }, []);

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.eventTitle}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'Events', event.id));
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'upcoming') return Colors.green;
    if (status === 'live') return Colors.coral;
    return Colors.text3;
  };

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventLeft}>
        <View style={[
          styles.statusDot,
          { backgroundColor: getStatusColor(item.status) }
        ]} />
      </View>

      <View style={styles.eventInfo}>
        <View style={styles.eventNameRow}>
          <Text style={styles.eventTitle} numberOfLines={1}>
            {item.eventTitle}
          </Text>
          {item.isRecurring && (
            <Text style={styles.recurringBadge}>↻</Text>
          )}
        </View>
        <Text style={styles.eventMeta}>
          {item.eventStart}
          {item.eventLocation ? ` · ${item.eventLocation}` : ''}
        </Text>
        <View style={[
          styles.statusBadge,
          { borderColor: getStatusColor(item.status) }
        ]}>
          <Text style={[
            styles.statusText,
            { color: getStatusColor(item.status) }
          ]}>
            {item.status?.toUpperCase() || 'UPCOMING'}
          </Text>
        </View>
      </View>

      <View style={styles.eventActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push({
            pathname: '/admin-event-edit',
            params: { eventId: item.id }
          } as any)}
        >
          <Ionicons
            name="pencil-outline"
            size={18}
            color={Colors.gold}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={Colors.error}
          />
        </TouchableOpacity>
      </View>
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Events</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin-event-edit' as any)}
        >
          <Ionicons name="add" size={24} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={renderEvent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={Colors.text3}
            />
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to add your first event
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => router.push('/admin-event-edit' as any)}
            >
              <Text style={styles.addFirstButtonText}>
                Add Event
              </Text>
            </TouchableOpacity>
          </View>
        }
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
  addButton: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Layout.md,
    paddingBottom: Layout.xl,
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
  eventLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  eventInfo: {
    flex: 1,
  },
  eventNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    marginBottom: 4,
  },
  eventTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  recurringBadge: {
    fontSize: Typography.base,
    color: Colors.text2,
  },
  eventMeta: {
    fontSize: Typography.sm,
    color: Colors.text2,
    marginBottom: Layout.sm,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  eventActions: {
    gap: Layout.sm,
    flexShrink: 0,
  },
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusSm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,57,43,0.1)',
    borderRadius: Layout.radiusSm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
    gap: Layout.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
  },
  addFirstButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.xl,
    paddingVertical: Layout.md,
    marginTop: Layout.sm,
  },
  addFirstButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.base,
  },
});