import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  collection,
  getDocs,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';
import Header from '../../components/Shared/Header';
import { useUnreadCount } from '../../hooks/useUnreadCount';

interface Tool {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  affiliateUrl: string;
  isFeatured: boolean;
  order: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  'AI': Colors.purple,
  'No-code': Colors.green,
  'Marketing': Colors.coral,
  'Community': Colors.gold,
  'Payments': Colors.greenLight,
  'Design': '#E91E8C',
};

export default function ToolsScreen() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const unreadCount = useUnreadCount();

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    try {
      const snap = await getDocs(collection(db, 'tools'));
      const data = snap.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Tool, 'id'>),
      }));
      data.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
      setTools(data);
    } catch (err) {
      console.log('Load tools error:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', ...Array.from(
    new Set(tools.map(t => t.category).filter(Boolean))
  )];

  const filteredTools = selectedCategory === 'All'
    ? tools
    : tools.filter(t => t.category === selectedCategory);

  const featuredTools = filteredTools.filter(t => t.isFeatured);
  const regularTools = filteredTools.filter(t => !t.isFeatured);

  const getCategoryColor = (category: string) =>
    CATEGORY_COLORS[category] || Colors.gold;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header subtitle="Resources & Tools" notificationCount={unreadCount} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Resources & Tools
          </Text>
          <Text style={styles.sectionSubtitle}>
            Tools we use and recommend for building AI-powered
            products
          </Text>
        </View>

        {/* Category filter */}
        {categories.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryTab,
                  selectedCategory === cat &&
                    styles.categoryTabActive,
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.categoryTabText,
                  selectedCategory === cat &&
                    styles.categoryTabTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Empty state */}
        {filteredTools.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛠️</Text>
            <Text style={styles.emptyTitle}>
              No tools yet
            </Text>
            <Text style={styles.emptySubtitle}>
              Resources and affiliate tools are coming soon
            </Text>
          </View>
        )}

        {/* Featured tools */}
        {featuredTools.length > 0 && (
          <>
            <Text style={styles.groupLabel}>
              ⭐ Featured
            </Text>
            {featuredTools.map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={[styles.toolCard, styles.featuredCard]}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/tool-detail',
                  params: { toolId: tool.id }
                } as any)}
              >
                <View style={styles.toolCardTop}>
                  <View style={[
                    styles.categoryBadge,
                    {
                      backgroundColor:
                        getCategoryColor(tool.category) + '20',
                      borderColor:
                        getCategoryColor(tool.category),
                    }
                  ]}>
                    <Text style={[
                      styles.categoryBadgeText,
                      { color: getCategoryColor(tool.category) }
                    ]}>
                      {tool.category}
                    </Text>
                  </View>
                  <View style={styles.affiliateBadge}>
                    <Text style={styles.affiliateBadgeText}>
                      Affiliate
                    </Text>
                  </View>
                </View>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc} numberOfLines={2}>
                  {tool.description}
                </Text>
                <Text style={styles.toolAction}>
                  Learn more →
                </Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Regular tools */}
        {regularTools.length > 0 && (
          <>
            {featuredTools.length > 0 && (
              <Text style={styles.groupLabel}>All Tools</Text>
            )}
            {regularTools.map(tool => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                activeOpacity={0.8}
                onPress={() => router.push({
                  pathname: '/tool-detail',
                  params: { toolId: tool.id }
                } as any)}
              >
                <View style={styles.toolCardTop}>
                  <View style={[
                    styles.categoryBadge,
                    {
                      backgroundColor:
                        getCategoryColor(tool.category) + '20',
                      borderColor:
                        getCategoryColor(tool.category),
                    }
                  ]}>
                    <Text style={[
                      styles.categoryBadgeText,
                      { color: getCategoryColor(tool.category) }
                    ]}>
                      {tool.category}
                    </Text>
                  </View>
                  {tool.affiliateUrl && (
                    <View style={styles.affiliateBadge}>
                      <Text style={styles.affiliateBadgeText}>
                        Affiliate
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.toolName}>{tool.name}</Text>
                <Text style={styles.toolDesc} numberOfLines={2}>
                  {tool.description}
                </Text>
                <Text style={styles.toolAction}>
                  Learn more →
                </Text>
              </TouchableOpacity>
            ))}
          </>
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
  content: {
    padding: Layout.md,
    paddingBottom: Layout.tabBarHeight + Layout.xl,
  },
  sectionHeader: {
    marginBottom: Layout.md,
    paddingTop: Layout.sm,
  },
  sectionTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
  },
  categoryList: {
    gap: Layout.sm,
    paddingBottom: Layout.md,
  },
  categoryTab: {
    paddingHorizontal: Layout.md,
    paddingVertical: Layout.sm,
    borderRadius: Layout.radiusFull,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: Layout.minTouchTarget,
    justifyContent: 'center',
  },
  categoryTabActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryTabText: {
    fontSize: Typography.sm,
    color: Colors.text2,
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: Colors.bg,
    fontWeight: '700',
  },
  groupLabel: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Layout.sm,
    marginTop: Layout.sm,
  },
  toolCard: {
    backgroundColor: Colors.surface,
    borderRadius: Layout.radiusLg,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featuredCard: {
    borderColor: Colors.gold,
    backgroundColor: Colors.surface,
  },
  toolCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Layout.sm,
  },
  categoryBadge: {
    borderWidth: 1,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  affiliateBadge: {
    backgroundColor: Colors.surface2,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  affiliateBadgeText: {
    fontSize: 10,
    color: Colors.text3,
    fontWeight: '600',
  },
  toolName: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  toolDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.6,
    marginBottom: Layout.md,
  },
  toolAction: {
    fontSize: Typography.sm,
    fontWeight: '700',
    color: Colors.gold,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Layout.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Layout.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Layout.sm,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
    textAlign: 'center',
  },
});