/**
 * HomeWisdomCard.tsx
 * Ana sayfada "Günlük Hikmet" sözünü gösteren kart.
 * Söz Supabase'deki quotes tablosundan (pool='home') gelir;
 * offline ise yerel HOME_WISDOM_POOL fallback olarak kullanılır.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { fetchHomeQuotes, pickDailyQuote } from '@/services/quotesService';

export const HomeWisdomCard = React.memo(function HomeWisdomCard() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  const { data: homeQuotes } = useQuery({
    queryKey: ['home-quotes'],
    queryFn: fetchHomeQuotes,
    staleTime: 1000 * 60 * 60 * 24, // 24 saat cache
    retry: 1,
  });

  const wisdom = React.useMemo(
    () => pickDailyQuote(homeQuotes ?? []),
    [homeQuotes]
  );

  if (!wisdom?.text) return null;

  return (
    <View style={[styles.card, styles.shadow]}>
      <LinearGradient
        colors={[themeColors.surface, themeColors.surfaceLight ?? themeColors.surface]}
        style={styles.gradient}
      >
        {/* Dekoratif glow */}
        <View style={styles.glow} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={12} color={themeColors.surface} />
            <Text style={styles.badgeText}>Günlük Hikmet</Text>
          </View>
          <Ionicons name="book-outline" size={18} color={themeColors.primary} opacity={0.6} />
        </View>

        {/* Söz */}
        <Text style={styles.quoteText}>"{wisdom.text}"</Text>

        {/* Yazar */}
        <View style={styles.authorRow}>
          <View style={styles.authorLine} />
          <Text style={styles.authorText}>{wisdom.author}</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

export default HomeWisdomCard;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    card: {
      borderRadius: BorderRadius.xl,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: themeColors.primary + '20',
    },
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    gradient: {
      padding: Spacing.lg,
      position: 'relative',
    },
    glow: {
      position: 'absolute',
      right: -40,
      top: -40,
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: themeColors.primary + '12',
      zIndex: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
      position: 'relative',
      zIndex: 2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
    },
    badgeText: {
      color: themeColors.surface,
      fontSize: Typography.fontSize.xs,
      fontWeight: '800',
    },
    quoteText: {
      fontSize: Typography.fontSize.md,
      color: themeColors.textPrimary,
      lineHeight: 26,
      fontStyle: 'italic',
      marginBottom: Spacing.md,
      position: 'relative',
      zIndex: 2,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      position: 'relative',
      zIndex: 2,
    },
    authorLine: {
      width: 24,
      height: 2,
      backgroundColor: themeColors.primary,
      borderRadius: 1,
    },
    authorText: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.primary,
      fontWeight: '700',
    },
  });
