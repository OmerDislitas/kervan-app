import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

interface RankingModalProps {
  visible: boolean;
  onClose: () => void;
  topUsers: any[] | undefined;
  isLoading: boolean;
  currentUserId: string | undefined;
  onPressUser: (userId: string) => void;
}

export const RankingModal = React.memo(function RankingModal({
  visible,
  onClose,
  topUsers,
  isLoading,
  currentUserId,
  onPressUser,
}: RankingModalProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>FikirForum Sıralaması</Text>
              <Text style={styles.subtitle}>En yüksek puanlı ilk 10 yolcu</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={themeColors.primary} size="large" />
            </View>
          ) : (
            <FlatList
              data={topUsers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }) => {
                const rankIcon =
                  index === 0 ? 'trophy' : index === 1 ? 'medal' : index === 2 ? 'ribbon' : null;
                const rankColor =
                  index === 0
                    ? '#FFD700'
                    : index === 1
                    ? '#C0C0C0'
                    : index === 2
                    ? '#CD7F32'
                    : themeColors.textMuted;
                const isMe = item.id === currentUserId;

                return (
                  <TouchableOpacity
                    style={[styles.rankItem, isMe && styles.rankItemMe]}
                    activeOpacity={isMe ? 1 : 0.7}
                    onPress={() => {
                      if (!isMe) {
                        onClose();
                        onPressUser(item.id);
                      }
                    }}
                  >
                    <View style={styles.rankNumberContainer}>
                      {rankIcon ? (
                        <Ionicons name={rankIcon as any} size={22} color={rankColor} />
                      ) : (
                        <Text style={styles.rankNumberText}>{index + 1}</Text>
                      )}
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userHandle} numberOfLines={1}>
                        @{item.username || 'yolcu'} {isMe && '(Sen)'}
                      </Text>
                    </View>
                    <View style={styles.pointsContainer}>
                      <Text style={styles.pointsValue}>{item.points || 0}</Text>
                      <Text style={styles.pointsLabel}>Puan</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
});

export default RankingModal;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    content: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: BorderRadius.xl * 1.5,
      borderTopRightRadius: BorderRadius.xl * 1.5,
      height: '80%',
      paddingTop: Spacing.xl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.xl,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: themeColors.textPrimary,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: themeColors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    list: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.xl,
    },
    rankItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: themeColors.surface,
      padding: 16,
      borderRadius: BorderRadius.lg,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    rankItemMe: {
      borderColor: themeColors.primary,
      backgroundColor: themeColors.primary + '10',
      borderWidth: 2,
    },
    rankNumberContainer: {
      width: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rankNumberText: {
      fontSize: 18,
      fontWeight: '800',
      color: themeColors.textMuted,
    },
    userInfo: {
      flex: 1,
    },
    userHandle: {
      fontSize: 13,
      color: themeColors.textSecondary,
      marginTop: 2,
    },
    pointsContainer: {
      alignItems: 'flex-end',
    },
    pointsValue: {
      fontSize: 18,
      fontWeight: '900',
      color: themeColors.primary,
    },
    pointsLabel: {
      fontSize: 10,
      color: themeColors.textMuted,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: 2,
    },
  });
