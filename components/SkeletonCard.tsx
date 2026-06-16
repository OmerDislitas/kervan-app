import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useThemeColors } from '@/constants/theme';

interface SkeletonCardProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Shimmer animasyonlu skeleton placeholder bileşeni.
 * Veriler yüklenirken gerçek kart şeklinde gri, solup parlayan animasyon gösterir.
 */
export const SkeletonCard = React.memo(function SkeletonCard({
  width = '100%',
  height = 80,
  borderRadius = 12,
  style,
}: SkeletonCardProps) {
  const themeColors = useThemeColors();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  const isDark = themeColors.background === '#0F1923';
  const baseColor = isDark ? '#1E2D3D' : '#E5E7EB';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
});

/** Kart şeklinde (başlık + 2 satır içerik) skeleton */
export const SkeletonListCard = React.memo(function SkeletonListCard() {
  const themeColors = useThemeColors();
  const isDark = themeColors.background === '#0F1923';
  const baseColor = isDark ? '#1E2D3D' : '#E5E7EB';

  return (
    <View style={[styles.cardWrapper, { backgroundColor: isDark ? '#131F2B' : '#F9FAFB', borderColor: isDark ? '#1E2D3D' : '#E5E7EB' }]}>
      <View style={styles.cardInner}>
        {/* Badge row */}
        <View style={styles.topRow}>
          <SkeletonCard width={80} height={20} borderRadius={8} />
          <SkeletonCard width={60} height={14} borderRadius={6} />
        </View>
        {/* Title */}
        <SkeletonCard width="85%" height={22} borderRadius={8} style={{ marginTop: 12 }} />
        <SkeletonCard width="60%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: baseColor }]}>
          <SkeletonCard width={100} height={18} borderRadius={6} />
          <SkeletonCard width={80} height={18} borderRadius={6} />
        </View>
      </View>
    </View>
  );
});

/** Yatay kaydırma için kart skeleton */
export const SkeletonHorizontalCard = React.memo(function SkeletonHorizontalCard() {
  const themeColors = useThemeColors();
  const isDark = themeColors.background === '#0F1923';

  return (
    <View style={[styles.hCard, { backgroundColor: isDark ? '#131F2B' : '#F9FAFB', borderColor: isDark ? '#1E2D3D' : '#E5E7EB' }]}>
      <SkeletonCard width={70} height={18} borderRadius={8} />
      <SkeletonCard width="90%" height={20} borderRadius={6} style={{ marginTop: 8 }} />
      <SkeletonCard width="60%" height={14} borderRadius={6} style={{ marginTop: 6 }} />
    </View>
  );
});

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
  },
  hCard: {
    width: 240,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
});
