import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>
          Last updated: May 2026
        </Text>

        <Text style={styles.intro}>
          ToolSpark ("we", "us", or "our") is committed to
          protecting your privacy. This Privacy Policy explains
          how we collect, use, and protect your information
          when you use the ToolSpark app and website.
        </Text>

        <Text style={styles.sectionTitle}>
          Information We Collect
        </Text>
        <Text style={styles.body}>
          We collect information you provide directly to us
          including your name, email address, profile photo,
          and any content you post in the community. We also
          collect usage data such as which features you use
          and how you interact with the platform.
        </Text>

        <Text style={styles.sectionTitle}>
          How We Use Your Information
        </Text>
        <Text style={styles.body}>
          We use your information to provide and improve our
          services, send you notifications about community
          activity, process payments, and communicate with
          you about your account. We do not sell your personal
          information to third parties.
        </Text>

        <Text style={styles.sectionTitle}>
          Community Content
        </Text>
        <Text style={styles.body}>
          Content you post in the ToolSpark community including
          threads, comments, and profile information is visible
          to other members. Please be mindful of what you share.
        </Text>

        <Text style={styles.sectionTitle}>
          Data Storage
        </Text>
        <Text style={styles.body}>
          Your data is stored securely using Google Firebase
          services. We implement appropriate security measures
          to protect your information against unauthorized
          access, alteration, or disclosure.
        </Text>

        <Text style={styles.sectionTitle}>
          Third Party Services
        </Text>
        <Text style={styles.body}>
          ToolSpark uses the following third party services:{'\n\n'}
          • Google Firebase — authentication and data storage{'\n'}
          • Stripe — payment processing{'\n'}
          • Expo — mobile app delivery{'\n'}
          • Giphy — GIF integration in community posts{'\n\n'}
          Each service has their own privacy policy governing
          their use of your data.
        </Text>

        <Text style={styles.sectionTitle}>
          Affiliate Links
        </Text>
        <Text style={styles.body}>
          The Tools section contains affiliate links. When you
          click these links and make a purchase we may earn a
          commission at no additional cost to you.
        </Text>

        <Text style={styles.sectionTitle}>
          Your Rights
        </Text>
        <Text style={styles.body}>
          You have the right to access, update, or delete your
          personal information at any time through your profile
          settings. You may also request account deletion which
          will remove your data from our systems.
        </Text>

        <Text style={styles.sectionTitle}>
          Children's Privacy
        </Text>
        <Text style={styles.body}>
          ToolSpark is not intended for users under the age of
          18. We do not knowingly collect information from
          children under 18.
        </Text>

        <Text style={styles.sectionTitle}>
          Changes to This Policy
        </Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time.
          We will notify you of significant changes through
          the app or by email.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about this Privacy Policy
          please contact us at:{'\n\n'}
          support@toolspark.co
        </Text>
      </ScrollView>
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
    paddingTop: 56,
    paddingBottom: Layout.md,
    backgroundColor: Colors.sidebar,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: '#F5F3EF',
  },
  headerRight: {
    width: 60,
  },
  content: {
    padding: Layout.md,
    paddingBottom: Layout.xl,
  },
  lastUpdated: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: Layout.lg,
  },
  intro: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.7,
    marginBottom: Layout.lg,
  },
  sectionTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
    marginTop: Layout.md,
  },
  body: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.7,
    marginBottom: Layout.md,
  },
});