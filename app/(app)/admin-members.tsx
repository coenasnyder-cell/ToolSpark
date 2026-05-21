import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
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
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

interface Member {
  id: string;
  displayName: string;
  photoURL: string;
  userEmail: string;
  userRole: string;
  createdAt: any;
  banned: boolean;
}

export default function AdminMembersScreen() {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Member[];
      setMembers(data);
    } catch (err) {
      console.log('Load members error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (member: Member) => {
    const isAdmin = member.userRole === 'admin';
    const currentUserId = auth.currentUser?.uid;

    if (member.id === currentUserId) {
      Alert.alert(
        'Cannot Change',
        'You cannot change your own role.'
      );
      return;
    }

    Alert.alert(
      isAdmin ? 'Remove Admin' : 'Make Admin',
      isAdmin
        ? `Remove admin access from ${member.displayName}?`
        : `Give admin access to ${member.displayName}? They will be able to manage tools, events and members.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isAdmin ? 'Remove Admin' : 'Make Admin',
          style: isAdmin ? 'destructive' : 'default',
          onPress: () => updateRole(
            member.id,
            isAdmin ? 'member' : 'admin'
          ),
        },
      ]
    );
  };

  const handleBanToggle = (member: Member) => {
    const currentUserId = auth.currentUser?.uid;

    if (member.id === currentUserId) {
      Alert.alert(
        'Cannot Ban',
        'You cannot ban yourself.'
      );
      return;
    }

    const isBanned = member.banned === true;

    Alert.alert(
      isBanned ? 'Unban Member' : 'Ban Member',
      isBanned
        ? `Allow ${member.displayName} to post again?`
        : `Ban ${member.displayName} from posting in the community?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isBanned ? 'Unban' : 'Ban',
          style: isBanned ? 'default' : 'destructive',
          onPress: () => updateBan(member.id, !isBanned),
        },
      ]
    );
  };

  const updateRole = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), {
        userRole: newRole,
      });
      setMembers(prev => prev.map(m =>
        m.id === userId ? { ...m, userRole: newRole } : m
      ));
    } catch (err) {
      Alert.alert('Error', 'Could not update role.');
    } finally {
      setUpdating(null);
    }
  };

  const updateBan = async (userId: string, banned: boolean) => {
    setUpdating(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { banned });
      setMembers(prev => prev.map(m =>
        m.id === userId ? { ...m, banned } : m
      ));
    } catch (err) {
      Alert.alert('Error', 'Could not update member.');
    } finally {
      setUpdating(null);
    }
  };

  const filteredMembers = members.filter(m => {
    const q = searchQuery.toLowerCase();
    return !q ||
      m.displayName?.toLowerCase().includes(q) ||
      m.userEmail?.toLowerCase().includes(q);
  });

  const admins = filteredMembers.filter(
    m => m.userRole === 'admin'
  );
  const regularMembers = filteredMembers.filter(
    m => m.userRole !== 'admin'
  );

  const formatJoined = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  };

  const renderMember = (item: Member) => (
    <TouchableOpacity
  key={item.id}
  style={[
    styles.memberCard,
    item.banned && styles.bannedCard,
  ]}
  activeOpacity={0.7}
  onPress={() => router.push({
    pathname: '/admin-member-detail',
    params: {
      userId: item.id,
      userEmail: item.userEmail,
    }
  } as any)}
>
      {/* Avatar */}
      {item.photoURL ? (
        <Image
          source={{ uri: item.photoURL }}
          style={styles.avatar}
        />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarFallbackText}>
            {item.displayName?.charAt(0)?.toUpperCase() || 'M'}
          </Text>
        </View>
      )}

      {/* Info */}
      <View style={styles.memberInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.memberName} numberOfLines={1}>
            {item.displayName || 'Member'}
          </Text>
          {item.userRole === 'admin' && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Admin</Text>
            </View>
          )}
          {item.banned && (
            <View style={styles.bannedBadge}>
              <Text style={styles.bannedBadgeText}>Banned</Text>
            </View>
          )}
        </View>
        <Text style={styles.memberEmail} numberOfLines={1}>
          {item.userEmail}
        </Text>
        <Text style={styles.memberJoined}>
          Joined {formatJoined(item.createdAt)}
        </Text>
      </View>

      {/* Actions */}
      {updating === item.id ? (
        <ActivityIndicator color={Colors.gold} size="small" />
      ) : (
        <View style={styles.actions}>
          {/* Role button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.userRole === 'admin'
                ? styles.removeAdminButton
                : styles.makeAdminButton,
            ]}
            onPress={() => handleRoleChange(item)}
          >
            <Ionicons
              name={item.userRole === 'admin'
                ? 'shield'
                : 'shield-outline'}
              size={16}
              color={item.userRole === 'admin'
                ? Colors.gold
                : Colors.text2}
            />
          </TouchableOpacity>

          {/* Ban button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.banned
                ? styles.unbanButton
                : styles.banButton,
            ]}
            onPress={() => handleBanToggle(item)}
          >
            <Ionicons
              name={item.banned
                ? 'checkmark-circle-outline'
                : 'ban-outline'}
              size={16}
              color={item.banned ? Colors.green : Colors.error}
            />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Manage Members</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={16}
          color={Colors.text3}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or email..."
          placeholderTextColor={Colors.text3}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Ionicons
            name="shield-outline"
            size={14}
            color={Colors.text2}
          />
          <Text style={styles.legendText}>
            Tap shield to toggle admin
          </Text>
        </View>
        <View style={styles.legendItem}>
          <Ionicons
            name="ban-outline"
            size={14}
            color={Colors.text2}
          />
          <Text style={styles.legendText}>
            Tap ban to restrict posting
          </Text>
        </View>
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        renderItem={null}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.adminBanner}>
              <View style={styles.adminBannerText}>
                <Text style={styles.adminBannerTitle}>Web Admin</Text>
                <Text style={styles.adminBannerDesc}>
                  For advanced member management, use the web admin panel.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.adminBannerButton}
                activeOpacity={0.8}
                onPress={async () => {
                  const url = 'https://toolspark.co/adminuserprofiles';
                  const ok = await Linking.canOpenURL(url);
                  if (ok) Linking.openURL(url);
                }}
              >
                <Ionicons name="open-outline" size={14} color={Colors.bg} />
                <Text style={styles.adminBannerButtonText}>Open Web Admin</Text>
              </TouchableOpacity>
            </View>
            {/* Admins section */}
            {admins.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Admins ({admins.length})
                </Text>
                {admins.map(renderMember)}
              </View>
            )}

            {/* Members section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Members ({regularMembers.length})
              </Text>
              {regularMembers.length === 0 ? (
                <Text style={styles.emptyText}>
                  No members found
                </Text>
              ) : (
                regularMembers.map(renderMember)
              )}
            </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Layout.md,
    marginVertical: Layout.md,
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.md,
    gap: Layout.sm,
    minHeight: Layout.buttonHeight,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: Layout.buttonHeight,
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: Layout.md,
    paddingBottom: Layout.sm,
    gap: Layout.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  listContent: {
    paddingBottom: Layout.xl,
  },
  section: {
    paddingHorizontal: Layout.md,
    marginBottom: Layout.md,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.md,
    paddingBottom: Layout.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginBottom: Layout.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.md,
  },
  bannedCard: {
    opacity: 0.6,
    borderColor: Colors.error,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    flexShrink: 0,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarFallbackText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.bg,
  },
  memberInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  memberName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  adminBadge: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  adminBadgeText: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '700',
  },
  bannedBadge: {
    backgroundColor: 'rgba(192,57,43,0.1)',
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  bannedBadgeText: {
    fontSize: 10,
    color: Colors.error,
    fontWeight: '700',
  },
  memberEmail: {
    fontSize: Typography.sm,
    color: Colors.text2,
    marginBottom: 2,
  },
  memberJoined: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  actions: {
    flexDirection: 'row',
    gap: Layout.sm,
    flexShrink: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Layout.radiusSm,
    borderWidth: 1,
  },
  makeAdminButton: {
    backgroundColor: Colors.surface2,
    borderColor: Colors.border,
  },
  removeAdminButton: {
    backgroundColor: Colors.goldDim,
    borderColor: Colors.gold,
  },
  banButton: {
    backgroundColor: 'rgba(192,57,43,0.1)',
    borderColor: Colors.error,
  },
  unbanButton: {
    backgroundColor: 'rgba(42,92,69,0.1)',
    borderColor: Colors.green,
  },
  emptyText: {
    fontSize: Typography.base,
    color: Colors.text3,
    textAlign: 'center',
    paddingVertical: Layout.lg,
  },
  adminBanner: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.lg,
    gap: Layout.md,
  },
  adminBannerText: {
    gap: 4,
  },
  adminBannerTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
  },
  adminBannerDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.5,
  },
  adminBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.sm,
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 12,
  },
  adminBannerButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.bg,
  },
});