import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  where,
  Timestamp,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

const LEVELS = [
  { level: 1, name: 'Beginner',              min: 0 },
  { level: 2, name: 'Action Taker',          min: 100 },
  { level: 3, name: 'Creative Contributor',  min: 300 },
  { level: 4, name: 'Community Builder',     min: 600 },
  { level: 5, name: 'Community Expert',      min: 1000 },
  { level: 6, name: 'Community Pro',         min: 2000 },
  { level: 7, name: 'Community Leader',      min: 4000 },
  { level: 8, name: 'Top Performer',         min: 7000 },
  { level: 9, name: 'LEGENDARY',             min: 10000 },
];

const getUserLevel = (points: number) => {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (points >= lvl.min) current = lvl;
    else break;
  }
  return current;
};

interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL: string;
  points: number;
  streak: number;
}

type TabType = '7d' | '30d' | 'all';

export default function LeaderboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [allEntries, setAllEntries] = useState<LeaderboardEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<LeaderboardEntry[]>([]);
  const [monthEntries, setMonthEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserData, setCurrentUserData] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setCurrentUserId(u?.uid ?? null);
      if (u) {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) setCurrentUserData(snap.data());
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    loadAllTime();
  }, []);

  useEffect(() => {
    if (activeTab === '7d' && weekEntries.length === 0) {
      loadTimeBased(7, setWeekEntries);
    } else if (activeTab === '30d' && monthEntries.length === 0) {
      loadTimeBased(30, setMonthEntries);
    }
  }, [activeTab]);

  const loadAllTime = async () => {
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('points', 'desc'), limit(50))
      );
      setAllEntries(snap.docs.map(d => {
        const raw = d.data();
        return {
          userId: d.id,
          displayName: raw.displayName || 'Member',
          photoURL: raw.photoURL || '',
          points: raw.points || 0,
          streak: raw.streak || 0,
        };
      }));
    } catch (err) {
      console.log('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTimeBased = async (
    days: number,
    setter: (e: LeaderboardEntry[]) => void
  ) => {
    setTabLoading(true);
    try {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffTs = Timestamp.fromDate(cutoff);

      const usersSnap = await getDocs(
        query(collection(db, 'users'), orderBy('points', 'desc'), limit(50))
      );

      const results = await Promise.all(
        usersSnap.docs.map(async (userDoc) => {
          const raw = userDoc.data();
          const txSnap = await getDocs(
            query(
              collection(db, 'pointsHistory', userDoc.id, 'transactions'),
              where('createdAt', '>=', cutoffTs)
            )
          );
          const periodPoints = txSnap.docs.reduce(
            (sum, tx) => sum + (tx.data().points || 0), 0
          );
          return {
            userId: userDoc.id,
            displayName: raw.displayName || 'Member',
            photoURL: raw.photoURL || '',
            points: periodPoints,
            streak: raw.streak || 0,
          };
        })
      );

      setter(
        results
          .filter(r => r.points > 0)
          .sort((a, b) => b.points - a.points)
      );
    } catch (err) {
      console.log('Time-based leaderboard error:', err);
    } finally {
      setTabLoading(false);
    }
  };

  const currentEntries =
    activeTab === '7d' ? weekEntries :
    activeTab === '30d' ? monthEntries :
    allEntries;

  const userPoints = currentUserData?.points || 0;
  const userLevel = getUserLevel(userPoints);
  const nextLevel = LEVELS.find(l => l.level === userLevel.level + 1);
  const pointsToNext = nextLevel ? nextLevel.min - userPoints : 0;

  const renderAvatar = (photoURL: string, displayName: string, size: number) => {
    if (photoURL) {
      return (
        <Image
          source={{ uri: photoURL }}
          style={{ width: size, height: size, borderRadius: size / 2,
            borderWidth: 2, borderColor: Colors.border }}
        />
      );
    }
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2,
        backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: Colors.bg }}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderRankBadge = (rank: number) => {
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    if (medals[rank]) {
      return <Text style={{ fontSize: 22 }}>{medals[rank]}</Text>;
    }
    return (
      <View style={styles.rankBadge}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  const leftLevels = LEVELS.slice(0, 5);
  const rightLevels = LEVELS.slice(5);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.top + 44}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        {currentUserData && (
          <View style={styles.profileCard}>
            {/* Top row: avatar + info */}
            <View style={styles.profileTopRow}>
              <View style={styles.profileAvatarWrap}>
                {renderAvatar(
                  currentUserData.photoURL || '',
                  currentUserData.displayName || 'M',
                  68
                )}
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{userLevel.level}</Text>
                </View>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{currentUserData.displayName}</Text>
                <Text style={styles.profileLevelName}>
                  Level {userLevel.level} - {userLevel.name}
                </Text>
                <Text style={styles.profilePointsToNext}>
                  {nextLevel
                    ? `${pointsToNext.toLocaleString()} points to level up`
                    : 'Max level reached 🏆'}
                </Text>
              </View>
            </View>

            {/* Level grid */}
            <View style={styles.levelGrid}>
              <View style={styles.levelColumn}>
                {leftLevels.map(lvl => {
                  const unlocked = userPoints >= lvl.min;
                  return (
                    <View key={lvl.level} style={styles.levelRow}>
                      <View style={[
                        styles.levelNumBadge,
                        unlocked ? styles.levelNumBadgeActive : styles.levelNumBadgeLocked,
                      ]}>
                        <Text style={styles.levelNumText}>
                          {unlocked ? lvl.level : '🔒'}
                        </Text>
                      </View>
                      <Text style={[styles.levelName, !unlocked && styles.levelNameLocked]} numberOfLines={1}>
                        Level {lvl.level} - {lvl.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <View style={styles.levelColumn}>
                {rightLevels.map(lvl => {
                  const unlocked = userPoints >= lvl.min;
                  return (
                    <View key={lvl.level} style={styles.levelRow}>
                      <View style={[
                        styles.levelNumBadge,
                        unlocked ? styles.levelNumBadgeActive : styles.levelNumBadgeLocked,
                      ]}>
                        <Text style={styles.levelNumText}>
                          {unlocked ? lvl.level : '🔒'}
                        </Text>
                      </View>
                      <Text style={[styles.levelName, !unlocked && styles.levelNameLocked]} numberOfLines={1}>
                        Level {lvl.level} - {lvl.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabs}>
          {(['7d', '30d', 'all'] as TabType[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab === '7d' ? '7-Day' : tab === '30d' ? '30-Day' : 'All-Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        {tabLoading ? (
          <ActivityIndicator color={Colors.gold} style={{ marginTop: Layout.xl }} />
        ) : currentEntries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No rankings yet</Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'all'
                ? 'Start engaging to earn points'
                : 'No activity in this period yet'}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderRank}>RANK</Text>
              <Text style={styles.listHeaderPoints}>
                {activeTab === 'all' ? 'POINTS' : 'POINTS EARNED'}
              </Text>
            </View>
            {currentEntries.map((entry, i) => {
              const rank = i + 1;
              const isCurrentUser = entry.userId === currentUserId;
              const pointsLabel = activeTab === 'all'
                ? entry.points.toLocaleString()
                : `+${entry.points.toLocaleString()}`;
              return (
                <View
                  key={entry.userId}
                  style={[styles.row, isCurrentUser && styles.rowHighlighted]}
                >
                  <View style={styles.rowRank}>
                    {renderRankBadge(rank)}
                  </View>
                  {renderAvatar(entry.photoURL, entry.displayName, 38)}
                  <View style={styles.rowInfo}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {entry.displayName}
                      {(entry.streak || 0) >= 3 ? ' 🔥' : ''}
                    </Text>
                  </View>
                  <Text style={[styles.rowPoints, rank <= 3 && styles.rowPointsTop]}>
                    {pointsLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
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
    paddingBottom: Layout.xl * 2,
  },

  // Profile card
  profileCard: {
    backgroundColor: Colors.surface,
    margin: Layout.md,
    borderRadius: Layout.radiusLg,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.md,
    marginBottom: Layout.md,
  },
  profileAvatarWrap: {
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.sidebar,
  },
  levelBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.bg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  profileLevelName: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
    marginBottom: 2,
  },
  profilePointsToNext: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },

  // Level grid
  levelGrid: {
    flexDirection: 'row',
    gap: Layout.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.md,
  },
  levelColumn: {
    flex: 1,
    gap: 6,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  levelNumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  levelNumBadgeActive: {
    backgroundColor: Colors.gold,
  },
  levelNumBadgeLocked: {
    backgroundColor: Colors.surface,
  },
  levelNumText: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.surface2,
  },
  levelName: {
    fontSize: 10,
    color: Colors.text,
    flex: 1,
  },
  levelNameLocked: {
    color: Colors.text,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusSm,
    marginHorizontal: Layout.md,
    marginBottom: Layout.md,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: Layout.sm,
    alignItems: 'center',
    borderRadius: Layout.radiusSm - 1,
  },
  tabActive: {
    backgroundColor: Colors.sidebar,
  },
  tabText: {
    fontSize: Typography.sm,
    color: Colors.text3,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.gold,
  },

  // List
  list: {
    marginHorizontal: Layout.md,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  listHeaderRank: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text3,
    letterSpacing: 0.5,
  },
  listHeaderPoints: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text3,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    paddingVertical: 10,
    paddingHorizontal: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowHighlighted: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusSm,
  },
  rowRank: {
    width: 30,
    alignItems: 'center',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 10,
    backgroundColor: Colors.text2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text3,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  rowPoints: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text3,
  },
  rowPointsTop: {
    color: Colors.gold,
  },

  // Empty
  empty: {
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
