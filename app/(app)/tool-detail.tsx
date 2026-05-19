import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { db } from '../../services/firebase';
import VideoPlayer from '../../components/Shared/VideoPlayer';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import RenderHtml from 'react-native-render-html';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  articleContent: string;
  affiliateUrl: string;
  isFeatured: boolean;
}

export default function ToolDetailScreen() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { toolId } = useLocalSearchParams<{ toolId: string }>();
  const [tool, setTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTool();
  }, [toolId]);

  const loadTool = async () => {
    if (!toolId) return;
    try {
      const toolRef = doc(db, 'tools', toolId);
      const snap = await getDoc(toolRef);
      if (snap.exists()) {
        setTool({ id: snap.id, ...snap.data() } as Tool);
      }
    } catch (err) {
      console.log('Load tool error:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!tool) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Tool not found</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {tool.name}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Video */}
        <VideoPlayer url={tool.videoUrl} />

        {/* Tool info */}
        <View style={styles.toolInfo}>
          <Text style={styles.toolName}>{tool.name}</Text>
          <Text style={styles.toolDesc}>{tool.description}</Text>

          {/* Article content */}
          {tool.articleContent && (
            <View style={styles.articleSection}>
              <Text style={styles.articleTitle}>How to use it</Text>
              <RenderHtml
                contentWidth={width - (Layout.md * 2)}
                source={{ html: tool.articleContent }}
                tagsStyles={{
                  body: { color: Colors.text, fontSize: Typography.base, lineHeight: Typography.base * 1.7 },
                  p: { marginBottom: Layout.md, color: Colors.text },
                  h1: { fontSize: Typography.xl, fontWeight: '700', color: Colors.text, marginBottom: Layout.md },
                  h2: { fontSize: Typography.lg, fontWeight: '700', color: Colors.text, marginBottom: Layout.sm },
                  h3: { fontSize: Typography.md, fontWeight: '700', color: Colors.text, marginBottom: Layout.sm },
                  strong: { fontWeight: '700', color: Colors.text },
                  em: { fontStyle: 'italic', color: Colors.text },
                  a: { color: Colors.gold, textDecorationLine: 'underline' },
                  ul: { marginBottom: Layout.md },
                  ol: { marginBottom: Layout.md },
                  li: { color: Colors.text, marginBottom: Layout.sm, fontSize: Typography.base },
                  blockquote: { borderLeftWidth: 3, borderLeftColor: Colors.gold, paddingLeft: Layout.md, marginLeft: 0, color: Colors.text2 },
                }}
              />
            </View>
          )}
        </View>

        {/* CTA */}
        {tool.affiliateUrl && (
          <View style={styles.ctaSection}>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => Linking.openURL(tool.affiliateUrl)}
            >
              <Text style={styles.ctaButtonText}>
                Visit {tool.name} →
              </Text>
            </TouchableOpacity>
            <Text style={styles.affiliateNote}>
              * Affiliate link — we may earn a commission
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.text2,
    fontSize: Typography.base,
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
    paddingRight: Layout.sm,
  },
  backText: {
    color: Colors.gold,
    fontSize: Typography.base,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#F5F3EF',
    textAlign: 'center',
    marginHorizontal: Layout.sm,
  },
  headerRight: {
    width: 60,
  },
  content: {
    paddingBottom: Layout.xl,
  },
  toolInfo: {
    padding: Layout.md,
  },
  toolTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    marginBottom: Layout.md,
  },
  categoryBadge: {
    backgroundColor: Colors.goldDim,
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gold,
  },
  featuredBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredBadgeText: {
    fontSize: 11,
    color: Colors.text2,
    fontWeight: '600',
  },
  toolName: {
    fontSize: Typography.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  toolDesc: {
    fontSize: Typography.base,
    color: Colors.text2,
    lineHeight: Typography.base * 1.7,
    marginBottom: Layout.lg,
  },
  articleSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.md,
  },
  articleTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.md,
  },
  articleContent: {
    fontSize: Typography.base,
    color: Colors.text,
    lineHeight: Typography.base * 1.7,
  },
  ctaSection: {
    padding: Layout.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ctaButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: Layout.buttonHeight,
    justifyContent: 'center',
    marginBottom: Layout.sm,
  },
  ctaButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.md,
  },
  affiliateNote: {
    fontSize: Typography.xs,
    color: Colors.text3,
    textAlign: 'center',
  },
});