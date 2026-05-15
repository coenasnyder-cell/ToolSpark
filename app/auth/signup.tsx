import { AntDesign } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    sendEmailVerification,
    signInWithCredential,
} from 'firebase/auth';
import { doc, getDoc, getDocFromServer, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import KeyboardAwareFormScreen from '../components/site-tools/KeyboardAwareFormScreen';
import PasswordTextInputRow from '../components/site-tools/PasswordTextInputRow';
import { app, auth } from '../firebase';
import { profileNeedsServiceArea } from '../hooks/useAccountStatus';
import { getAuthErrorMessage } from '../utils/auth-helpers';
import {
    configureNativeGoogleSignIn,
    getNativeGoogleIdToken,
    getNativeGoogleSignInErrorMessage,
} from '../utils/nativeGoogleAuth';

export const unstable_settings = {
  headerShown: false,
};

export const screenOptions = {
  headerShown: false,
};

function normalizeReturnPath(returnTo: string | undefined): string {
  if (!returnTo || !returnTo.startsWith('/')) {
    return '/(tabs)';
  }

  const cleaned = returnTo.replace(/^\/\(app\)(?=\/|$)/, '') || '/';

  if (cleaned === '/(tabs)' || cleaned === '/(tabs)/' || cleaned === '/(tabs)/index') {
    return '/(tabs)';
  }

  if (cleaned === '/_sitemap' || cleaned === '/+not-found' || cleaned.includes('+not-found')) {
    return '/(tabs)';
  }

  return cleaned;
}

const ACTION_URL = 'https://locallist.biz/auth-action';

export default function SignUpScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams();
  const returnTo = Array.isArray(returnToParam) ? returnToParam[0] : returnToParam;
  const [error, setError] = useState('');
  const [googleBusy, setGoogleBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const isNative = Platform.OS !== 'web';

  const routeAfterAuth = () => {
    if (typeof returnTo === 'string' && returnTo.startsWith('/')) {
      router.replace(normalizeReturnPath(returnTo) as any);
      return;
    }

    router.replace('/(tabs)' as any);
  };

  useEffect(() => {
    if (isNative) {
      configureNativeGoogleSignIn();
    }
  }, [isNative]);

  const handleGoogleButtonPress = async () => {
    if (!isNative || googleBusy || submitting) {
      return;
    }

    setError('');
    setGoogleBusy(true);

    try {
      const idToken = await getNativeGoogleIdToken();

      const credential = GoogleAuthProvider.credential(idToken);
      const { user } = await signInWithCredential(auth, credential);

      const db = getFirestore(app);
      const userRef = doc(db, 'users', user.uid);
      let snap;
      try {
        snap = await getDocFromServer(userRef);
      } catch {
        snap = await getDoc(userRef);
      }
      const profileData = snap.exists() ? (snap.data() as Record<string, unknown>) : null;
      const fallbackName = String(user.displayName || user.email?.split('@')[0] || 'User').trim();
      const needsSetup = !snap.exists() || profileNeedsServiceArea(profileData as any);

      if (needsSetup) {
        await setDoc(
          userRef,
          {
            email: user.email || '',
            accountType: 'personal',
            ...(fallbackName ? { name: fallbackName, displayName: fallbackName } : {}),
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            publicProfileEnabled: false,
          },
          { merge: true }
        );
        router.replace({
          pathname: '/zipCodeverify' as any,
          params: typeof returnTo === 'string' && returnTo.startsWith('/') ? { returnTo } : undefined,
        });
        return;
      }

      await setDoc(
        userRef,
        {
          email: user.email || '',
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      routeAfterAuth();
    } catch (googleError) {
      console.error('Google sign-up error:', googleError);
      const message = getNativeGoogleSignInErrorMessage(googleError);
      if (message && isMountedRef.current) {
        setError(message);
      }
    } finally {
      if (isMountedRef.current) {
        setGoogleBusy(false);
      }
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await sendEmailVerification(currentUser, { url: ACTION_URL });
        } catch {
          await sendEmailVerification(currentUser);
        }
        Alert.alert('Success', 'Verification email sent! Check your inbox.');
      } else {
        Alert.alert('Error', 'No signed-in user found. Please try logging in first.');
      }
    } catch {
      Alert.alert('Error', 'Failed to send verification email. Please wait a moment and try again.');
    } finally {
      setResending(false);
    }
  };

  const handleEmailSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    setError('');

    if (!normalizedEmail) {
      setError('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      const { user } = userCredential;
      const db = getFirestore(app);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          email: user.email || normalizedEmail,
          accountType: 'personal',
          authProvider: 'password',
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          publicProfileEnabled: false,
        },
        { merge: true }
      );

      try {
        await sendEmailVerification(user, { url: ACTION_URL });
      } catch (verificationError) {
        console.warn('Verification email with action URL failed after signup, retrying default template:', verificationError);
        try {
          await sendEmailVerification(user);
        } catch (fallbackError) {
          console.warn('Verification email fallback also failed after signup:', fallbackError);
          Alert.alert(
            'Verify Email',
            'Your account was created, but we could not send a verification email right now. Please use "Resend Verification Email" below.'
          );
          setShowResend(true);
        }
      }

      router.replace({
        pathname: '/zipCodeverify' as any,
        params: typeof returnTo === 'string' && returnTo.startsWith('/') ? { returnTo } : undefined,
      });
    } catch (signupError) {
      if (isMountedRef.current) {
        setError(getAuthErrorMessage(signupError, 'signup'));
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <KeyboardAwareFormScreen
      style={styles.flex}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
              <Text style={styles.title}>Create account</Text>
              <Text style={styles.subtitle}>Harrison&apos;s local marketplace</Text>
              <Text style={styles.lead}>
                Sign up with Google or create an email account for Local List.
              </Text>

              {isNative ? (
                <TouchableOpacity
                  style={[styles.googleButton, (googleBusy || submitting) && styles.googleButtonDisabled]}
                  onPress={handleGoogleButtonPress}
                  disabled={googleBusy || submitting}
                  activeOpacity={0.88}
                >
                  <View style={styles.googleButtonContent}>
                    <View style={styles.googleIconBadge}>
                      <AntDesign name="google" size={18} color="#4285F4" />
                    </View>
                    <Text style={styles.googleButtonText}>
                      {googleBusy ? 'Signing in...' : 'Continue with Google'}
                    </Text>
                    {googleBusy ? <ActivityIndicator size="small" color="#64748b" /> : null}
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.webNotice}>
                  <Text style={styles.webNoticeText}>
                    Google sign-up runs in the Local List Android or iOS app. You can still create an email account below.
                  </Text>
                </View>
              )}

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="Email"
                editable={!submitting && !googleBusy}
              />

              <Text style={styles.label}>Password</Text>
              <PasswordTextInputRow
                value={password}
                onChangeText={setPassword}
                placeholder="Create password"
                editable={!submitting && !googleBusy}
                textContentType="newPassword"
                containerStyle={styles.passwordRow}
                style={styles.passwordInput}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <PasswordTextInputRow
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm password"
                editable={!submitting && !googleBusy}
                textContentType="newPassword"
                containerStyle={styles.passwordRow}
                style={styles.passwordInput}
              />

              <View style={styles.disclaimerBox}>
                <Text style={styles.disclaimerTitle}>Next step after signup</Text>
                <Text style={styles.disclaimerText}>
                  After you create your account, you&apos;ll finish setup on the next screen by adding your name, ZIP code, and accepting the Terms and Privacy Policy.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, (submitting || googleBusy) && styles.googleButtonDisabled]}
                onPress={handleEmailSignup}
                disabled={submitting || googleBusy}
                activeOpacity={0.88}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
              </TouchableOpacity>
                            <View style={styles.bottomLinks}>
                <TouchableOpacity
                  style={styles.inlineLinkRow}
                  onPress={() =>
                    router.push({
                      pathname: '/login' as any,
                      params: typeof returnTo === 'string' && returnTo.startsWith('/') ? { returnTo } : undefined,
                    })} >               
                  <Text style={styles.bottomText}>Already have an account? </Text>
                  <Text style={styles.bottomLink}>Sign in</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.verificationText}>
                You will receive a verification email after signup. Please verify your email to access all features. Please email us at{' '}
                <Text style={{ color: '#475569', fontWeight: '600', textDecorationLine: 'underline' }} onPress={() => router.push('/contact-public')}>support@locallist.biz</Text>
                {' '}if you have issues during sign up.
              </Text>

              {showResend ? (
                <TouchableOpacity onPress={handleResendVerification} disabled={resending} style={styles.resendRow}>
                  <Text style={styles.resendLink}>{resending ? 'Sending...' : 'Resend Verification Email'}</Text>
                </TouchableOpacity>
              ) : null}       
      </View>
    </KeyboardAwareFormScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    flexGrow: 1,
    justifyContent: 'flex-start',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    color: '#475569',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
    color: '#64748b',
  },
  lead: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#334155',
    marginBottom: 22,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  googleButtonDisabled: {
    opacity: 0.6,
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 24,
  },
  googleIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  webNotice: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  webNoticeText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#94a3b8',
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#f5c6cb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
    textAlign: 'center',
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
    marginBottom: 12,
  },
  passwordRow: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  passwordInput: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  disclaimerBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbeafe',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  disclaimerTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6,
  },
  disclaimerText: {
    color: '#475569',
    fontSize: 13,
    lineHeight: 20,
  },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: '#475569',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    minHeight: 50,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 15,
  },
  locationHint: {
    color: '#0369a1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
  },
  pendingBox: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  pendingText: {
    color: '#92400e',
    fontSize: 13,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#475569',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  verificationText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 12,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendLink: {
    color: '#4f46e5',
    fontSize: 13,
    fontWeight: '600',
  },
  bottomLinks: {
    marginTop: 20,
    alignItems: 'center',
  },
  inlineLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  bottomText: {
    color: '#64748b',
    fontSize: 14,
  },
  bottomLink: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
