import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { SkeletonListCard } from '@/components/SkeletonCard';
import { EmptyState } from '@/components/EmptyState';

interface Question {
  id: string;
  title: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  profiles?: { full_name?: string; username?: string };
}

interface QuestionListProps {
  questions: Question[];
  isLoading: boolean;
  isRefetching: boolean;
  onRefresh: () => void;
}

const QuestionCard = React.memo(function QuestionCard({
  item,
  styles,
  themeColors,
}: {
  item: Question;
  styles: any;
  themeColors: any;
}) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/(app)/soz-sende/${item.id}`)}
    >
      <View style={styles.cardGlow} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, !item.is_active && styles.badgeInactive]}>
            <View
              style={[
                styles.badgeDot,
                { backgroundColor: item.is_active ? themeColors.primary : themeColors.textMuted },
              ]}
            />
            <Text style={[styles.badgeText, !item.is_active && { color: themeColors.textMuted }]}>
              {item.is_active ? 'AKTİF TARTIŞMA' : 'KAPANDI'}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {item.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.authorGroup}>
            <View style={styles.authorAvatar}>
              <Text style={styles.authorAvatarText}>
                {(item.profiles?.username || item.profiles?.full_name || 'K')
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>
            <Text style={styles.authorName}>
              {item.profiles?.username
                ? `@${item.profiles.username}`
                : item.profiles?.full_name || 'Kullanıcı'}
            </Text>
          </View>
          <View style={styles.commentInfo}>
            <Ionicons name="chatbubbles" size={16} color={themeColors.primary} />
            <Text style={styles.commentCount}>Tartışmaya Katıl</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

/**
 * Soru listesi — yüklenirken shimmer skeleton gösterir.
 * Asıl kart render'ı veriler gelince başlar.
 */
const QuestionList = React.memo(function QuestionList({
  questions,
  isLoading,
  isRefetching,
  onRefresh,
}: QuestionListProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  // Stabil referans — inline fonksiyon olursa FlatList her render'da tüm kartları yeniden render eder
  const renderItem = React.useCallback(
    ({ item }: { item: Question }) => (
      <QuestionCard item={item} styles={styles} themeColors={themeColors} />
    ),
    [styles, themeColors]
  );

  const keyExtractor = React.useCallback((item: Question) => item.id, []);

  const emptyComponent = React.useMemo(
    () => (
      <EmptyState
        icon="chatbubbles-outline"
        title="Henüz bir soru eklenmedi."
        subtitle="Takipte kal, yakında yeni sorular gelecek!"
      />
    ),
    []
  );

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        {[1, 2, 3].map((i) => (
          <SkeletonListCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={questions}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={onRefresh}
          tintColor={themeColors.primary}
        />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      // Batch ayarları — ilk render'da tüm listeyi çizmeyi engeller
      initialNumToRender={5}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews
      ListEmptyComponent={emptyComponent}
    />
  );
});

export default QuestionList;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    skeletonContainer: {
      padding: Spacing.lg,
    },
    listContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
    card: {
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.xl,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
      overflow: 'hidden',
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.05,
      shadowRadius: 15,
      elevation: 4,
    },
    cardGlow: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: themeColors.primary + '08',
    },
    cardContent: { padding: Spacing.lg },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: themeColors.primary + '10',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    badgeInactive: { backgroundColor: themeColors.surfaceLight },
    badgeDot: { width: 6, height: 6, borderRadius: 3 },
    badgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: themeColors.primary,
      letterSpacing: 0.5,
    },
    dateText: { fontSize: 11, color: themeColors.textMuted, fontWeight: '600' },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.textPrimary,
      marginBottom: Spacing.xs,
      lineHeight: 28,
    },
    description: {
      fontSize: 14,
      color: themeColors.textSecondary,
      marginBottom: Spacing.lg,
      lineHeight: 20,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border + '50',
    },
    authorGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    authorAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: themeColors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorAvatarText: { fontSize: 12, fontWeight: 'bold', color: themeColors.primary },
    authorName: { fontSize: 13, fontWeight: '700', color: themeColors.textSecondary },
    commentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    commentCount: { fontSize: 12, fontWeight: '800', color: themeColors.primary },
  });
