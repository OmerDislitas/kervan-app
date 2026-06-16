import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

interface ExploreHeaderProps {
  scrollY?: Animated.Value;
}

const ExploreHeader = React.memo(function ExploreHeader({ scrollY }: ExploreHeaderProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const fallbackScrollY = React.useRef(new Animated.Value(0)).current;
  const effectiveScrollY = scrollY ?? fallbackScrollY;

  const headerOpacity = effectiveScrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <View style={styles.headerLeft}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Keşfet</Text>
          <Text style={styles.headerSubtitle}>Sana özel içerikler ve gündem</Text>
        </View>
      </View>
    </Animated.View>
  );
});

export default ExploreHeader;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: themeColors.background,
      zIndex: 10,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '900',
      color: themeColors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
  });
