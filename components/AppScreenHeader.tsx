import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Typography, Spacing, useThemeColors } from '@/constants/theme';

interface AppScreenHeaderProps {
  title: string;
  rightActions?: React.ReactNode;
}

/**
 * Tüm ana sekme ekranlarında ortak header.
 * Sabit yükseklik: başlık sola hizalı, sağında opsiyonel ikon butonları.
 */
const AppScreenHeader = React.memo(function AppScreenHeader({
  title,
  rightActions,
}: AppScreenHeaderProps) {
  const themeColors = useThemeColors();

  return (
    <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
      <Text style={[styles.title, { color: themeColors.textPrimary }]}>{title}</Text>
      {rightActions ? <View style={styles.actions}>{rightActions}</View> : null}
    </View>
  );
});

export default AppScreenHeader;

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
