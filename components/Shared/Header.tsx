import React from 'react';
import {
  View,
  Text,
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
  showProfile?: boolean;
  notificationCount?: number;
}

export default function Header({
  subtitle,
  showNotifications = true,
  showProfile = true,
  notificationCount = 0,
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
        
       {/* Notification bell */}
{showNotifications && (
  <TouchableOpacity
    style={styles.iconButton}
    onPress={() => 
      router.push('/(app)/notifications' as any)
    }
  >
    <Ionicons name="notifications-outline" size={20} color="#F5F3EF" />
    {notificationCount > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {notificationCount > 9 
            ? '9+' 
            : notificationCount}
        </Text>
      </View>
    )}
  </TouchableOpacity>
        )}

        {/* Profile avatar */}
        {showProfile && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() =>
              router.push('/(app)/member-profile' as any)
            }
          >
    <Ionicons name="person-circle-outline" size={22} color="#F5F3EF" />
          </TouchableOpacity>
        )}

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>Sign out</Text>
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
    gap: Layout.sm,
  },
  iconButton: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
    icon: {
    fontSize: 16,
    color: '#F5F3EF',
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
 signOutButton: {
  paddingHorizontal: Layout.sm,
  paddingVertical: 6,
  minHeight: Layout.minTouchTarget,
  justifyContent: 'center',
  borderWidth: 1,
  borderColor: Colors.text3,
  borderRadius: Layout.radiusFull,
},
signOutText: {
  fontSize: Typography.sm,
  color: '#FFFFFF',    // light color so it's visible
  fontWeight: '600',
},
});