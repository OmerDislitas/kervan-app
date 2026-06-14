import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { DAYS_OF_WEEK } from '@/constants/data';
import NotificationBell from '@/components/NotificationBell';

type Event = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  event_date: string | null;
  is_recurring: boolean;
  recurring_day: number | null;
  recurring_time: string | null;
  gender_restriction: 'male' | 'female' | null;
  max_capacity: number | null;
  is_published: boolean;
};

type Registration = {
  event_id: string;
  status: 'active' | 'cancelled';
};

async function fetchOrgDetails(id: string) {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchOrgEvents(orgId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function fetchMyRegistrations(userId: string): Promise<Registration[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id, status')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw error;
  return data ?? [];
}

async function fetchParticipantCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('status', 'active');

  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((r: { event_id: string }) => {
    counts[r.event_id] = (counts[r.event_id] ?? 0) + 1;
  });
  return counts;
}

export default function OrgEventsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const { profile } = useAuthStore();

  const { data: org, isLoading: isOrgLoading } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => fetchOrgDetails(id),
  });

  const { data: events = [], isLoading: isEventsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['org-events', id],
    queryFn: () => fetchOrgEvents(id),
  });

  const { data: myRegistrations = [] } = useQuery({
    queryKey: ['my-registrations', profile?.id],
    queryFn: () => fetchMyRegistrations(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: counts = {} } = useQuery({
    queryKey: ['participant-counts'],
    queryFn: fetchParticipantCounts,
  });

  const registeredIds = new Set(myRegistrations.map((r) => r.event_id));
  const upcomingEvents = events.filter((e) => !e.is_recurring);
  const recurringEvents = events.filter((e) => e.is_recurring);

  function formatEventDate(dateStr: string) {
    const date = new Date(dateStr);
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  function formatRecurring(day: number, time: string) {
    const timeStr = time.slice(0, 5);
    return `Her ${DAYS_OF_WEEK[day]} · ${timeStr}`;
  }

  function renderEventCard({ item }: { item: Event }) {
    const isRegistered = registeredIds.has(item.id);
    const count = counts[item.id] ?? 0;
    const isFull = item.max_capacity !== null && count >= item.max_capacity;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push(`/(app)/events/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardBadgeRow}>
            {item.is_recurring && (
              <View style={styles.recurringBadge}>
                <Ionicons name="repeat" size={11} color={themeColors.primary} />
                <Text style={styles.recurringBadgeText}>Düzenli</Text>
              </View>
            )}
            {item.gender_restriction && (
              <View style={[
                styles.genderBadge,
                { backgroundColor: item.gender_restriction === 'male' ? themeColors.male + '22' : themeColors.female + '22' }
              ]}>
                <Text style={[
                  styles.genderBadgeText,
                  { color: item.gender_restriction === 'male' ? themeColors.male : themeColors.female }
                ]}>
                  {item.gender_restriction === 'male' ? 'Erkeklere Özel' : 'Kadınlara Özel'}
                </Text>
              </View>
            )}
          </View>
          {isFull && (
            <View style={styles.fullBadge}>
              <Text style={styles.fullBadgeText}>Dolu</Text>
            </View>
          )}
        </View>

        <Text style={styles.cardTitle}>{item.title}</Text>

        <View style={styles.cardMeta}>
          <Ionicons name="time-outline" size={14} color={themeColors.primary} />
          <Text style={styles.cardMetaText}>
            {item.is_recurring
              ? formatRecurring(item.recurring_day!, item.recurring_time!)
              : formatEventDate(item.event_date!)}
          </Text>
        </View>

        {item.location && (
          <View style={styles.cardMeta}>
            <Ionicons name="location-outline" size={14} color={themeColors.textSecondary} />
            <Text style={styles.cardMetaText}>{item.location}</Text>
          </View>
        )}

        <View style={[styles.cardFooter, { justifyContent: 'flex-end' }]}>
          <View style={[
            styles.statusBadge,
            isRegistered ? styles.registeredBadge : styles.notRegisteredBadge,
          ]}>
            <Ionicons
              name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
              size={14}
              color={isRegistered ? themeColors.success : themeColors.primary}
            />
            <Text style={[
              styles.statusBadgeText,
              { color: isRegistered ? themeColors.success : themeColors.primary }
            ]}>
              {isRegistered ? 'Kayıtlısın' : 'Katıl'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSectionHeader(title: string, icon: string) {
    return (
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={18} color={themeColors.primary} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
    );
  }

  if (isOrgLoading || isEventsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = org?.name
    ? org.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
    : 'STK';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{org?.name || 'Etkinlikler'}</Text>
        </View>
        <NotificationBell />
      </View>

      <FlatList
        data={[]}
        keyExtractor={() => 'dummy'}
        renderItem={() => null}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={themeColors.primary}
          />
        }
        ListHeaderComponent={() => (
          <>
            {/* STK Detay Kartı */}
            <View style={styles.orgHeaderCard}>
              <View style={styles.orgHeaderRow}>
                {org?.logo_url ? (
                  <Image source={{ uri: org.logo_url }} style={styles.orgLogo} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.orgHeaderInfo}>
                  <Text style={styles.orgHeaderName}>{org?.name}</Text>
                  <Text style={styles.activeEventsCount}>{events.length} Aktif Etkinlik</Text>
                </View>
              </View>
              {org?.description && (
                <Text style={styles.orgHeaderDesc}>{org.description}</Text>
              )}
            </View>

            {/* Yaklaşan Etkinlikler */}
            {upcomingEvents.length > 0 && (
              <>
                {renderSectionHeader('Yaklaşan Etkinlikler', 'calendar-outline')}
                {upcomingEvents.map((item) => renderEventCard({ item }))}
              </>
            )}

            {/* Düzenli Etkinlikler */}
            {recurringEvents.length > 0 && (
              <>
                {renderSectionHeader('Düzenli Etkinlikler', 'repeat-outline')}
                {recurringEvents.map((item) => renderEventCard({ item }))}
              </>
            )}

            {events.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-clear-outline" size={60} color={themeColors.textMuted} />
                <Text style={styles.emptyStateTitle}>Henüz etkinlik yok</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Bu kuruma ait yeni etkinlikler eklendiğinde burada görünecek.
                </Text>
              </View>
            )}
          </>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary, flex: 1, marginRight: Spacing.md },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  listContent: { padding: Spacing.lg, paddingBottom: 100 },
  orgHeaderCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  orgHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  orgLogo: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    backgroundColor: themeColors.primary + '22',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.primary + '44',
  },
  avatarPlaceholderText: {
    color: themeColors.primary,
    fontWeight: '800',
    fontSize: 20,
  },
  orgHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  orgHeaderName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  activeEventsCount: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.primary,
    fontWeight: '700',
  },
  orgHeaderDesc: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
    paddingTop: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xs },
  cardBadgeRow: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  recurringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: themeColors.primary + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  recurringBadgeText: { fontSize: 10, color: themeColors.primary, fontWeight: '600' },
  genderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  genderBadgeText: { fontSize: 10, fontWeight: '600' },
  fullBadge: {
    backgroundColor: themeColors.error + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  fullBadgeText: { fontSize: 10, color: themeColors.error, fontWeight: '700' },
  cardTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary, marginBottom: Spacing.sm },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: 4 },
  cardMetaText: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  registeredBadge: { backgroundColor: themeColors.success + '22' },
  notRegisteredBadge: { backgroundColor: themeColors.primary + '22' },
  statusBadgeText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  emptyStateTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: themeColors.textSecondary, marginTop: Spacing.md },
  emptyStateSubtitle: { fontSize: Typography.fontSize.md, color: themeColors.textMuted, textAlign: 'center', marginTop: Spacing.xs },
});
