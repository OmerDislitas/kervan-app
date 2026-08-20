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
  question_comments?: {
    id: string;
    content: string;
    profiles?: { full_name?: string; username?: string };
    comment_likes?: { user_id: string }[];
  }[];
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

  const topComment = React.useMemo(() => {
    const comments = item.question_comments;
    if (!comments || comments.length === 0) return null;
    return comments.reduce((best, c) =>
      (c.comment_likes?.length || 0) > (best.comment_likes?.length || 0) ? c : best
    );
  }, [item.question_comments]);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => router.push(`/(app)/soz-sende/${item.id}`)}
    >
      <View style={styles.cardGlow} />
      <View style={styles.cardContent}>
        <Text style={styles.title}>{item.title}</Text>

        <View style={styles.cardFooter}>
          {topComment ? (
            <View style={styles.topCommentBox}>
              <Ionicons name="chatbubble-ellipses" size={14} color={themeColors.primary} style={styles.topCommentIcon} />
              <View style={styles.topCommentBody}>
                <View style={styles.topCommentMetaRow}>
                  <Text style={styles.topCommentAuthor} numberOfLines={1}>
                    {topComment.profiles?.username
                      ? `@${topComment.profiles.username}`
                      : topComment.profiles?.full_name || 'Kullanıcı'}
                  </Text>
                  <View style={styles.topCommentLikeRow}>
                    <Ionicons name="heart" size={11} color={themeColors.textMuted} />
                    <Text style={styles.topCommentLikeCount}>
                      {topComment.comment_likes?.length || 0}
                    </Text>
                  </View>
                </View>
                <Text style={styles.topCommentText} numberOfLines={2}>
                  {topComment.content}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.topCommentBox}>
              <Ionicons name="chatbubble-outline" size={14} color={themeColors.textMuted} />
              <Text style={styles.topCommentEmptyText}>Henüz yorum yok, ilk yorumu sen yap!</Text>
            </View>
          )}
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
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: themeColors.textPrimary,
      marginTop: Spacing.xs,
      marginBottom: Spacing.xs,
      lineHeight: 28,
    },
    cardFooter: {
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: themeColors.border + '50',
    },
    topCommentBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    topCommentIcon: { marginTop: 2 },
    topCommentBody: { flex: 1 },
    topCommentMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 3,
      gap: 8,
    },
    topCommentAuthor: {
      flex: 1,
      fontSize: 12,
      fontWeight: '700',
      color: themeColors.textPrimary,
    },
    topCommentLikeRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    topCommentLikeCount: {
      fontSize: 11,
      fontWeight: '700',
      color: themeColors.textMuted,
    },
    topCommentText: {
      fontSize: 13,
      fontWeight: '600',
      color: themeColors.textSecondary,
      lineHeight: 18,
    },
    topCommentEmptyText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '600',
      color: themeColors.textMuted,
      fontStyle: 'italic',
    },
  });
