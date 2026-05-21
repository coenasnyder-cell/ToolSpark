import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

const STEPS = [
  {
    emoji: '👋',
    title: 'Introduce yourself',
    desc: 'Say hello in the welcome thread',
  },
  {
    emoji: '📚',
    title: 'Complete the welcome course',
    desc: 'Learn how to get the most out of ToolSpark',
  },
  {
    emoji: '🧠',
    title: 'Complete your Clarity Session',
    desc: 'Discover the right tool idea for your business',
  },
  {
    emoji: '🔧',
    title: 'Share your Tool Idea',
    desc: 'Post your idea and get feedback from the community',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('hasSeenWelcome', 'true');
    router.replace('/(tabs)' as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoBlock}>
          <Text style={styles.logo}>
            Tool<Text style={styles.logoSpark}>Spark</Text>
          </Text>
          <Text style={styles.tagline}>CLARITY. BUILD. LAUNCH.</Text>
        </View>

        {/* Hero */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroTitle}>
            Welcome to the community 🎉
          </Text>
          <Text style={styles.heroSubtitle}>
            You're now part of a community of builders creating
            AI tools, automations, and smarter client experiences.
            Here's how to get started:
          </Text>
        </View>

        {/* Steps */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsLabel}>YOUR GETTING STARTED PATH</Text>
          {STEPS.map((step, index) => (
            <View key={index} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.stepConnector} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Note */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            💡 You can track your progress on the Dashboard tab at any time. Take it at your own pace — but completing these steps will unlock everything ToolSpark has to offer.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed CTA */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGetStarted}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaButtonText}>
            Let's Go →
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
  },
  content: {
    padding: Layout.md,
    paddingBottom: 120,
  },
  logoBlock: {
    alignItems: 'center',
    paddingTop: Layout.xxl,
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
    fontSize: Typography.xs,
    color: Colors.text3,
    letterSpacing: 2,
    marginTop: 4,
    fontWeight: '700',
  },
  heroBlock: {
    marginBottom: Layout.xl,
  },
  heroTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
    lineHeight: Typography.xl * 1.3,
  },
  heroSubtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.6,
  },
  stepsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Layout.md,
  },
  stepsLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.text3,
    letterSpacing: 0.8,
    marginBottom: Layout.md,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: Layout.md,
  },
  stepLeft: {
    alignItems: 'center',
    width: 32,
    marginRight: Layout.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.bg,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
    marginBottom: -Layout.md,
  },
  stepContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Layout.sm,
    paddingBottom: Layout.sm,
  },
  stepEmoji: {
    fontSize: 20,
    marginTop: 2,
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.5,
  },
  noteCard: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radius,
    padding: Layout.md,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  noteText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Layout.md,
    paddingBottom: Layout.xl,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.bg,
    letterSpacing: 0.3,
  },
});