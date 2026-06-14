import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { DAYS_OF_WEEK } from '@/constants/data';

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
  created_at: string;
};

async function fetchAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });
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

export default function AdminScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const statStyles = React.useMemo(() => createStatStyles(themeColors), [themeColors]);
  const { profile, isAdmin } = useAuthStore();
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  // Admin değilse geri yönlendir
  React.useEffect(() => {
    if (profile && !isAdmin) {
      router.replace('/(app)/events');
    }
  }, [profile, isAdmin]);

  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-events'],
    queryFn: fetchAllEvents,
    enabled: isAdmin,
  });

  const { data: counts = {} } = useQuery({
    queryKey: ['participant-counts'],
    queryFn: fetchParticipantCounts,
    enabled: isAdmin,
  });

  // Sayfa odaklandığında tüm verileri güncel tut
  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suggestions-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-topic-suggestions-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-questions-count'] });
      queryClient.invalidateQueries({ queryKey: ['admin-organizations-count'] });
      refetch();
    });
    return unsubscribe;
  }, [navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ['admin-suggestions-count'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-topic-suggestions-count'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-questions-count'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-organizations-count'] }),
        queryClient.invalidateQueries({ queryKey: ['participant-counts'] }),
      ]);
    } finally {
      setRefreshing(false);
    }
  };



  const { data: suggestionsCount = 0 } = useQuery({
    queryKey: ['admin-suggestions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('event_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin,
  });

  const { data: topicSuggestionsCount = 0 } = useQuery({
    queryKey: ['admin-topic-suggestions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('topic_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin,
  });

  const { data: questionsCount = 0 } = useQuery({
    queryKey: ['admin-questions-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('weekly_questions')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin,
  });

  const { data: organizationsCount = 0 } = useQuery({
    queryKey: ['admin-organizations-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    enabled: isAdmin,
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: boolean }) => {
      const { error } = await supabase
        .from('events')
        .update({ is_published: !current })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // STK kart sayısını ve org etkinlik listesini güncelle
      queryClient.invalidateQueries({ queryKey: ['active-events-counts'] });
      queryClient.invalidateQueries({ queryKey: ['org-events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events-home'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // STK kart sayısını ve org etkinlik listesini güncelle
      queryClient.invalidateQueries({ queryKey: ['active-events-counts'] });
      queryClient.invalidateQueries({ queryKey: ['org-events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events-home'] });
    },
  });

  const syncPointsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('sync_all_user_points');
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      Alert.alert('Başarılı', data.message || 'Puanlar başarıyla senkronize edildi.');
      queryClient.invalidateQueries({ queryKey: ['ranking'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats'] });
    },
    onError: (error: any) => {
      Alert.alert('Hata', 'Puanlar senkronize edilemedi: ' + error.message);
    }
  });

  const handleSyncPoints = () => {
    Alert.alert(
      'Puanları Senkronize Et',
      'Tüm kullanıcıların puanları yorum ve etkinliklerine göre yeniden hesaplanacaktır. Emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Evet, Senkronize Et', onPress: () => syncPointsMutation.mutate() },
      ]
    );
  };

  const handleDelete = (event: Event) => {
    Alert.alert(
      'Etkinliği Sil',
      `"${event.title}" etkinliğini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteMutation.mutate(event.id) },
      ]
    );
  };

  const publishedCount = events.filter((e) => e.is_published).length;
  const draftCount = events.filter((e) => !e.is_published).length;
  const totalParticipants = Object.values(counts).reduce((a, b) => a + b, 0);

  function formatEventTime(event: Event) {
    if (event.is_recurring) {
      return `Her ${DAYS_OF_WEEK[event.recurring_day!]} · ${event.recurring_time?.slice(0, 5)}`;
    }
    if (event.event_date) {
      const d = new Date(event.event_date);
      return `${d.toLocaleDateString('tr-TR')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return '—';
  }

  function renderEvent({ item }: { item: Event }) {
    const count = counts[item.id] ?? 0;
    return (
      <View style={styles.eventCard}>
        <View style={styles.eventCardHeader}>
          <View style={styles.eventBadges}>
            <View style={[styles.publishBadge, item.is_published ? styles.publishedBadge : styles.draftBadge]}>
              <View style={[styles.publishDot, { backgroundColor: item.is_published ? themeColors.success : themeColors.textMuted }]} />
              <Text style={[styles.publishBadgeText, { color: item.is_published ? themeColors.success : themeColors.textMuted }]}>
                {item.is_published ? 'Yayında' : 'Taslak'}
              </Text>
            </View>
            {item.is_recurring && (
              <View style={styles.recurringBadge}>
                <Ionicons name="repeat" size={10} color={themeColors.primary} />
                <Text style={styles.recurringBadgeText}>Düzenli</Text>
              </View>
            )}
          </View>
          <View style={styles.eventActions}>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/admin/participants/${item.id}`)}
              style={styles.actionIcon}
            >
              <Ionicons name="people-outline" size={18} color={themeColors.info} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push(`/(app)/admin/edit/${item.id}`)}
              style={styles.actionIcon}
            >
              <Ionicons name="pencil-outline" size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              style={styles.actionIcon}
            >
              <Ionicons name="trash-outline" size={18} color={themeColors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>

        <View style={styles.eventMeta}>
          <Ionicons name="time-outline" size={13} color={themeColors.textSecondary} />
          <Text style={styles.eventMetaText}>{formatEventTime(item)}</Text>
        </View>

        {item.location && (
          <View style={styles.eventMeta}>
            <Ionicons name="location-outline" size={13} color={themeColors.textSecondary} />
            <Text style={styles.eventMetaText}>{item.location}</Text>
          </View>
        )}

        <View style={styles.eventFooter}>
          <View style={styles.participantChip}>
            <Ionicons name="people" size={13} color={themeColors.primary} />
            <Text style={styles.participantChipText}>
              {count} katılımcı{item.max_capacity ? ` / ${item.max_capacity}` : ''}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.publishToggle, item.is_published ? styles.unpublishToggle : styles.publishToggleBtn]}
            onPress={() => togglePublishMutation.mutate({ id: item.id, current: item.is_published })}
            disabled={togglePublishMutation.isPending}
          >
            <Text style={[styles.publishToggleText, { color: item.is_published ? themeColors.textSecondary : themeColors.success }]}>
              {item.is_published ? 'Gizle' : 'Yayınla'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Paneli</Text>
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: themeColors.surface }]} 
            onPress={handleSyncPoints}
            disabled={syncPointsMutation.isPending}
          >
            {syncPointsMutation.isPending ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <Ionicons name="sync" size={20} color={themeColors.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: themeColors.info }]}
            onPress={() => router.push('/(app)/admin/soz-sende')}
          >
            <Ionicons name="chatbubbles" size={20} color={themeColors.background} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(app)/admin/create')}
          >
            <Ionicons name="add" size={22} color={themeColors.background} />
          </TouchableOpacity>
        </View>
      </View>

      {/* İstatistik Kartları */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard icon="calendar" label="Etkinlik" value={publishedCount} color={themeColors.success} />
          <StatCard icon="chatbubbles" label="Sorular" value={questionsCount} color={themeColors.info} onPress={() => router.push('/(app)/admin/soz-sende')} />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="bulb" label="Etkinlik Önerileri" value={suggestionsCount} color={themeColors.warning} onPress={() => router.push('/(app)/admin/suggestions')} />
          <StatCard icon="chatbox-ellipses" label="Konu Önerileri" value={topicSuggestionsCount} color={themeColors.primary} onPress={() => router.push('/(app)/admin/topic-suggestions')} />
        </View>
        <View style={styles.statsRow}>
          <StatCard icon="business" label="STK Yönetimi" value={organizationsCount} color={themeColors.primaryLight || '#F5C96A'} onPress={() => router.push('/(app)/admin/organizations')} />
          <StatCard icon="people" label="Toplam Katılımcı" value={totalParticipants} color={themeColors.textSecondary} />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={themeColors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={60} color={themeColors.textMuted} />
              <Text style={styles.emptyStateTitle}>Henüz etkinlik yok</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(app)/admin/create')}
              >
                <Text style={styles.createButtonText}>İlk Etkinliği Oluştur</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value, color, onPress }: { icon: string; label: string; value: number; color: string; onPress?: () => void }) {
  const themeColors = useThemeColors();
  const statStyles = React.useMemo(() => createStatStyles(themeColors), [themeColors]);
  return (
    <TouchableOpacity 
      style={statStyles.card} 
      onPress={onPress}
      disabled={!onPress}
    >
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={[statStyles.value, { color }]}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStatStyles = (themeColors: any) => StyleSheet.create({
  card: { flex: 1, backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: themeColors.border },
  value: { fontSize: Typography.fontSize['2xl'], fontWeight: '800' },
  label: { fontSize: Typography.fontSize.xs, color: themeColors.textSecondary, fontWeight: '500' },
});

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: themeColors.border },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center' },
  statsGrid: { padding: Spacing.lg, paddingBottom: 0, gap: Spacing.sm },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },
  listContent: { padding: Spacing.lg },
  eventCard: { backgroundColor: themeColors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: themeColors.border },
  eventCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  eventBadges: { flexDirection: 'row', gap: Spacing.xs },
  publishBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  publishedBadge: { backgroundColor: themeColors.success + '22' },
  draftBadge: { backgroundColor: themeColors.surfaceLight },
  publishDot: { width: 6, height: 6, borderRadius: 3 },
  publishBadgeText: { fontSize: 11, fontWeight: '600' },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: themeColors.primary + '22', paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  recurringBadgeText: { fontSize: 11, color: themeColors.primary, fontWeight: '600' },
  eventActions: { flexDirection: 'row', gap: 4 },
  actionIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: themeColors.surfaceLight },
  eventTitle: { fontSize: Typography.fontSize.md, fontWeight: '700', color: themeColors.textPrimary, marginBottom: Spacing.xs },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  eventMetaText: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary },
  eventFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm, paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: themeColors.border },
  participantChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  participantChipText: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary },
  publishToggle: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1 },
  publishToggleBtn: { borderColor: themeColors.success + '44', backgroundColor: themeColors.success + '11' },
  unpublishToggle: { borderColor: themeColors.border, backgroundColor: themeColors.surfaceLight },
  publishToggleText: { fontSize: Typography.fontSize.sm, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  emptyStateTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: themeColors.textSecondary },
  createButton: { backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  createButtonText: { color: themeColors.background, fontWeight: '700', fontSize: Typography.fontSize.md },
});
