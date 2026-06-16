import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useRenderTracker } from '@/lib/debugPerf';

export type HomeQuestion = { id: string; title: string };

interface QuestionOfTheWeekProps {
  questions: HomeQuestion[] | undefined;
  isLoading?: boolean;
  onPressQuestion: (id: string) => void;
}

export const QuestionOfTheWeek = React.memo(function QuestionOfTheWeek({
  questions,
  isLoading,
  onPressQuestion,
}: QuestionOfTheWeekProps) {
  useRenderTracker('QuestionOfTheWeek');
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const translateYAnim = React.useRef(new Animated.Value(0)).current;

  useFocusEffect(
    React.useCallback(() => {
      if (!questions || questions.length <= 1) return;
      const interval = setInterval(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: -10, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          setQuestionIndex((prev) => (prev + 1) % questions.length);
          translateYAnim.setValue(10);
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(translateYAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
        });
      }, 5000);
      return () => clearInterval(interval);
    }, [questions, fadeAnim, translateYAnim])
  );

  if (isLoading) {
    return (
      <View style={styles.skeletonWrapper}>
        <SkeletonCard width={80} height={20} borderRadius={BorderRadius.full} />
        <SkeletonCard width="85%" height={22} borderRadius={8} style={{ marginTop: 12 }} />
        <SkeletonCard width="60%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    );
  }

  const activeQuestion = questions?.[questionIndex];
  if (!activeQuestion) return null;

  return (
    <TouchableOpacity
      style={[styles.card, styles.premiumShadow]}
      activeOpacity={0.9}
      onPress={() => onPressQuestion(activeQuestion.id)}
    >
      <LinearGradient
        colors={[themeColors.surface, themeColors.surfaceLight]}
        style={styles.content}
      >
        <View style={styles.glow} />
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="chatbubbles" size={14} color={themeColors.surface} />
            <Text style={styles.badgeText}>Söz Sende</Text>
          </View>
          {questions && questions.length > 1 && (
            <View style={styles.pagination}>
              {questions.map((_, idx) => (
                <View
                  key={idx}
                  style={[styles.dot, idx === questionIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
        </View>
        <View style={{ minHeight: 70, justifyContent: 'center' }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
            <Text style={styles.title} numberOfLines={2}>
              {activeQuestion.title}
            </Text>
            <Text style={styles.subtitle}>Toplulukla tartışmaya katıl, fikrini paylaş.</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

export default QuestionOfTheWeek;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    skeletonWrapper: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.primary + '30',
    },
    card: {
      borderRadius: BorderRadius.xl,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      position: 'relative',
      overflow: 'hidden',
    },
    premiumShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    content: {
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.primary + '30',
      borderRadius: BorderRadius.xl,
    },
    glow: {
      position: 'absolute',
      right: -30,
      bottom: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: themeColors.primary + '15',
      zIndex: 0,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
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
    pagination: {
      flexDirection: 'row',
      gap: 4,
      alignItems: 'center',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: themeColors.primary + '30',
    },
    dotActive: {
      width: 12,
      backgroundColor: themeColors.primary,
    },
    title: {
      fontSize: Typography.fontSize.lg,
      fontWeight: '800',
      color: themeColors.textPrimary,
      marginBottom: Spacing.xs,
      lineHeight: 24,
      position: 'relative',
      zIndex: 2,
    },
    subtitle: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textSecondary,
      position: 'relative',
      zIndex: 2,
    },
  });
