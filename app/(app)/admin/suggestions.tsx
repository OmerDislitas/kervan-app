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
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type Suggestion = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    username: string | null;
  };
};

async function fetchSuggestions(): Promise<Suggestion[]> {
  const { data, error } = await supabase
    .from('event_suggestions')
    .select('*, profiles(full_name, username)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as any;
}

export default function AdminSuggestionsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-suggestions'],
    queryFn: fetchSuggestions,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Suggestion['status'] }) => {
      const { error } = await supabase
        .from('event_suggestions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] });
      Alert.alert('Başarılı', 'Öneri durumu güncellendi.');
    },
  });

  function renderSuggestion({ item }: { item: Suggestion }) {
    const statusColors = {
      pending: Colors.info,
      reviewed: Colors.secondary,
      approved: Colors.success,
      rejected: Colors.error,
    };

    const statusLabels = {
      pending: 'Bekliyor',
      reviewed: 'İncelendi',
      approved: 'Onaylandı',
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
          <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>
            {item.profiles.full_name} (@{item.profiles.username || '—'})
          </Text>
        </View>

        {item.location && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.metaText}>{item.location}</Text>
          </View>
        )}

        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: Colors.success }]}
            onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'approved' })}
          >
            <Ionicons name="checkmark" size={18} color={Colors.success} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: Colors.error }]}
            onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'rejected' })}
          >
            <Ionicons name="close" size={18} color={Colors.error} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { borderColor: Colors.secondary }]}
            onPress={() => updateStatusMutation.mutate({ id: item.id, status: 'reviewed' })}
          >
            <Ionicons name="eye-outline" size={18} color={Colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Etkinlik Önerileri</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.id}
          renderItem={renderSuggestion}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bulb-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Henüz öneri bulunmuyor.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
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
  dateText: { fontSize: 11, color: Colors.textMuted },
  title: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  desc: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  metaText: { fontSize: 13, color: Colors.textMuted },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: Spacing.md },
  emptyText: { fontSize: Typography.fontSize.lg, color: Colors.textMuted, fontWeight: '600' },
});
