import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  subtitle?: string;
  showNotifications?: boolean;
  notificationCount?: number;
  showSearch?: boolean;
  isSearching?: boolean;
  searchQuery?: string;
  onSearchPress?: () => void;
  onSearchChange?: (text: string) => void;
  onSearchClose?: () => void;
}

export default function Header({
  subtitle,
  showNotifications = true,
  notificationCount = 0,
  showSearch = false,
  isSearching = false,
  searchQuery = '',
  onSearchPress,
  onSearchChange,
  onSearchClose,
}: HeaderProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login' as any);
    } catch (err) {
      console.log('Sign out error:', err);
    }
  };

  if (isSearching) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor={Colors.text3}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoFocus
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.cancelButton} onPress={onSearchClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>
          Tool<Text style={styles.logoSpark}>Spark</Text>
        </Text>
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
      </View>

      {/* Right actions */}
      <View style={styles.actions}>
        {showSearch && (
          <TouchableOpacity style={styles.iconButton} onPress={onSearchPress}>
            <Ionicons name="search-outline" size={20} color="#F5F3EF" />
          </TouchableOpacity>
        )}

        {showNotifications && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/notifications' as any)}
          >
            <Ionicons name="notifications-outline" size={20} color="#F5F3EF" />
            {notificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {notificationCount > 9 ? '9+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.iconButton} onPress={handleSignOut}>
          <Ionicons name="exit-outline" size={20} color="#F5F3EF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.sidebar,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.md,
    paddingTop: 52,
    paddingBottom: 12,
    borderBottomWidth: 0,
  },
  logoContainer: {
    flex: 1,
  },
  logo: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: '#F5F3EF',
    letterSpacing: -0.3,
  },
  logoSpark: {
    color: Colors.gold,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 4,
    backgroundColor: Colors.coral,
    borderRadius: Layout.radiusFull,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  searchInput: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: 8,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  cancelButton: {
    paddingLeft: Layout.md,
    height: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: Typography.sm,
    color: Colors.goldLight,
    fontWeight: '600',
  },
});
