import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import NotificationBell from '@/components/NotificationBell';

type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
};

export async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchActiveEventsCount(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('events')
    .select('organization_id')
    .eq('is_published', true);

  if (error) throw error;

  const counts: Record<string, number> = {};
  (data ?? []).forEach((e: { organization_id: string | null }) => {
    if (e.organization_id) {
      counts[e.organization_id] = (counts[e.organization_id] ?? 0) + 1;
    }
  });
  return counts;
}

export default function EventsScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const { profile } = useAuthStore();

  // Öneri durumu
  const [showSuggestModal, setShowSuggestModal] = React.useState(false);
  const [suggestForm, setSuggestForm] = React.useState({
    title: '',
    description: '',
    location: '',
  });
  const [titleError, setTitleError] = React.useState(false);

  const { data: organizations = [], isLoading: isOrgLoading, refetch: refetchOrgs, isRefetching: isRefetchingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: fetchOrganizations,
  });

  const { data: eventCounts = {}, isLoading: isCountsLoading, refetch: refetchCounts } = useQuery({
    queryKey: ['active-events-counts'],
    queryFn: fetchActiveEventsCount,
  });

  const suggestMutation = useMutation({
    mutationFn: async (formData: typeof suggestForm) => {
      const { error } = await supabase.from('event_suggestions').insert({
        user_id: profile!.id,
        title: formData.title,
        description: formData.description,
        location: formData.location,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowSuggestModal(false);
      setSuggestForm({ title: '', description: '', location: '' });
      setTitleError(false);
    },
    onError: () => {
      // Sessiz hata — kullanıcı tekrar deneyebilir
    }
  });

  const handleSuggestSubmit = () => {
    if (!suggestForm.title.trim()) {
      setTitleError(true);
      return;
    }
    setTitleError(false);
    suggestMutation.mutate(suggestForm);
  };

  const handleRefresh = async () => {
    await Promise.all([refetchOrgs(), refetchCounts()]);
  };

  const renderOrgCard = ({ item }: { item: Organization }) => {
    const activeCount = eventCounts[item.id] ?? 0;
    const initials = item.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.card}
        onPress={() => router.push(`/(app)/events/org/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={styles.cardInfo}>
          {item.logo_url ? (
            <Image source={{ uri: item.logo_url }} style={styles.logo} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarPlaceholderText}>{initials}</Text>
            </View>
          )}

          <View style={styles.textContainer}>
            <Text style={styles.orgName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.orgDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.eventCountRow}>
              <Ionicons 
                name="calendar-outline" 
                size={14} 
                color={activeCount > 0 ? themeColors.primary : themeColors.textMuted} 
              />
              <Text style={[
                styles.eventCountText,
                activeCount > 0 ? { color: themeColors.primary, fontWeight: '700' } : { color: themeColors.textMuted }
              ]}>
                {activeCount > 0 ? `${activeCount} Aktif Etkinlik` : 'Etkinlik Yok'}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={themeColors.textMuted} />
      </TouchableOpacity>
    );
  };

  const isLoading = isOrgLoading || isCountsLoading;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Etkinlikler</Text>
        </View>
        <View style={styles.headerActions}>
          <NotificationBell />
          {profile?.role === 'admin' && (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => router.push('/(app)/admin/organizations')}
            >
              <Ionicons name="add-circle-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={organizations}
        keyExtractor={(item) => item.id}
        renderItem={renderOrgCard}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetchingOrgs}
            onRefresh={handleRefresh}
            tintColor={themeColors.primary}
          />
        }
        ListHeaderComponent={() => (
          <>
            {/* Bilgi Bannerı */}
            <View style={styles.infoBanner}>
              <View style={styles.infoBannerIcon}>
                <Ionicons name="information-circle" size={18} color={themeColors.primary} />
              </View>
              <Text style={styles.infoBannerText}>
                Bu etkinlikler <Text style={styles.istanbulVurgu}>İstanbul'da</Text> üniversite okuyan öğrenciler içindir.
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Ionicons name="business-outline" size={18} color={themeColors.primary} />
              <Text style={styles.sectionTitle}>Etkinlik Paylaşan Kurumlar</Text>
            </View>
          </>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={60} color={themeColors.textMuted} />
            <Text style={styles.emptyStateTitle}>Henüz kurum eklenmemiş</Text>
            <Text style={styles.emptyStateSubtitle}>
              Etkinlik düzenleyen sivil toplum kuruluşları yakında burada listelenecektir.
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Floating Öneri Butonu */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowSuggestModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="bulb-outline" size={24} color="#fff" />
        <Text style={styles.fabText}>Etkinlik Öner</Text>
      </TouchableOpacity>

      {/* Öneri Modalı */}
      <Modal
        visible={showSuggestModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuggestModal(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Etkinlik Öner</Text>
              <TouchableOpacity onPress={() => setShowSuggestModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Başlık *</Text>
                <TextInput
                  style={[styles.input, titleError && { borderColor: '#EF4444', borderWidth: 1.5 }]}
                  placeholder="Hangi etkinliği önerirsin?"
                  placeholderTextColor={themeColors.textMuted}
                  value={suggestForm.title}
                  onChangeText={(v) => { setSuggestForm(prev => ({ ...prev, title: v })); if (v.trim()) setTitleError(false); }}
                />
                {titleError && (
                  <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2 }}>Bu alan zorunludur</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Açıklama</Text>
                <TextInput
                  style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                  placeholder="Etkinlik hakkında detaylar..."
                  placeholderTextColor={themeColors.textMuted}
                  value={suggestForm.description}
                  onChangeText={(v) => setSuggestForm(prev => ({ ...prev, description: v }))}
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Konum (Opsiyonel)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nerede yapılmalı?"
                  placeholderTextColor={themeColors.textMuted}
                  value={suggestForm.location}
                  onChangeText={(v) => setSuggestForm(prev => ({ ...prev, location: v }))}
                />
              </View>

              <TouchableOpacity 
                style={[styles.submitBtn, suggestMutation.isPending && { opacity: 0.7 }]}
                onPress={handleSuggestSubmit}
                disabled={suggestMutation.isPending}
              >
                {suggestMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Öneriyi Gönder</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
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
  adminButton: {
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
  logo: { width: 60, height: 60, borderRadius: BorderRadius.md, backgroundColor: '#f0f0f0' },
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
    fontSize: 18,
  },
  textContainer: { flex: 1, gap: 4 },
  orgName: { fontSize: 16, fontWeight: '800', color: themeColors.textPrimary },
  orgDesc: { fontSize: 12, color: themeColors.textSecondary, lineHeight: 16, fontWeight: '500' },
  eventCountRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  eventCountText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  emptyStateTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: themeColors.textSecondary, marginTop: Spacing.md },
  emptyStateSubtitle: { fontSize: Typography.fontSize.md, color: themeColors.textMuted, textAlign: 'center', marginTop: Spacing.xs, paddingHorizontal: Spacing.xl },
  
  // Öneri Stilleri
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: themeColors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    elevation: 5,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    gap: 8,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary },
  form: { gap: Spacing.md },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: themeColors.textSecondary },
  input: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: themeColors.textPrimary,
    fontSize: 15,
  },
  submitBtn: {
    backgroundColor: themeColors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary + '08',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.primary + '15',
    gap: Spacing.sm,
  },
  infoBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: themeColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: themeColors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  istanbulVurgu: {
    fontWeight: '900',
    color: themeColors.primary,
  },
});
