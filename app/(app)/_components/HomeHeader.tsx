import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import NotificationBell from '@/components/NotificationBell';

interface HomeHeaderProps {
  userInitial: string;
  userName: string;
  onPressProfile: () => void;
  onPressRanking: () => void;
}

export const HomeHeader = React.memo(function HomeHeader({
  userInitial,
  userName,
  onPressProfile,
  onPressRanking,
}: HomeHeaderProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.headerLeft}
        onPress={onPressProfile}
        activeOpacity={0.7}
      >
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userInitial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.greetingText}>Merhaba,</Text>
          <Text style={styles.userName} numberOfLines={1} ellipsizeMode="tail">{userName}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onPressRanking}
          activeOpacity={0.7}
        >
          <Ionicons name="trophy-outline" size={20} color={themeColors.primary} />
        </TouchableOpacity>
        <NotificationBell />
      </View>
    </View>
  );
});

export default HomeHeader;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.xl,
      paddingHorizontal: Spacing.lg,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      flex: 1,
      marginRight: Spacing.md,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      flexShrink: 0,
    },
    avatarPlaceholder: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: themeColors.primary + '30',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.primary + '50',
    },
    avatarText: {
      fontSize: Typography.fontSize.xl,
      fontWeight: 'bold',
      color: themeColors.primary,
    },
    greetingText: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textSecondary,
      marginBottom: 2,
    },
    userName: {
      fontSize: Typography.fontSize.lg,
      fontWeight: 'bold',
      color: themeColors.textPrimary,
    },
    iconButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: themeColors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
  });
