import React, { useRef, useEffect } from 'react';
import {
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  View,
} from 'react-native';
import { useThemeColors, Spacing, BorderRadius } from '@/constants/theme';

interface CategoryBarProps {
  categories: string[];
  selected: string;
  onSelect: (cat: string) => void;
}

// Tek bir kategori tag'i — seçim animasyonunu kendi yönetir
const CategoryTag = React.memo(function CategoryTag({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(isSelected ? 1 : 0.96)).current;
  const opacityAnim = useRef(new Animated.Value(isSelected ? 1 : 0.65)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1 : 0.96,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }),
      Animated.timing(opacityAnim, {
        toValue: isSelected ? 1 : 0.65,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isSelected]);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Animated.View
        style={[
          styles.tag,
          {
            backgroundColor: isSelected
              ? themeColors.primary
              : themeColors.surface,
            borderColor: isSelected
              ? themeColors.primary
              : themeColors.border,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Text
          style={[
            styles.tagText,
            {
              color: isSelected ? '#fff' : themeColors.textSecondary,
              fontWeight: isSelected ? '800' : '600',
            },
          ]}
        >
          {label}
        </Text>
        {isSelected && <View style={styles.activeDot} />}
      </Animated.View>
    </TouchableOpacity>
  );
});

export default function CategoryBar({ categories = [], selected, onSelect }: CategoryBarProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {categories.map((cat) => (
        <CategoryTag
          key={cat}
          label={cat}
          isSelected={selected === cat}
          onPress={() => onSelect(cat)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
});
