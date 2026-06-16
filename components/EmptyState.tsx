import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, useThemeColors } from '@/constants/theme';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

/**
 * Tekrarlanan boş durum gösterimi — FlatList/ScrollView boş olduğunda kullanılır.
 */
export const EmptyState = React.memo(function EmptyState({
  icon = 'file-tray-outline',
  title,
  subtitle,
  children,
}: EmptyStateProps) {
  const themeColors = useThemeColors();

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <Ionicons name={icon} size={40} color={themeColors.border} />
      </View>
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: themeColors.textMuted }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: Spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
