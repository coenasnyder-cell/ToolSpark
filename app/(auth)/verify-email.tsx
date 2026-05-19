import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  sendEmailVerification,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      // If email is verified redirect to app
      if (u?.emailVerified) {
        router.replace('/(tabs)' as any);
      }
    });
    return unsubscribe;
  }, []);

  const handleResend = async () => {
    if (!user) return;
    setSending(true);
    try {
      await sendEmailVerification(user, {
        url: 'https://toolspark.co/auth-action',
      });
      setSent(true);
      Alert.alert(
        'Email Sent',
        'Check your inbox and click the verification link.'
      );
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        Alert.alert(
          'Too Many Requests',
          'Please wait a few minutes before requesting another email.'
        );
      } else {
        Alert.alert('Error', 'Could not send email. Try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!user) return;
    setChecking(true);
    try {
      // Reload user to get latest emailVerified status
      await user.reload();
      const refreshedUser = auth.currentUser;
      if (refreshedUser?.emailVerified) {
        router.replace('/(tabs)' as any);
      } else {
        Alert.alert(
          'Not Verified Yet',
          'Your email has not been verified yet. Check your inbox and click the link.'
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Could not check verification status.');
    } finally {
      setChecking(false);
    }
  };

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
            name="mail-outline"
            size={64}
            color={Colors.gold}
          />
        </View>

        {/* Logo */}
        <Text style={styles.logo}>
          Tool<Text style={styles.logoSpark}>Spark</Text>
        </Text>

        <Text style={styles.title}>Verify your email</Text>

        <Text style={styles.message}>
          We sent a verification link to:
        </Text>

        <Text style={styles.email}>
          {user?.email || 'your email address'}
        </Text>

        <Text style={styles.instructions}>
          Click the link in the email to verify your account.
          Once verified tap the button below to continue.
        </Text>

        {/* Check verification button */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            checking && styles.disabledButton,
          ]}
          onPress={handleCheckVerification}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>
              I verified my email
            </Text>
          )}
        </TouchableOpacity>

        {/* Resend button */}
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            (sending || sent) && styles.disabledButton,
          ]}
          onPress={handleResend}
          disabled={sending || sent}
        >
          {sending ? (
            <ActivityIndicator color={Colors.gold} size="small" />
          ) : (
            <Text style={styles.secondaryButtonText}>
              {sent ? '✓ Email sent' : 'Resend verification email'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>
            Didn't receive the email?
          </Text>
          <Text style={styles.tipText}>
            • Check your spam or junk folder
          </Text>
          <Text style={styles.tipText}>
            • Make sure you signed up with the right email
          </Text>
          <Text style={styles.tipText}>
            • Wait a few minutes and try again
          </Text>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutText}>
            Use a different account
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
    padding: Layout.md,
  },
  content: {
    alignItems: 'center',
    maxWidth: 380,
    width: '100%',
    alignSelf: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.lg,
    borderWidth: 2,
    borderColor: Colors.gold,
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
    marginBottom: Layout.sm,
  },
  email: {
    fontSize: Typography.base,
    color: Colors.gold,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Layout.md,
  },
  instructions: {
    fontSize: Typography.sm,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: Typography.sm * 1.6,
    marginBottom: Layout.xl,
  },
  primaryButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.buttonHeight,
    width: '100%',
    marginBottom: Layout.md,
  },
  primaryButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Layout.buttonHeight,
    width: '100%',
    marginBottom: Layout.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.gold,
    fontWeight: '600',
    fontSize: Typography.base,
  },
  disabledButton: {
    opacity: 0.6,
  },
  tipsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.lg,
    gap: Layout.sm,
  },
  tipsTitle: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  tipText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
  },
  signOutButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    fontSize: Typography.sm,
    color: Colors.text3,
    fontWeight: '500',
  },
});