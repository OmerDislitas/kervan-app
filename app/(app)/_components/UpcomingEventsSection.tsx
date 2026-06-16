import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { SkeletonHorizontalCard } from '@/components/SkeletonCard';

function formatEventDate(dateStr: string) {
  const date = new Date(dateStr);
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${date.getDate()} ${months[date.getMonth()]} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

interface UpcomingEventsSectionProps {
  events: any[] | undefined;
  isLoading: boolean;
  onPressEvent: (id: string) => void;
  onPressAll: () => void;
}

export const UpcomingEventsSection = React.memo(function UpcomingEventsSection({
  events,
  isLoading,
  onPressEvent,
  onPressAll,
}: UpcomingEventsSectionProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
        <TouchableOpacity onPress={onPressAll}>
          <Text style={styles.seeAllText}>Tümü</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
          scrollEnabled={false}
        >
          <SkeletonHorizontalCard />
          <SkeletonHorizontalCard />
          <SkeletonHorizontalCard />
        </ScrollView>
      ) : events && events.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContent}
        >
          {events.map((ev) => {
            const categoryColor =
              (themeColors.categories as any)[ev.category] || themeColors.primary;
            return (
              <TouchableOpacity
                key={ev.id}
                style={[styles.horizontalCard, { borderColor: categoryColor + '40' }]}
                activeOpacity={0.9}
                onPress={() => onPressEvent(ev.id)}
              >
                <View style={[styles.horizontalCardGlow, { backgroundColor: categoryColor + '25' }]} />
                <View style={styles.horizontalCardContent}>
                  <View style={styles.horizontalCardTop}>
                    <View style={[styles.hBadge, { backgroundColor: categoryColor + '15' }]}>
                      <Ionicons name="calendar-outline" size={12} color={categoryColor} />
                      <Text style={[styles.hBadgeText, { color: categoryColor }]}>
                        {formatEventDate(ev.event_date!)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.hTitle} numberOfLines={2}>
                    {ev.title}
                  </Text>
                  {ev.location && (
                    <View style={styles.hMetaRow}>
                      <Ionicons name="location" size={14} color={themeColors.textSecondary} />
                      <Text style={styles.hMetaText} numberOfLines={1}>
                        {ev.location}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.emptyText}>Şu an yaklaşan etkinlik yok.</Text>
      )}
    </>
  );
});

export default UpcomingEventsSection;

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
    seeAllText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: '600',
      color: themeColors.primary,
      marginBottom: 2,
    },
    horizontalScrollContent: {
      paddingHorizontal: Spacing.lg,
      gap: Spacing.md,
      paddingBottom: Spacing.md,
    },
    horizontalCard: {
      width: 240,
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: themeColors.border,
      padding: Spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
      overflow: 'hidden',
      position: 'relative',
    },
    horizontalCardGlow: {
      position: 'absolute',
      top: -20,
      right: -20,
      width: 80,
      height: 80,
      borderRadius: 40,
    },
    horizontalCardContent: {
      position: 'relative',
      zIndex: 2,
    },
    horizontalCardTop: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      marginBottom: Spacing.sm,
    },
    hBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: BorderRadius.full,
      gap: 4,
    },
    hBadgeText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: '700',
    },
    hTitle: {
      fontSize: Typography.fontSize.md,
      fontWeight: '700',
      color: themeColors.textPrimary,
      marginBottom: Spacing.sm,
      lineHeight: 22,
    },
    hMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    hMetaText: {
      fontSize: Typography.fontSize.xs,
      color: themeColors.textSecondary,
      flex: 1,
    },
    emptyText: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textMuted,
      paddingHorizontal: Spacing.lg,
    },
  });
