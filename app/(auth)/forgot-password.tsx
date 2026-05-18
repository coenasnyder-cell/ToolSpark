import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert('Required', 'Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert('Invalid', 'Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      setSent(true);
    } catch (err: any) {
      Alert.alert(
        'Error',
        err.code === 'auth/user-not-found'
          ? 'No account found with that email address.'
          : 'Something went wrong. Please try again.'
      );
    } finally {
      setSending(false);
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
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <Text style={styles.logo}>
          Tool<Text style={styles.logoSpark}>Spark</Text>
        </Text>

        {!sent ? (
          <>
            <Text style={styles.title}>Reset your password</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we'll send you
              a link to reset your password.
            </Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.text3}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                editable={!sending}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.sendButton,
                sending && styles.disabledButton,
              ]}
              onPress={handleSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color={Colors.bg} size="small" />
              ) : (
                <Text style={styles.sendButtonText}>
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backToLogin}
              onPress={() => router.replace('/(auth)/login' as any)}
            >
              <Text style={styles.backToLoginText}>
                Back to sign in
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Success state */
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✉️</Text>
            <Text style={styles.successTitle}>Check your email</Text>
            <Text style={styles.successMessage}>
              We sent a password reset link to{' '}
              <Text style={styles.successEmail}>{email}</Text>.
              Check your inbox and follow the instructions.
            </Text>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={() => router.replace('/(auth)/login' as any)}
            >
              <Text style={styles.sendButtonText}>
                Back to Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendButton}
              onPress={() => {
                setSent(false);
                setEmail('');
              }}
            >
              <Text style={styles.resendText}>
                Try a different email
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Layout.md,
    paddingTop: 56,
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: Layout.md,
    paddingTop: Layout.xl,
  },
  logo: {
    fontSize: Typography.xxl,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Layout.xl,
  },
  logoSpark: {
    color: Colors.gold,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.xl,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text2,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldBlock: {
    marginBottom: Layout.lg,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
    fontSize: Typography.base,
    color: Colors.text,
    minHeight: Layout.buttonHeight,
  },
  sendButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
    marginBottom: Layout.md,
  },
  sendButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  backToLogin: {
    alignItems: 'center',
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  backToLoginText: {
    fontSize: Typography.base,
    color: Colors.gold,
    fontWeight: '600',
  },
  successCard: {
    alignItems: 'center',
    paddingTop: Layout.xl,
  },
  successIcon: {
    fontSize: 48,
    marginBottom: Layout.lg,
  },
  successTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
  },
  successMessage: {
    fontSize: Typography.base,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: Typography.base * 1.6,
    marginBottom: Layout.xl,
  },
  successEmail: {
    color: Colors.text,
    fontWeight: '600',
  },
  resendButton: {
    alignItems: 'center',
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  resendText: {
    fontSize: Typography.base,
    color: Colors.text2,
  },
});