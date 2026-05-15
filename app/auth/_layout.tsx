import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, LogBox, Text, TextInput, View } from 'react-native';

import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Header from '@/components/Header';
import { useColorScheme } from '@/hooks/use-color-scheme';

import React, { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useFcmToken } from '../hooks/useFcmToken';
import { configureRevenueCat, identifyRevenueCatUser, resetRevenueCatUser } from '../lib/revenuecat';

const globalFontStyle = { fontFamily: 'Inter' as const };

if (!(global as any).__fontSet) {
  (Text as any).defaultProps = (Text as any).defaultProps ?? {};
  (Text as any).defaultProps.style = [globalFontStyle, (Text as any).defaultProps.style];

  (TextInput as any).defaultProps = (TextInput as any).defaultProps ?? {};
  (TextInput as any).defaultProps.style = [globalFontStyle, (TextInput as any).defaultProps.style];

  (global as any).__fontSet = true;
}

if (process.env.NODE_ENV === 'development') {
  LogBox.ignoreLogs([
    'SafeAreaView has been deprecated',
    'react-native-safe-area-context',
    "Can't perform a React state update on a component that hasn't mounted yet",
    '[RevenueCat]',
    '[RC]',
  ]);

  // Suppress known react-navigation animated header warning in terminal
  const origConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes("Can't perform a React state update on a component that hasn't mounted yet")) {
      return;
    }
    origConsoleError(...args);
  };

  const origConsoleWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('SafeAreaView has been deprecated')) {
      return;
    }
    origConsoleWarn(...args);
  };
}

const HIDE_HEADER_ROUTES = [
  '/login',
  '/signInOrSignUp',
  '/signup',
  '/zipCodeverify',
  '/verify-email',
  '/forgot-password',
  '/account-restricted',
  '/publiclanding',
  '/termsOfUse',
  '/privacy-policy',
  '/contact-public',
  '/auth-action',
];

const PUBLIC_ROUTES = [
  '/publiclanding',
  '/login',
  '/signInOrSignUp',
  '/signup',
  '/zipCodeverify',
  '/verify-email',
  '/forgot-password',
  '/account-restricted',
  '/termsOfUse',
  '/privacy-policy',
  '/contact-public',
  '/auth-action',
];

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const user = auth?.user;
  useFcmToken(user?.uid);

  const hideHeader = React.useMemo(() => {
    const path = pathname || "";
    return (
      HIDE_HEADER_ROUTES.some((r) => path.includes(r)) ||
      (path === '/' && !user)
    );
  }, [pathname, user]);

  useEffect(() => {
    console.log('[RootLayout] mounted');
    configureRevenueCat();
    return () => console.log('[RootLayout] unmounted');
  }, []);

  useEffect(() => {
    if (user?.uid) {
      identifyRevenueCatUser(user.uid);
    } else if (!auth.loading) {
      resetRevenueCatUser();
    }
  }, [user?.uid, auth.loading]);

  // Redirect unauthenticated users away from members-only routes
  useEffect(() => {
    if (auth.loading) return;
    if (!user) {
      const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r)) || pathname === '/';
      if (!isPublic) {
        router.replace('/publiclanding' as any);
      }
    }
  }, [user, auth.loading, pathname]);

  // Redirect banned/disabled users to account-restricted on sign-in
  useEffect(() => {
    if (auth.loading || !user) return;
    import('firebase/firestore').then(({ getFirestore, doc, getDoc }) => {
      import('../firebase').then(({ app: firebaseApp }) => {
        const db = getFirestore(firebaseApp);
        getDoc(doc(db, 'users', user.uid)).then((snap) => {
          const data = snap.data();
          if (data?.isBanned === true || data?.isDisabled === true) {
            router.replace('/account-restricted' as any);
          }
        }).catch(() => {});
      });
    });
  }, [user?.uid, auth.loading]);

  // Show a loading spinner while auth is initializing
  if (auth.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#121212' : '#ffffff' }}>
        <ActivityIndicator size="large" color="#475569" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {!hideHeader && <Header />}

        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(app)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
          <Stack.Screen name="signInOrSignUp" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="zipCodeverify" options={{ gestureEnabled: false, animation: 'none' }} />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="account-restricted" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="termsOfUse" />
          <Stack.Screen name="contact-public" />
          <Stack.Screen name="auth-action" />
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
