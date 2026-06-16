import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

interface HomeHeroProps {
  onPressEvents: () => void;
  onPressSozSende: () => void;
}

export const HomeHero = React.memo(function HomeHero({ onPressEvents, onPressSozSende }: HomeHeroProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <ImageBackground
      source={require('../../../assets/images/hero_bg.png')}
      style={styles.heroCard}
      imageStyle={{ borderRadius: BorderRadius.xl }}
    >
      <LinearGradient
        colors={['rgba(15, 25, 35, 0.7)', 'rgba(15, 25, 35, 0.3)']}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.heroContent}>
        <View style={styles.heroBadge}>
          <Ionicons name="sparkles" size={12} color={themeColors.primary} />
          <Text style={styles.heroBadgeText}>KERVAN ÖZEL</Text>
        </View>
        <Text style={styles.heroSubtitle}>
          Topluluğun bir parçası ol, yeni anılar biriktir ve geleceği birlikte inşa edelim.
        </Text>
        <View style={styles.heroActionRow}>
          <TouchableOpacity style={styles.heroMainAction} onPress={onPressEvents}>
            <Text style={styles.heroMainActionText}>Etkinlikleri İncele</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroSecondaryAction} onPress={onPressSozSende}>
            <Text style={styles.heroSecondaryActionText}>Yorumları Gör</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
});

export default HomeHero;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    heroCard: {
      borderRadius: BorderRadius.xl,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      overflow: 'hidden',
      minHeight: 160,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.3,
      shadowRadius: 15,
      elevation: 10,
    },
    heroContent: {
      padding: Spacing.md,
      flex: 1,
      justifyContent: 'center',
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      alignSelf: 'flex-start',
      marginBottom: Spacing.sm,
      borderWidth: 1,
      borderColor: themeColors.primary + '40',
    },
    heroBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: themeColors.primary,
      letterSpacing: 1,
    },
    heroSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: '#fff',
      opacity: 0.9,
      marginBottom: Spacing.lg,
      lineHeight: 20,
      maxWidth: '90%',
    },
    heroActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    heroMainAction: {
      backgroundColor: themeColors.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: BorderRadius.lg,
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    heroMainActionText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: Typography.fontSize.md,
    },
    heroSecondaryAction: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    heroSecondaryActionText: {
      color: '#fff',
      fontWeight: '800',
      fontSize: Typography.fontSize.md,
    },
  });
