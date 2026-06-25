import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

type TopicSuggestion = {
  id: string;
  title: string;
  description: string | null;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    username: string | null;
  };
};

async function fetchTopicSuggestions(): Promise<TopicSuggestion[]> {
  const { data, error } = await supabase
    .from('topic_suggestions')
    .select('*, profiles(full_name, username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export default function AdminTopicSuggestionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-topic-suggestions'],
    queryFn: fetchTopicSuggestions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TopicSuggestion['status'] }) => {
      const { error } = await supabase
        .from('topic_suggestions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topic-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-topic-suggestions-count'] });
      Alert.alert('Başarılı', 'Konu önerisi durumu güncellendi.');
    },
  });

  // Fikri haftalık sorulara aktarma / ekleme mutasyonu
  const acceptAsQuestionMutation = useMutation({
    mutationFn: async (suggestion: TopicSuggestion) => {
      // 1) Haftalık sorulara ekle
      const { error: insertError } = await supabase
        .from('weekly_questions')
        .insert({
          title: suggestion.title,
          description: suggestion.description || '',
          is_active: true,
          created_by: suggestion.user_id, // Konuyu öneren kişinin adıyla
        });
      if (insertError) throw insertError;

      // 2) Öneriyi kabul edildi (accepted) yap
      const { error: updateError } = await supabase
        .from('topic_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestion.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-topic-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-topic-suggestions-count'] });
      queryClient.invalidateQueries({ queryKey: ['weekly_questions'] });
      Alert.alert('Başarılı 🎉', 'Öneri onaylandı ve haftalık tartışma konusu olarak eklendi!');
    },
    onError: (err: any) => {
      Alert.alert('Hata', 'İşlem gerçekleştirilemedi: ' + err.message);
    }
  });

  function renderSuggestion({ item }: { item: TopicSuggestion }) {
    const statusColors = {
      pending: themeColors.info,
      reviewed: themeColors.textSecondary,
      accepted: themeColors.success,
      rejected: themeColors.error,
    };

    const statusLabels = {
      pending: 'Bekliyor',
      reviewed: 'İncelendi',
      accepted: 'Kabul Edildi',
      rejected: 'Reddedildi',
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[item.status] + '22' }]}>
            <Text style={[styles.statusText, { color: statusColors[item.status] }]}>
              {statusLabels[item.status]}
            </Text>
          </View>
          <Text style={styles.dateText}>
            {new Date(item.created_at).toLocaleDateString('tr-TR')}
          </Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>
        {item.description && <Text style={styles.desc}>{item.description}</Text>}

        <View style={styles.metaRow}>
          <Ionicons name="person-outline" size={14} color={themeColors.textSecondary} />
          <Text style={styles.metaText}>
            Öneren: {item.profiles.full_name} (@{item.profiles.username || '—'})
          </Text>
        </View>

        <View style={styles.actions}>
          {item.status !== 'accepted' && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: themeColors.success, backgroundColor: themeColors.success + '11' }]}
              onPress={() => acceptAsQuestionMutation.mutate(item)}
              disabled={acceptAsQuestionMutation.isPending}
            >
              <Ionicons name="checkmark-circle" size={18} color={themeColors.success} />
              <Text style={styles.actionBtnText}>Onayla & Yayınla</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'rejected' && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: themeColors.error, backgroundColor: themeColors.error + '11' }]}
              onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'rejected' })}
            >
              <Ionicons name="close-circle" size={18} color={themeColors.error} />
            </TouchableOpacity>
          )}
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: themeColors.textSecondary, backgroundColor: themeColors.surfaceLight }]}
              onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'reviewed' })}
            >
              <Ionicons name="eye-outline" size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tartışma Önerileri</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderSuggestion}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bulb-outline" size={64} color={themeColors.textMuted} />
              <Text style={styles.emptyText}>Henüz tartışma önerisi bulunmuyor.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg },
  card: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  dateText: { fontSize: 11, color: themeColors.textMuted },
  title: { fontSize: 18, fontWeight: '700', color: themeColors.textPrimary, marginBottom: 4 },
  desc: { fontSize: 14, color: themeColors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: themeColors.textMuted },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: themeColors.success,
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: Spacing.md },
  emptyText: { fontSize: Typography.fontSize.lg, color: themeColors.textMuted, fontWeight: '600' },
});
