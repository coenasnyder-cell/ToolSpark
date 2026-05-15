import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase'; // make sure this exports Firestore
import { useAccountStatus } from '../../hooks/useAccountStatus';

type Thread = {
  id: string;
  listingTitle?: string;
  listingImage?: string;
  buyerId?: string;
  sellerId?: string;
  participantIds?: string[];
  lastMessage?: string;
  lastTimestamp?: unknown;
  hiddenFor?: string[];
};

type ParticipantSummary = {
  profileImage: string | null;
  name: string;
};

function getOtherParticipantId(thread: Thread, currentUserId: string): string | null {
  const participantIds = Array.isArray(thread.participantIds)
    ? thread.participantIds.filter((participantId) => typeof participantId === 'string' && participantId.trim().length > 0)
    : [thread.buyerId, thread.sellerId].filter((participantId): participantId is string => typeof participantId === 'string' && participantId.trim().length > 0);

  return participantIds.find((participantId) => participantId !== currentUserId) || null;
}

function getInitials(name: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return '?';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function formatThreadTime(value: unknown): string {
  try {
    if (!value) return 'No activity yet';
    if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
      return (value as { toDate: () => Date }).toDate().toLocaleDateString();
    }
    const parsed = new Date(value as string | number | Date);
    if (Number.isNaN(parsed.getTime())) return 'No activity yet';
    return parsed.toLocaleDateString();
  } catch {
    return 'No activity yet';
  }
}

export default function ThreadsList() {
  const { user, loading: authLoading } = useAccountStatus();

  const [participantByThreadId, setParticipantByThreadId] = useState<Record<string, ParticipantSummary>>({});
  const [showArchived, setShowArchived] = useState(false);
const [threads, setThreads] = useState<Thread[]>([]);
  const router = useRouter();

 useEffect(() => {
    console.log('[ThreadsList] mounted');
    return () => console.log('[ThreadsList] unmounted');
  }, []);

 useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setThreads([]);
      return;
    }

    const q = query(
      collection(db, 'threads'),
      where('participantIds', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Thread[];

      setThreads(results);
    }, (error) => {
      console.error('[ThreadsList] onSnapshot error:', error);
    });

    return () => unsubscribe();
  }, [authLoading, user?.uid]);

  const openThread = async (threadId: string) => {
    if (user?.uid) {
      try {
        await updateDoc(doc(db, 'threads', threadId), {
          unreadBy: arrayRemove(user.uid),
        });
      } catch {
        // Continue navigation even if read-state update fails.
      }
    }
    router.push({
      pathname: '../(app)/threadchat',
      params: { threadId }
    });
  };

  const archiveThread = async (threadId: string) => {
    if (!user?.uid) return;
    Alert.alert(
      'Archive Conversation',
      'This will hide the conversation from your inbox. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              await updateDoc(doc(db, 'threads', threadId), {
                hiddenFor: arrayUnion(user.uid),
              });
            } catch {
              Alert.alert('Error', 'Could not archive conversation right now.');
            }
          },
        },
      ]
    );
  };

  const unarchiveThread = async (threadId: string) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'threads', threadId), {
        hiddenFor: arrayRemove(user.uid),
      });
    } catch {
      Alert.alert('Error', 'Could not restore conversation right now.');
    }
  };

const filteredThreads = threads.filter((thread) => {
  const isArchived = (thread.hiddenFor || []).includes(user?.uid || '');
  return showArchived ? isArchived : !isArchived;
});

  const unreadCount = threads.filter((thread) => Array.isArray((thread as Thread & { unreadBy?: string[] }).unreadBy) && ((thread as Thread & { unreadBy?: string[] }).unreadBy || []).includes(user?.uid || '')).length;

  if (!user) {
    return (
      <View style={styles.stateWrap}>
        <Text style={styles.stateText}>Sign in to view your messages.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0b2744', '#154267', '#0f766e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>Messages</Text>
          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetricChip}>
              <Text style={styles.heroMetricValue}>{unreadCount}</Text>
              <Text style={styles.heroMetricLabel}>Unread</Text>
            </View>
            <View style={styles.heroMetricChip}>
              <Text style={styles.heroMetricValue}>{threads.length - filteredThreads.length}</Text>
              <Text style={styles.heroMetricLabel}>Archived</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.filterCard}>
        <Text style={styles.filterHeading}>View</Text>
        <View style={styles.filterRow}>
          <TouchableOpacity
            onPress={() => setShowArchived(false)}
            style={[styles.filterButton, !showArchived && styles.filterButtonActive]}
          >
            <Text style={[styles.filterButtonText, !showArchived && styles.filterButtonTextActive]}>Inbox</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowArchived(true)}
            style={[styles.filterButton, showArchived && styles.filterButtonActive]}
          >
            <Text style={[styles.filterButtonText, showArchived && styles.filterButtonTextActive]}>Archived</Text>
          </TouchableOpacity>
        </View>
      </View>

      {filteredThreads.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>{showArchived ? 'No archived conversations' : 'No conversations yet'}</Text>
          <Text style={styles.emptyText}>
            {showArchived
              ? 'Archived conversations will show up here.'
              : 'When buyers message you, your inbox will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
        data={filteredThreads}
        keyExtractor={(item) => item.id}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.threadContainer}>
            <TouchableOpacity
              onPress={() => openThread(item.id)}
              style={styles.threadTouchable}
            >
              {participantByThreadId[item.id]?.profileImage ? (
                <Image
                  source={{ uri: participantByThreadId[item.id].profileImage! }}
                  style={styles.threadAvatar}
                />
              ) : (
                <View style={styles.threadAvatarFallback}>
                  <Text style={styles.threadAvatarFallbackText}>{getInitials(participantByThreadId[item.id]?.name || 'User')}</Text>
                </View>
              )}

              <View style={{ flex: 1 }}>
                <View style={styles.threadHeaderRow}>
                  <Text style={styles.threadTitle} numberOfLines={1}>
                    {item.listingTitle || 'Conversation'}
                  </Text>
                  <Text style={styles.threadTimestamp}>{formatThreadTime(item.lastTimestamp)}</Text>
                </View>
                <Text style={styles.threadParticipant} numberOfLines={1}>
                  {participantByThreadId[item.id]?.name || 'User'}
                </Text>
                <Text style={styles.threadPreview} numberOfLines={2}>
                  {item.lastMessage || 'No messages yet'}
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => (showArchived ? unarchiveThread(item.id) : archiveThread(item.id))}
              style={styles.archiveButton}
            >
              <Text style={styles.archiveButtonText}>{showArchived ? 'Restore' : 'Archive'}</Text>
            </TouchableOpacity>
          </View>
        )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    backgroundColor: '#f8fafc',
  },
  hero: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 14,
    overflow: 'hidden',
    elevation: 4,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  heroMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroMetricChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
  },
  heroMetricValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  heroMetricLabel: {
    color: 'rgba(240, 249, 255, 0.8)',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stateWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#f8fafc',
  },
  stateText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  filterCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  filterHeading: {
    marginBottom: 10,
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#eef2f7',
  },
  filterButtonActive: {
    backgroundColor: '#0f3156',
  },
  filterButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  threadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 2,
  },
  threadTouchable: {
    flex: 1,
    flexDirection: 'row',
    padding: 14,
    alignItems: 'center',
  },
  threadAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#e2e8f0',
  },
  threadAvatarFallback: {
    width: 54,
    height: 54,
    borderRadius: 18,
    marginRight: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  threadAvatarFallbackText: {
    color: '#0f3156',
    fontWeight: '800',
    fontSize: 14,
  },
  threadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  threadTitle: {
    flex: 1,
    fontWeight: '800',
    fontSize: 15,
    color: '#0f172a',
  },
  threadTimestamp: {
    maxWidth: 86,
    color: '#64748b',
    fontSize: 11,
    textAlign: 'right',
  },
  threadParticipant: {
    marginTop: 4,
    color: '#0f766e',
    fontSize: 12,
    fontWeight: '700',
  },
  threadPreview: {
    color: '#64748b',
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
  archiveButton: {
    marginRight: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#eef2f7',
  },
  archiveButtonText: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 12,
  },
});
