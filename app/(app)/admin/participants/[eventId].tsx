import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

type Participant = {
  reg_id: string;
  registered_at: string;
  full_name: string;
  email: string;
  phone: string | null;
  university_name: string | null;
  department: string | null;
  university_year: string | null;
  gender: 'male' | 'female';
};

type EventInfo = {
  title: string;
  max_capacity: number | null;
};

async function fetchParticipants(eventId: string): Promise<Participant[]> {
  const { data, error } = await supabase.rpc('get_event_participants', {
    p_event_id: eventId,
  });
  if (error) throw error;
  return (data ?? []) as Participant[];
}

async function fetchEventInfo(eventId: string): Promise<EventInfo> {
  const { data, error } = await supabase
    .from('events')
    .select('title, max_capacity')
    .eq('id', eventId)
    .single();
  if (error) throw error;
  return data;
}

export default function ParticipantsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  const { data: eventInfo } = useQuery({
    queryKey: ['event-info', eventId],
    queryFn: () => fetchEventInfo(eventId),
  });

  const { data: participants = [], isLoading } = useQuery({
    queryKey: ['participants', eventId],
    queryFn: () => fetchParticipants(eventId),
  });

  function renderParticipant({ item, index }: { item: Participant; index: number }) {
    const genderColor = item.gender === 'male' ? Colors.male : Colors.female;
    const genderIcon = item.gender === 'male' ? 'male' : 'female';

    return (
      <View style={styles.participantCard}>
        <View style={styles.participantLeft}>
          <View style={[styles.avatar, { borderColor: genderColor }]}>
            <Text style={styles.avatarText}>
              {item.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </Text>
            <View style={[styles.genderDot, { backgroundColor: genderColor }]}>
              <Ionicons name="person-outline" size={8} color="#fff" />
            </View>
          </View>
        </View>
        <View style={styles.participantContent}>
          <View style={styles.participantNameRow}>
            <Text style={styles.participantName}>{item.full_name}</Text>
            <Text style={styles.participantNumber}>#{index + 1}</Text>
          </View>
          <Text style={styles.participantEmail}>{item.email}</Text>
          {item.university_name && (
            <Text style={styles.participantMeta} numberOfLines={1}>
              {item.university_name} · {item.department} · {item.university_year}
            </Text>
          )}
          {item.phone && (
            <View style={styles.phoneRow}>
              <Ionicons name="call-outline" size={12} color={Colors.textMuted} />
              <Text style={styles.participantMeta}>{item.phone}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>Katılımcılar</Text>
          {eventInfo?.title && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>{eventInfo.title}</Text>
          )}
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Özet */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{participants.length}</Text>
          <Text style={styles.summaryLabel}>Kayıtlı</Text>
        </View>
        {eventInfo?.max_capacity && (
          <>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{eventInfo.max_capacity}</Text>
              <Text style={styles.summaryLabel}>Kontenjan</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: eventInfo.max_capacity - participants.length <= 0 ? Colors.error : Colors.success }]}>
                {Math.max(0, eventInfo.max_capacity - participants.length)}
              </Text>
              <Text style={styles.summaryLabel}>Boş</Text>
            </View>
          </>
        )}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.male }]}>
            {participants.filter((p) => p.gender === 'male').length}
          </Text>
          <Text style={styles.summaryLabel}>Erkek</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: Colors.female }]}>
            {participants.filter((p) => p.gender === 'female').length}
          </Text>
          <Text style={styles.summaryLabel}>Kadın</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.reg_id}
          renderItem={renderParticipant}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={60} color={Colors.textMuted} />
              <Text style={styles.emptyStateTitle}>Henüz katılımcı yok</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: Spacing.sm },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: Colors.textPrimary },
  headerSubtitle: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary },
  summaryBar: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  summaryLabel: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  listContent: { padding: Spacing.lg },
  participantCard: { flexDirection: 'row', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
  participantLeft: { alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 2, position: 'relative' },
  avatarText: { fontSize: Typography.fontSize.md, fontWeight: '700', color: Colors.textPrimary },
  genderDot: { position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: Colors.surface },
  participantContent: { flex: 1 },
  participantNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  participantName: { fontSize: Typography.fontSize.md, fontWeight: '700', color: Colors.textPrimary },
  participantNumber: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, fontWeight: '600' },
  participantEmail: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  participantMeta: { fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  emptyStateTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: Colors.textSecondary },
});
