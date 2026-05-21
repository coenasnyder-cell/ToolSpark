import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Layout } from '../../constants/layout';

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

export default function AdminToolsScreen() {
  const router = useRouter();
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'tools'),
      orderBy('order', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Tool[];
      setTools(data);
      setLoading(false);
    }, () => setLoading(false));

    return unsubscribe;
  }, []);

  const handleDelete = (tool: Tool) => {
    Alert.alert(
      'Delete Tool',
      `Are you sure you want to delete "${tool.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteDoc(doc(db, 'tools', tool.id));
          },
        },
      ]
    );
  };

  const renderTool = ({ item }: { item: Tool }) => (
    <View style={styles.toolCard}>
      <View style={styles.toolCardLeft}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.toolImage}
          />
        ) : (
          <View style={styles.toolImageFallback}>
            <Ionicons
              name="construct-outline"
              size={24}
              color={Colors.text3}
            />
          </View>
        )}
      </View>

      <View style={styles.toolInfo}>
        <View style={styles.toolNameRow}>
          <Text style={styles.toolName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>
                Featured
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.toolCategory}>{item.category}</Text>
        <Text style={styles.toolDesc} numberOfLines={2}>
          {item.description}
        </Text>
      </View>

      <View style={styles.toolActions}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => router.push({
            pathname: '/admin-tools-edit',
            params: { toolId: item.id }
          } as any)}
        >
          <Ionicons
            name="pencil-outline"
            size={18}
            color={Colors.gold}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item)}
        >
          <Ionicons
            name="trash-outline"
            size={18}
            color={Colors.error}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.gold} size="large" />
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
        <Text style={styles.headerTitle}>Manage Tools</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin-tools-edit' as any)}
        >
          <Ionicons name="add" size={24} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={tools}
        keyExtractor={(item) => item.id}
        renderItem={renderTool}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="construct-outline"
              size={48}
              color={Colors.text3}
            />
            <Text style={styles.emptyTitle}>No tools yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap + to add your first tool
            </Text>
            <TouchableOpacity
              style={styles.addFirstButton}
              onPress={() => router.push('/admin-tools-edit' as any)}
            >
              <Text style={styles.addFirstButtonText}>
                Add Tool
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
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
  addButton: {
    width: Layout.minTouchTarget,
    height: Layout.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Layout.md,
    paddingBottom: Layout.xl,
  },
  toolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Layout.radius,
    padding: Layout.md,
    marginBottom: Layout.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Layout.md,
  },
  toolCardLeft: {
    flexShrink: 0,
  },
  toolImage: {
    width: 56,
    height: 56,
    borderRadius: Layout.radiusSm,
  },
  toolImageFallback: {
    width: 56,
    height: 56,
    borderRadius: Layout.radiusSm,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolInfo: {
    flex: 1,
  },
  toolNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.sm,
    marginBottom: 2,
  },
  toolName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  featuredBadge: {
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusFull,
    paddingHorizontal: Layout.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  featuredBadgeText: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: '700',
  },
  toolCategory: {
    fontSize: Typography.xs,
    color: Colors.text3,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toolDesc: {
    fontSize: Typography.sm,
    color: Colors.text2,
    lineHeight: Typography.sm * 1.5,
  },
  toolActions: {
    gap: Layout.sm,
    flexShrink: 0,
  },
  editButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.goldDim,
    borderRadius: Layout.radiusSm,
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(192,57,43,0.1)',
    borderRadius: Layout.radiusSm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Layout.xxl,
    gap: Layout.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.base,
    color: Colors.text2,
  },
  addFirstButton: {
    backgroundColor: Colors.gold,
    borderRadius: Layout.radiusSm,
    paddingHorizontal: Layout.xl,
    paddingVertical: Layout.md,
    marginTop: Layout.sm,
  },
  addFirstButtonText: {
    color: Colors.bg,
    fontWeight: '700',
    fontSize: Typography.base,
  },
});