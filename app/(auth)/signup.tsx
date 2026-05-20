import { useRouter } from 'expo-router';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import {
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { auth, db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { onUserSignup } from '../../services/loops';

export default function SignupScreen() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);
  const isMountedRef = useRef(true);
  const handleSignup = async () => {
    setError('');
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password
      );

      await updateProfile(userCredential.user, {
        displayName: trimmedName,
      });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        userId: userCredential.user.uid,
        userEmail: normalizedEmail,
        clientEmail: normalizedEmail,
        displayName: trimmedName,
        photoURL: '',
        userRole: 'member',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        emailOptIn,
      });

      const launchDate = new Date('2026-05-01');
      const thirtyDaysAfterLaunch = new Date(
        launchDate.getTime() + 30 * 24 * 60 * 60 * 1000
      );
      const isEarlyMember = new Date() <= thirtyDaysAfterLaunch;

      const nameParts = trimmedName.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      await onUserSignup({
        email: normalizedEmail,
        firstName,
        lastName,
        userId: userCredential.user.uid,
        optedIn: emailOptIn,
        isEarlyMember,
      });

     // Send verification email
await sendEmailVerification(userCredential.user, {
  url: 'https://toolspark.co/auth-action',
});
router.replace('/(auth)/verify-email' as any);
    } catch (authError: any) {
      if (isMountedRef.current) {
        if (authError.code === 'auth/email-already-in-use') {
          setError(
            'An account with this email already exists. Try signing in.'
          );
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.logo}>
          Tool<Text style={styles.logoSpark}>Spark</Text>
        </Text>
        <Text style={styles.tagline}>Clarity. Build. Launch.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          Join the community of AI tool builders
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How should we call you?"
            placeholderTextColor={Colors.text3}
            autoCapitalize="words"
            editable={!submitting}
          />
        </View>

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
            editable={!submitting}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.text3}
              secureTextEntry={!showPassword}
              editable={!submitting}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeText}>
                {showPassword ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat your password"
            placeholderTextColor={Colors.text3}
            secureTextEntry={!showPassword}
            editable={!submitting}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
<TouchableOpacity
  style={styles.optInRow}
  onPress={() => setEmailOptIn(!emailOptIn)}
  activeOpacity={0.7}
>
  <View style={[styles.checkbox, emailOptIn && styles.checkboxChecked]}>
    {emailOptIn && <Text style={styles.checkmark}>✓</Text>}
  </View>
  <Text style={styles.optInText}>
    I'd like to receive emails about new content, community updates, and helpful resources
  </Text>
</TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.signupButton,
            submitting && styles.disabledButton
          ]}
          onPress={handleSignup}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.signupButtonText}>
              Create Account
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.bottomLinks}>
          <View style={styles.signinRow}>
            <Text style={styles.mutedText}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login' as any)}
            >
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.xl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.xl,
  },
  logo: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  logoSpark: {
    color: Colors.gold,
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.text2,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLg,
    padding: Layout.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
    marginBottom: Layout.lg,
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
    marginBottom: Layout.md,
  },
  input: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingVertical: 14,
    paddingHorizontal: Layout.md,
    fontSize: Typography.base,
    color: Colors.text,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: Layout.md,
    fontSize: Typography.base,
    color: Colors.text,
  },
  eyeButton: {
    paddingHorizontal: Layout.md,
    paddingVertical: 14,
  },
  eyeText: {
    color: Colors.gold,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  signupButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: Layout.buttonHeight,
  },
  signupButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  bottomLinks: {
    marginTop: Layout.lg,
    alignItems: 'center',
  },
  signinRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mutedText: {
    color: Colors.text2,
    fontSize: Typography.base,
  },
  linkText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(192,57,43,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(192,57,43,0.3)',
    borderRadius: Layout.radiusSm,
    padding: Layout.md,
    marginBottom: Layout.md,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: Typography.sm,
    textAlign: 'center',
  },
  optInRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: Layout.sm,
  marginBottom: Layout.md,
  marginTop: Layout.sm,
},
checkbox: {
  width: 20,
  height: 20,
  borderRadius: 4,
  borderWidth: 2,
  borderColor: Colors.border,
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  marginTop: 2,
},
checkboxChecked: {
  backgroundColor: Colors.gold,
  borderColor: Colors.gold,
},
checkmark: {
  fontSize: 12,
  fontWeight: '700',
  color: Colors.bg,
},
optInText: {
  fontSize: Typography.sm,
  color: Colors.text2,
  flex: 1,
  lineHeight: Typography.sm * 1.5,
},
});