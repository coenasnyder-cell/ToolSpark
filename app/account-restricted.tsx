import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../services/firebase';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Layout } from '../constants/layout';

export default function AccountRestrictedScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace('/(auth)/login' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons
            name="ban-outline"
            size={64}
            color={Colors.error}
          />
        </View>

        {/* Logo */}
        <Text style={styles.logo}>
          Tool<Text style={styles.logoSpark}>Spark</Text>
        </Text>

        {/* Message */}
        <Text style={styles.title}>Account Restricted</Text>
        <Text style={styles.message}>
          Your account has been restricted from accessing
          ToolSpark. This may be due to a violation of our
          community guidelines.
        </Text>

        <Text style={styles.subMessage}>
          If you believe this is a mistake please contact
          us at:
        </Text>

        <Text style={styles.email}>support@toolspark.co</Text>

        {/* Sign out button */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Layout.md,
  },
  content: {
    alignItems: 'center',
    maxWidth: 340,
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(192,57,43,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.lg,
    borderWidth: 2,
    borderColor: 'rgba(192,57,43,0.3)',
  },
  logo: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.lg,
  },
  logoSpark: {
    color: Colors.gold,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.base,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.md,
  },
  subMessage: {
    fontSize: Typography.sm,
    color: Colors.text2,
    textAlign: 'center',
    marginBottom: Layout.sm,
  },
  email: {
    fontSize: Typography.base,
    color: Colors.gold,
    fontWeight: '600',
    marginBottom: Layout.xl,
  },
  signOutButton: {
    backgroundColor: Colors.sidebar,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    paddingHorizontal: Layout.xl,
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
  },
  signOutButtonText: {
    color: '#F5F3EF',
    fontWeight: '700',
    fontSize: Typography.base,
  },
});