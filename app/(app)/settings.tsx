import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import {
  deleteUser,
  onAuthStateChanged,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import {
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { useEffect } from 'react';

export default function SettingsScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      // Delete Firestore user document
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete Firebase Auth account
      await deleteUser(user);

      router.replace('/(auth)/login' as any);
    } catch (err: any) {
      // If requires recent login
      if (err.code === 'auth/requires-recent-login') {
        Alert.alert(
          'Re-authentication Required',
          'For security, please sign out and sign back in before deleting your account.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'Could not delete account. Please try again.'
        );
      }
      console.log('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

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
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>
                  Push Notifications
                </Text>
                <Text style={styles.settingDesc}>
                  Get notified about new comments and activity
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: Colors.border,
                  true: Colors.gold,
                }}
                thumbColor={Colors.surface}
              />
            </View>

            <View style={styles.settingDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>
                  Email Notifications
                </Text>
                <Text style={styles.settingDesc}>
                  Receive updates via email
                </Text>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{
                  false: Colors.border,
                  true: Colors.gold,
                }}
                thumbColor={Colors.surface}
                disabled
              />
            </View>
          </View>
          <Text style={styles.comingSoonNote}>
            More notification options coming soon
          </Text>
        </View>

        {/* Purchases */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Membership</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingRowTap}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>
                  Current Plan
                </Text>
                <Text style={styles.settingDesc}>
                  Free Member
                </Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingRowTap}>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>
                  Restore Purchases
                </Text>
                <Text style={styles.settingDesc}>
                  Restore previous purchases
                </Text>
              </View>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.comingSoonNote}>
            Paid membership coming soon
          </Text>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRowTap}
              onPress={() =>
                Linking.openURL('https://toolspark.co/privacy-policy.html')
              }
            >
              <Text style={styles.settingLabel}>
                Privacy Policy
              </Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity
              style={styles.settingRowTap}
              onPress={() =>
                Linking.openURL('https://toolspark.co/terms.html')
              }
            >
              <Text style={styles.settingLabel}>
                Terms of Use
              </Text>
              <Text style={styles.settingArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingRowTap}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              <Text style={[
                styles.settingLabel,
                { color: Colors.error }
              ]}>
                {deleting
                  ? 'Deleting...'
                  : 'Delete Account'}
              </Text>
              <Text style={[
                styles.settingArrow,
                { color: Colors.error }
              ]}>→</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dangerNote}>
            Permanently deletes your account and all data.
            This cannot be undone.
          </Text>
        </View>

        {/* App version */}
        <Text style={styles.version}>
          ToolSpark · Version 1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
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
  content: {
    padding: Layout.md,
    paddingBottom: Layout.xl,
  },
  section: {
    marginBottom: Layout.lg,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.sm,
  },
  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Layout.md,
    minHeight: Layout.minTouchTarget + 16,
    gap: Layout.md,
  },
  settingRowTap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Layout.md,
    minHeight: Layout.minTouchTarget + 8,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
  },
  settingArrow: {
    fontSize: Typography.base,
    color: Colors.text3,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  comingSoonNote: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  dangerNote: {
    fontSize: Typography.xs,
    color: Colors.error,
    marginTop: 6,
    paddingHorizontal: 4,
    opacity: 0.7,
  },
  version: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textAlign: 'center',
    marginTop: Layout.md,
  },
});