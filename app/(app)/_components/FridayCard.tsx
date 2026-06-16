import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

export const FridayCard = React.memo(function FridayCard() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  if (new Date().getDay() !== 5) return null;

  return (
    <View style={[styles.card, styles.premiumShadow]}>
      <View style={styles.glow} />
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="leaf" size={12} color={themeColors.surface} />
            <Text style={styles.badgeText}>Cumanız Mübarek Olsun</Text>
          </View>
          <Ionicons name="moon" size={20} color={themeColors.primary} opacity={0.6} />
        </View>
        <Text style={styles.message}>
          "Hayırlı Cumalar! Bu mübarek günde kalbinizden huzur, dilinizden dua eksik olmasın. Kervan yolculuğumuzda hep birlikte nice güzel günlere."
        </Text>
        <View style={styles.footer}>
          <Text style={styles.signature}>— Kervan Ailesi</Text>
        </View>
      </View>
    </View>
  );
});

export default FridayCard;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.xl,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: '#2ecc7130',
      overflow: 'hidden',
      position: 'relative',
      padding: Spacing.lg,
    },
    premiumShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    glow: {
      position: 'absolute',
      top: -50,
      right: -50,
      width: 150,
      height: 150,
      borderRadius: 75,
      backgroundColor: '#2ecc7110',
      zIndex: 0,
    },
    content: {
      position: 'relative',
      zIndex: 2,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: '#2ecc71',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
    },
    badgeText: {
      color: themeColors.surface,
      fontSize: Typography.fontSize.xs,
      fontWeight: '800',
    },
    message: {
      fontSize: Typography.fontSize.md,
      color: themeColors.textPrimary,
      lineHeight: 24,
      fontStyle: 'italic',
      fontFamily: 'serif',
      marginBottom: Spacing.md,
    },
    footer: {
      alignItems: 'flex-end',
    },
    signature: {
      fontSize: Typography.fontSize.xs,
      color: themeColors.primary,
      fontWeight: '700',
      letterSpacing: 1,
    },
  });
