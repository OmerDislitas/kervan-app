import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography, Spacing, useThemeColors } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  seeAllText?: string;
  subtitle?: string;
}

/**
 * Tekrarlanan "Başlık | Tümü" satırı — tüm ekranlarda ortak kullanım için.
 */
export const SectionHeader = React.memo(function SectionHeader({
  title,
  onSeeAll,
  seeAllText = 'Tümü',
  subtitle,
}: SectionHeaderProps) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>{subtitle}</Text>
        ) : null}
      </View>
      {onSeeAll ? (
        <TouchableOpacity onPress={onSeeAll} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.seeAll, { color: themeColors.primary }]}>{seeAllText}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  seeAll: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
});
