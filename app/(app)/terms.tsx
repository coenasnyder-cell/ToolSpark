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

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Terms of Use</Text>
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
          By using ToolSpark you agree to these Terms of Use.
          Please read them carefully before using our platform.
        </Text>

        <Text style={styles.sectionTitle}>
          Acceptance of Terms
        </Text>
        <Text style={styles.body}>
          By accessing or using ToolSpark you agree to be
          bound by these Terms of Use. If you do not agree
          to these terms please do not use our platform.
        </Text>

        <Text style={styles.sectionTitle}>
          Use of the Platform
        </Text>
        <Text style={styles.body}>
          ToolSpark is a community platform for coaches and
          creators building AI-powered tools. You agree to
          use the platform only for lawful purposes and in
          a way that does not infringe on the rights of others.
        </Text>

        <Text style={styles.sectionTitle}>
          Community Guidelines
        </Text>
        <Text style={styles.body}>
          When participating in the ToolSpark community
          you agree to:{'\n\n'}
          • Be respectful to other members{'\n'}
          • Not post spam, harassment, or harmful content{'\n'}
          • Not share others' private information{'\n'}
          • Not promote illegal activities{'\n'}
          • Not post content that violates intellectual
          property rights{'\n\n'}
          Violation of these guidelines may result in
          suspension or termination of your account.
        </Text>

        <Text style={styles.sectionTitle}>
          Account Responsibility
        </Text>
        <Text style={styles.body}>
          You are responsible for maintaining the security
          of your account and all activity that occurs under
          your account. You must notify us immediately of
          any unauthorized use of your account.
        </Text>

        <Text style={styles.sectionTitle}>
          Content Ownership
        </Text>
        <Text style={styles.body}>
          You retain ownership of content you post on
          ToolSpark. By posting content you grant ToolSpark
          a non-exclusive license to display and distribute
          your content within the platform.
        </Text>

        <Text style={styles.sectionTitle}>
          Payments and Refunds
        </Text>
        <Text style={styles.body}>
          Paid memberships and courses are billed as described
          at the time of purchase. Refunds are handled on a
          case-by-case basis. Please contact support@toolspark.co
          for refund requests within 7 days of purchase.
        </Text>

        <Text style={styles.sectionTitle}>
          Affiliate Disclaimer
        </Text>
        <Text style={styles.body}>
          ToolSpark participates in affiliate programs. We may
          earn commissions from tools and services we recommend.
          This does not affect the price you pay or our honest
          assessment of the products.
        </Text>

        <Text style={styles.sectionTitle}>
          Intellectual Property
        </Text>
        <Text style={styles.body}>
          The ToolSpark name, logo, course content, and platform
          design are owned by ToolSpark. You may not reproduce
          or distribute our content without written permission.
        </Text>

        <Text style={styles.sectionTitle}>
          Disclaimer of Warranties
        </Text>
        <Text style={styles.body}>
          ToolSpark is provided "as is" without warranties of
          any kind. We do not guarantee that the platform will
          be error-free or uninterrupted.
        </Text>

        <Text style={styles.sectionTitle}>
          Limitation of Liability
        </Text>
        <Text style={styles.body}>
          ToolSpark shall not be liable for any indirect,
          incidental, or consequential damages arising from
          your use of the platform.
        </Text>

        <Text style={styles.sectionTitle}>
          Termination
        </Text>
        <Text style={styles.body}>
          We reserve the right to suspend or terminate your
          account at our discretion if you violate these terms
          or engage in harmful behavior toward other members.
        </Text>

        <Text style={styles.sectionTitle}>
          Changes to Terms
        </Text>
        <Text style={styles.body}>
          We may update these Terms of Use at any time.
          Continued use of ToolSpark after changes constitutes
          acceptance of the new terms.
        </Text>

        <Text style={styles.sectionTitle}>Contact Us</Text>
        <Text style={styles.body}>
          For questions about these Terms of Use contact us at:{'\n\n'}
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