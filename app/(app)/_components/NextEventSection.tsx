import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { SkeletonCard } from '@/components/SkeletonCard';

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${date.getDate()} ${months[date.getMonth()]} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface NextEventSectionProps {
  event: any | null | undefined;
  isLoading: boolean;
  onPressEvent: (id: string) => void;
  onPressAll: () => void;
}

export const NextEventSection = React.memo(function NextEventSection({
  event,
  isLoading,
  onPressEvent,
  onPressAll,
}: NextEventSectionProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Sıradaki Etkinliğin</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonWrapper}>
          <SkeletonCard width={80} height={20} borderRadius={BorderRadius.full} />
          <SkeletonCard width="75%" height={22} borderRadius={8} style={{ marginTop: 12 }} />
          <SkeletonCard width="55%" height={16} borderRadius={6} style={{ marginTop: 8 }} />
          <SkeletonCard width="45%" height={16} borderRadius={6} style={{ marginTop: 6 }} />
        </View>
      ) : event ? (
        <TouchableOpacity
          style={[
            styles.eventCard,
            styles.premiumShadow,
            {
              borderColor:
                ((themeColors.categories as any)[event.category] || themeColors.border) + '40',
              borderWidth: 1.5,
            },
          ]}
          onPress={() => onPressEvent(event.id)}
          activeOpacity={0.85}
        >
          <View
            style={[
              styles.eventCardGlow,
              {
                backgroundColor:
                  ((themeColors.categories as any)[event.category] || themeColors.primary) + '20',
              },
            ]}
          />
          <View style={styles.eventCardHeader}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    ((themeColors.categories as any)[event.category] || themeColors.primary) + '15',
                },
              ]}
            >
              <Ionicons
                name="flash"
                size={12}
                color={(themeColors.categories as any)[event.category] || themeColors.primary}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: (themeColors.categories as any)[event.category] || themeColors.primary },
                ]}
              >
                Yaklaşan
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
          </View>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <View style={styles.eventMeta}>
            <Ionicons name="time-outline" size={16} color={themeColors.textSecondary} />
            <Text style={styles.eventMetaText}>
              {event.event_date ? formatEventDate(event.event_date) : 'Tarih belirtilmedi'}
            </Text>
          </View>
          {event.location && (
            <View style={styles.eventMeta}>
              <Ionicons name="location-outline" size={16} color={themeColors.textSecondary} />
              <Text style={styles.eventMetaText}>{event.location}</Text>
            </View>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-clear-outline" size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
          <Text style={styles.emptyText}>Kayıtlı olduğun yaklaşan bir etkinlik yok.</Text>
          <TouchableOpacity onPress={onPressAll}>
            <Text style={styles.emptyLink}>Etkinliklere göz at</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
});

export default NextEventSection;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: Spacing.md,
      paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: '900',
      color: themeColors.textPrimary,
      letterSpacing: -0.5,
    },
    skeletonWrapper: {
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginHorizontal: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    premiumShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    eventCard: {
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      overflow: 'hidden',
      position: 'relative',
      marginHorizontal: Spacing.lg,
    },
    eventCardGlow: {
      position: 'absolute',
      top: -40,
      right: -40,
      width: 120,
      height: 120,
      borderRadius: 60,
      zIndex: 0,
    },
    eventCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
      position: 'relative',
      zIndex: 2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      gap: 4,
    },
    badgeText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: '700',
    },
    eventTitle: {
      fontSize: Typography.fontSize.lg,
      color: themeColors.textPrimary,
      marginBottom: Spacing.sm,
      position: 'relative',
      zIndex: 2,
    },
    eventMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: 6,
      position: 'relative',
      zIndex: 2,
    },
    eventMetaText: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textSecondary,
    },
    emptyCard: {
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
      borderStyle: 'dashed',
      marginHorizontal: Spacing.lg,
    },
    emptyText: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textSecondary,
      marginBottom: Spacing.xs,
    },
    emptyLink: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.primary,
      fontWeight: '600',
    },
  });
