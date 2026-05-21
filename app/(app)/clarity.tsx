import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import { useEffect } from 'react';

export default function ClarityScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return unsubscribe;
  }, []);

  // Pre-fill name and email as URL params so user doesn't have to type them
  const clarityURL = user
    ? `https://toolspark.co/clarity?name=${encodeURIComponent(
        user.displayName?.split(' ')[0] || ''
      )}&email=${encodeURIComponent(user.email || '')}`
    : 'https://toolspark.co/clarity';

  // Detect when they reach the results page — session is complete
  const handleNavigationChange = (navState: any) => {
    if (navState.url.includes('results.html') || 
        navState.url.includes('results?session')) {
      // They completed the clarity session
      // Dashboard will auto-detect on next load via email query
      // Optionally go back after a delay
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clarity Session</Text>
        <View style={styles.headerRight} />
      </View>

      {/* WebView */}
      <WebView
        ref={webViewRef}
        source={{ uri: clarityURL }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={handleNavigationChange}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={Colors.gold} size="large" />
          </View>
        )}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.gold} size="large" />
        </View>
      )}
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
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 0,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
    paddingRight: Layout.md,
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.gold,
  },
  headerRight: {
    width: 60,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
});