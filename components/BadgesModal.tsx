import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BADGES, UserBadgeStats } from '@/constants/badges';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

const { width } = Dimensions.get('window');

type BadgesModalProps = {
  visible: boolean;
  onClose: () => void;
  userStats: UserBadgeStats;
};

export default function BadgesModal({ visible, onClose, userStats }: BadgesModalProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="medal" size={24} color={themeColors.primary} />
              <Text style={styles.headerTitle}>FikirForum Rozetleri</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description}>
            FikirForum'da aktif oldukça rozetler kazanırsın. İşte kazanabileceğin ve kazandığın rozetler:
          </Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {BADGES.map((badge) => {
              const earned = badge.isEarned(userStats);
              return (
                <View key={badge.id} style={[styles.badgeCard, !earned && styles.unearnedCard]}>
                  <LinearGradient
                    colors={earned ? badge.colors : [themeColors.surfaceLight, themeColors.borderLight]}
                    style={[
                      styles.badgeIconContainer, 
                      earned && styles.earnedBadgeIconGlow
                    ]}
                  >
                    <Ionicons 
                      name={badge.icon as any} 
                      size={30} 
                      color={earned ? '#ffffff' : themeColors.textMuted} 
                    />
                  </LinearGradient>
                  
                  <View style={styles.badgeInfo}>
                    <View style={styles.badgeTitleRow}>
                      <Text style={[styles.badgeTitle, !earned && { color: themeColors.textSecondary }]}>
                        {badge.title}
                      </Text>
                      {earned && (
                        <View style={styles.earnedBadge}>
                          <Ionicons name="checkmark-circle" size={14} color={themeColors.success} />
                          <Text style={styles.earnedText}>Kazanıldı</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.badgeDesc}>{badge.description}</Text>
                    <View style={styles.conditionBox}>
                      <Ionicons name="information-circle-outline" size={14} color={themeColors.textSecondary} />
                      <Text style={styles.conditionText}>{badge.conditionDesc}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: BorderRadius['2xl'],
    borderTopRightRadius: BorderRadius['2xl'],
    height: '85%',
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  badgeCard: {
    flexDirection: 'row',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    alignItems: 'center',
    gap: Spacing.md,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  unearnedCard: {
    backgroundColor: themeColors.background,
    borderColor: themeColors.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  badgeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  earnedBadgeIconGlow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: themeColors.success + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  earnedText: {
    fontSize: 10,
    fontWeight: '800',
    color: themeColors.success,
  },
  badgeDesc: {
    fontSize: 13,
    color: themeColors.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  conditionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: themeColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  conditionText: {
    fontSize: 11,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
});
