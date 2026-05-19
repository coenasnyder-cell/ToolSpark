import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
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
let GoogleSignin: any = null;
let statusCodes: any = null;
try {
  const pkg = require('@react-native-google-signin/google-signin');
  GoogleSignin = pkg.GoogleSignin;
  statusCodes = pkg.statusCodes;
} catch {
  // native module not available in Expo Go
}
import { AntDesign } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams();
  const returnTo = Array.isArray(returnToParam) 
    ? returnToParam[0] 
    : returnToParam;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const canUseNativeGoogle = Platform.OS !== 'web';
  const isMountedRef = useRef(true);

 useEffect(() => {
  try {
    GoogleSignin.configure({
      iosClientId: '82966513396-80ak77ileqnvd3i5objrdu58eo4nc8ii.apps.googleusercontent.com',
      webClientId: '82966513396-e9ct0rji0pc0k43s0j1o9399pej3sqh8.apps.googleusercontent.com',
    });
  } catch (err) {
    console.log('Google sign in not available in Expo Go');
  }
}, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  

  function routeAfterAuth() {
    if (typeof returnTo === 'string' && returnTo.startsWith('/')) {
      router.replace(returnTo as any);
      return;
    }
    router.replace('/(tabs)' as any);
  }

  const handleAuthSuccess = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    const profileSnapshot = await getDoc(userRef);
    const profileData = profileSnapshot.exists() 
      ? profileSnapshot.data() 
      : null;

    if (profileData?.isBanned === true || 
        profileData?.isDisabled === true) {
      await auth.signOut();
      router.replace('/account-restricted' as any);
      return;
    }

    const fallbackEmail = user.email || email.trim().toLowerCase();
    const fallbackName = String(
      user.displayName || 
      fallbackEmail.split('@')[0] || 
      'Member'
    ).trim();

    if (!profileSnapshot.exists()) {
      await setDoc(userRef, {
        userEmail: fallbackEmail,
        displayName: fallbackName,
        photoURL: user.photoURL || '',
        userRole: 'member',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      }, { merge: true });
    } else {
      await setDoc(userRef, {
        lastSeen: serverTimestamp(),
      }, { merge: true });
    }

    routeAfterAuth();
  };

  const handleGoogleLogin = async () => {
    if (!GoogleSignin || !statusCodes) {
      console.log('Google Sign-In is not available in this environment');
      return;
    }
    setGoogleBusy(true);
    try {
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      await handleAuthSuccess(userCredential.user);
    } catch (error: any) {
      if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
        console.log('Google sign in error:', error);
      }
    } finally {
      if (isMountedRef.current) setGoogleBusy(false);
    }
  };

  const handleEmailLogin = async () => {
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

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        normalizedEmail, 
        password
      );
      await handleAuthSuccess(userCredential.user);
    } catch (authError: any) {
      if (isMountedRef.current) {
        setError(
          authError.code === 'auth/invalid-credential' 
            ? 'Invalid email or password. Please try again.'
            : 'Something went wrong. Please try again.'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>
          Tool<Text style={styles.logoSpark}>Spark</Text>
        </Text>
        <Text style={styles.tagline}>Clarity. Build. Launch.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to your ToolSpark account
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="you@example.com"
            placeholderTextColor={Colors.text3}
            editable={!submitting && !googleBusy}
          />
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={Colors.text3}
              secureTextEntry={!showPassword}
              editable={!submitting && !googleBusy}
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

        <TouchableOpacity
          style={[
            styles.loginButton, 
            (submitting || googleBusy) && styles.disabledButton
          ]}
          onPress={handleEmailLogin}
          disabled={submitting || googleBusy}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.bg} size="small" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
         style={styles.googleButton}
         onPress={handleGoogleLogin}
          >
          <AntDesign name="google" size={18} color={Colors.gold} />
          <Text style={styles.googleButtonText}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <View style={styles.bottomLinks}>
         <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password' as any)}
        >
        <Text style={styles.linkText}>Forgot password?</Text>
        </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.mutedText}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(auth)/signup' as any)}
            >
              <Text style={styles.linkText}>Sign up free</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    paddingHorizontal: Layout.md,
    justifyContent: 'center',
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
  loginButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    minHeight: Layout.buttonHeight,
  },
  loginButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Layout.md,
    gap: Layout.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.text3,
    fontWeight: '700',
    fontSize: Typography.xs,
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.sm,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Layout.radiusSm,
    paddingVertical: 14,
    minHeight: Layout.buttonHeight,
  },
  googleButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: Typography.base,
  },
  bottomLinks: {
    marginTop: Layout.lg,
    alignItems: 'center',
    gap: Layout.sm,
  },
  signupRow: {
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
});