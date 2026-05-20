import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import {
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import {
  onUserTaggedDFY,
  onUserTaggedDIY,
  onUserUpgraded,
  updateContactTag,
  LOOPS_TAGS,
} from '../../services/loops';

interface Member {
  displayName: string;
  photoURL: string;
  userRole: string;
  userEmail: string;
  bio: string;
  createdAt: any;
  points: number;
  streak: number;
  badges: string[];
  doneForYou: boolean;
  diyClient: boolean;
  upgraded: boolean;
  emailOptIn: boolean;
  banned: boolean;
}

export default function AdminMemberDetailScreen() {
  const router = useRouter();
  const { userId, userEmail } = useLocalSearchParams<{
    userId: string;
    userEmail: string;
  }>();

  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local tag state
  const [doneForYou, setDoneForYou] = useState(false);
  const [diyClient, setDiyClient] = useState(false);
  const [upgraded, setUpgraded] = useState(false);
  const [banned, setBanned] = useState(false);
  const [role, setRole] = useState('member');

  useEffect(() => {
    loadMember();
  }, [userId]);

  const loadMember = async () => {
    try {
      const snap = await getDoc(doc(db, 'users', userId!));
      if (snap.exists()) {
        const data = snap.data() as Member;
        setMember(data);
        setDoneForYou(data.doneForYou || false);
        setDiyClient(data.diyClient || false);
        setUpgraded(data.upgraded || false);
        setBanned(data.banned || false);
        setRole(data.userRole || 'member');
      }
    } catch (err) {
      console.log('Load member error:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTags = async () => {
    if (!member || !userId) return;
    setSaving(true);
    try {
      const email = member.userEmail;

      // Update Firestore
      await updateDoc(doc(db, 'users', userId), {
        doneForYou,
        diyClient,
        upgraded,
        banned,
        userRole: role,
      });

      // Update Loops
      if (doneForYou) await onUserTaggedDFY(email);
      if (diyClient) await onUserTaggedDIY(email);
      if (upgraded) await onUserUpgraded(email);

      // Sync any other tag changes to Loops
      await updateContactTag(email, {
        [LOOPS_TAGS.DONE_FOR_YOU]: doneForYou,
        [LOOPS_TAGS.DIY_CLIENT]: diyClient,
        [LOOPS_TAGS.UPGRADED]: upgraded,
      });

      Alert.alert('Saved', 'Member tags updated successfully.');
    } catch (err) {
      console.log('Save tags error:', err);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatJoined = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate?.() || new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Member not found</Text>
      </View>
    );
  }

  const Toggle = ({
    label,
    value,
    onToggle,
    description,
  }: {
    label: string;
    value: boolean;
    onToggle: () => void;
    description?: string;
  }) => (
    <TouchableOpacity
      style={styles.toggleRow}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={styles.toggleInfo}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && (
          <Text style={styles.toggleDesc}>{description}</Text>
        )}
      </View>
      <View style={[styles.toggle, value && styles.toggleOn]}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Detail</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile row */}
        <View style={styles.profileRow}>
          {member.photoURL ? (
            <Image
              source={{ uri: member.photoURL }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {member.displayName?.charAt(0)?.toUpperCase() || 'M'}
              </Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{member.displayName}</Text>
            <Text style={styles.email}>{member.userEmail}</Text>
            <Text style={styles.joined}>
              Joined {formatJoined(member.createdAt)}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{member.points || 0}</Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{member.streak || 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {member.badges?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Role */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role</Text>
          <View style={styles.roleRow}>
            {['member', 'admin'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.roleChip,
                  role === r && styles.roleChipActive,
                ]}
                onPress={() => setRole(r)}
              >
                <Text style={[
                  styles.roleChipText,
                  role === r && styles.roleChipTextActive,
                ]}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loops Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Email Tags</Text>
          <Text style={styles.sectionSubtitle}>
            These sync to Loops and control which email campaigns this member receives
          </Text>
          <Toggle
            label="Done For You Client"
            description="Enrolled in DFY client email sequence"
            value={doneForYou}
            onToggle={() => {
              setDoneForYou(!doneForYou);
              if (!doneForYou) setDiyClient(false);
            }}
          />
          <Toggle
            label="DIY Client"
            description="Enrolled in self-serve client email sequence"
            value={diyClient}
            onToggle={() => {
              setDiyClient(!diyClient);
              if (!diyClient) setDoneForYou(false);
            }}
          />
          <Toggle
            label="Upgraded"
            description="Has purchased an upgrade or higher tier"
            value={upgraded}
            onToggle={() => setUpgraded(!upgraded)}
          />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Toggle
            label="Banned"
            description="Prevents member from posting in the community"
            value={banned}
            onToggle={() => setBanned(!banned)}
          />
          <View style={styles.optInRow}>
            <Text style={styles.toggleLabel}>Email Opt-In</Text>
            <Text style={[
              styles.optInStatus,
              member.emailOptIn
                ? styles.optInActive
                : styles.optInInactive,
            ]}>
              {member.emailOptIn ? 'Opted In' : 'Not Opted In'}
            </Text>
          </View>
        </View>

        {/* View public profile */}
        <TouchableOpacity
          style={styles.profileLink}
          onPress={() => router.push({
            pathname: '/member-profile',
            params: { userId }
          } as any)}
        >
          <Ionicons
            name="person-outline"
            size={16}
            color={Colors.gold}
          />
          <Text style={styles.profileLinkText}>
            View Public Profile
          </Text>
        </TouchableOpacity>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={saveTags}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.bg} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
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
  errorText: {
    fontSize: Typography.base,
    color: Colors.text3,
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
    paddingBottom: Layout.xxl,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    gap: Layout.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.bg,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
  },
  email: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  joined: {
    fontSize: Typography.xs,
    color: Colors.text3,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Layout.md,
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
    backgroundColor: Colors.border,
  },
  section: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    padding: Layout.md,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: Layout.md,
    lineHeight: Typography.xs * 1.6,
  },
  roleRow: {
    flexDirection: 'row',
    gap: Layout.sm,
    marginTop: Layout.sm,
  },
  roleChip: {
    paddingHorizontal: Layout.md,
    paddingVertical: 8,
    borderRadius: Layout.radiusFull,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface2,
  },
  roleChipActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  roleChipText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '600',
  },
  roleChipTextActive: {
    color: Colors.bg,
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: Layout.md,
  },
  toggleLabel: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: Colors.text,
  },
  toggleDesc: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginTop: 2,
    lineHeight: Typography.xs * 1.5,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleOn: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.text3,
  },
  toggleThumbOn: {
    backgroundColor: Colors.bg,
    alignSelf: 'flex-end',
  },
  optInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Layout.md,
  },
  optInStatus: {
    fontSize: Typography.sm,
    fontWeight: '700',
  },
  optInActive: {
    color: '#3D8A65',
  },
  optInInactive: {
    color: Colors.text3,
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.sm,
    paddingVertical: Layout.md,
    marginTop: 8,
  },
  profileLinkText: {
    fontSize: Typography.sm,
    color: Colors.gold,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    marginHorizontal: Layout.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.buttonHeight,
    marginTop: Layout.sm,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.bg,
  },
});