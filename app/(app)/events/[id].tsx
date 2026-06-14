import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { DAYS_OF_WEEK, EVENT_CATEGORIES } from '@/constants/data';
import { scheduleEventReminder, cancelEventReminder } from '@/lib/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

async function fetchEventDetail(id: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*, organizations(name, logo_url)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

async function fetchRegistration(eventId: string, userId: string) {
  const { data } = await supabase
    .from('event_registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

async function fetchParticipantCount(eventId: string) {
  const { count } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'active');
  return count ?? 0;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [showGenderModal, setShowGenderModal] = useState(false);

  React.useEffect(() => {
    AsyncStorage.setItem('@kervan_last_event_view', Date.now().toString()).catch(() => {});
  }, []);

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEventDetail(id),
  });

  const { data: registration } = useQuery({
    queryKey: ['registration', id, profile?.id],
    queryFn: () => fetchRegistration(id, profile!.id),
    enabled: !!profile?.id,
  });

  const { data: participantCount = 0 } = useQuery({
    queryKey: ['participant-count', id],
    queryFn: () => fetchParticipantCount(id),
  });

  const isRegistered = registration?.status === 'active';
  const isFull = event?.max_capacity !== null && participantCount >= (event?.max_capacity ?? 0);

  const getCategoryColor = () => {
    const categoryKey = event?.category as keyof typeof themeColors.categories;
    return themeColors.categories[categoryKey] || themeColors.primary;
  };

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Kullanıcı oturumu bulunamadı.');
      if (registration) {
        // Güncelle
        const { error } = await supabase
          .from('event_registrations')
          .update({ status: 'active' })
          .eq('id', registration.id);
        if (error) throw error;
      } else {
        // Yeni kayıt
        const { error } = await supabase
          .from('event_registrations')
          .insert({ event_id: id, user_id: profile.id, status: 'active' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-count', id] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['participant-counts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profile?.id] });
      // Supabase trigger puanı güncelledi, store'u senkronize et
      if (profile?.id) {
        useAuthStore.getState().fetchProfile(profile.id);
      }
      // Bildirim planla (tek seferlik etkinlikler için)
      if (event?.event_date) {
        scheduleEventReminder({
          id,
          title: event.title,
          event_date: event.event_date,
          location: event.location,
        });
      }
      Alert.alert('✅ Kayıt Başarılı', `"${event?.title}" etkinliğine kayıt oldun!`);
    },
    onError: (err: any) => {
      console.error('[JoinMutation] Hata:', err);
      Alert.alert(
        'Kayıt Başarısız',
        err?.message ?? 'Bilinmeyen hata. Lütfen tekrar deneyin.',
        [{ text: 'Tamam' }]
      );
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('id', registration!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registration', id] });
      queryClient.invalidateQueries({ queryKey: ['participant-count', id] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      queryClient.invalidateQueries({ queryKey: ['participant-counts'] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profile?.id] });
      // Supabase trigger puanı güncelledi, store'u senkronize et
      if (profile?.id) {
        useAuthStore.getState().fetchProfile(profile.id);
      }
      // Zamanlanmış bildirimi iptal et
      cancelEventReminder(id);
    },
    onError: (err: any) => {
      console.error('[LeaveMutation] Hata:', err);
      Alert.alert('Hata', err?.message ?? 'İşlem gerçekleştirilemedi.');
    },
  });

  const handleJoin = () => {
    // Cinsiyet kısıtlaması kontrolü
    if (event?.gender_restriction && event.gender_restriction !== profile?.gender) {
      setShowGenderModal(true);
      return;
    }
    if (isFull) {
      Alert.alert('Kontenjan Dolu', 'Bu etkinlik için kontenjan dolmuştur.');
      return;
    }
    joinMutation.mutate();
  };

  const handleLeave = () => {
    Alert.alert(
      'Etkinlikten Ayrıl',
      'Bu etkinliğe katılımınızı iptal etmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Evet, Ayrıl', style: 'destructive', onPress: () => leaveMutation.mutate() },
      ]
    );
  };

  function formatEventDate(dateStr: string) {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    };
    return date.toLocaleDateString('tr-TR', options);
  }

  if (isLoading || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor();
  const capacityPercent = event.max_capacity
    ? Math.min((participantCount / event.max_capacity) * 100, 100)
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Etkinlik Detayı</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Dynamic Glow Background */}
        <View style={[styles.detailGlow, { backgroundColor: categoryColor + '10' }]} />

        {/* Badges */}
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '22' }]}>
            <Ionicons
              name={(EVENT_CATEGORIES.find(c => c.value === event.category)?.icon as any) || 'star'}
              size={12}
              color={categoryColor}
            />
            <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
              {EVENT_CATEGORIES.find(c => c.value === event.category)?.label || 'Etkinlik'}
            </Text>
          </View>
          {event.is_recurring && (
            <View style={styles.recurringBadge}>
              <Ionicons name="repeat" size={12} color={themeColors.primary} />
              <Text style={styles.recurringBadgeText}>Düzenli Etkinlik</Text>
            </View>
          )}
          {event.gender_restriction && (
            <View style={[
              styles.genderBadge,
              { backgroundColor: event.gender_restriction === 'male' ? themeColors.male + '22' : themeColors.female + '22' }
            ]}>
              <Text style={[styles.genderBadgeText, {
                color: event.gender_restriction === 'male' ? themeColors.male : themeColors.female
              }]}>
                {event.gender_restriction === 'male' ? 'Erkeklere Özel' : 'Kadınlara Özel'}
              </Text>
            </View>
          )}
        </View>

        {/* Başlık */}
        <Text style={styles.title}>{event.title}</Text>

        {/* Bilgi Kartları */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={[styles.infoIconWrap, { backgroundColor: categoryColor + '22' }]}>
              <Ionicons name="time" size={20} color={categoryColor} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>
                {event.is_recurring ? 'Tekrarlama' : 'Tarih & Saat'}
              </Text>
              <Text style={styles.infoValue}>
                {event.is_recurring
                  ? `Her ${DAYS_OF_WEEK[event.recurring_day!]} · ${event.recurring_time?.slice(0, 5)}`
                  : formatEventDate(event.event_date!)}
              </Text>
            </View>
          </View>

          {event.location && (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: Spacing.md }]}>
              <View style={[styles.infoIconWrap, { backgroundColor: categoryColor + '22' }]}>
                <Ionicons name="location" size={20} color={categoryColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Konum</Text>
                <Text style={styles.infoValue}>{event.location}</Text>
              </View>
            </View>
          )}

          {event.organizations && (
            <View style={[styles.infoRow, { borderTopWidth: 1, borderTopColor: themeColors.border, paddingTop: Spacing.md }]}>
              <View style={[styles.infoIconWrap, { backgroundColor: categoryColor + '22' }]}>
                <Ionicons name="business" size={20} color={categoryColor} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Düzenleyen Kurum / STK</Text>
                <Text style={styles.infoValue}>{event.organizations.name}</Text>
              </View>
            </View>
          )}


        </View>



        {/* Açıklama */}
        {event.description && (
          <View style={styles.descriptionSection}>
            <Text style={styles.descriptionTitle}>Etkinlik Hakkında</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}
      </ScrollView>

      {/* Alt Buton */}
      <View style={styles.bottomBar}>
        {isRegistered ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.leaveButton]}
            onPress={handleLeave}
            disabled={leaveMutation.isPending}
            activeOpacity={0.85}
          >
            {leaveMutation.isPending ? (
              <ActivityIndicator color={themeColors.error} />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={20} color={themeColors.error} />
                <Text style={[styles.actionButtonText, { color: themeColors.error }]}>Etkinlikten Ayrıl</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.joinButton, (isFull) && styles.disabledButton, !isFull && { backgroundColor: categoryColor, shadowColor: categoryColor }]}
            onPress={handleJoin}
            disabled={joinMutation.isPending || isFull}
            activeOpacity={0.85}
          >
            {joinMutation.isPending ? (
              <ActivityIndicator color={themeColors.background} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={themeColors.background} />
                <Text style={styles.actionButtonText}>
                  {isFull ? 'Kontenjan Dolu' : 'Etkinliğe Katıl'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Cinsiyet Uyarı Modal */}
      <Modal visible={showGenderModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconWrap}>
              <Ionicons
                name="alert-circle-outline"
                size={40}
                color={event.gender_restriction === 'male' ? themeColors.male : themeColors.female}
              />
            </View>
            <Text style={styles.modalTitle}>Katılamazsın</Text>
            <Text style={styles.modalMessage}>
              Bu etkinlik{' '}
              <Text style={{ color: themeColors.primary, fontWeight: '700' }}>
                {event.gender_restriction === 'male' ? 'erkeklere' : 'kadınlara'}
              </Text>{' '}
              özel olarak düzenlenmiştir. Katılım sağlayamazsın.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.modalButtonText}>Anladım</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.lg, paddingBottom: 100 },
  detailGlow: {
    position: 'absolute',
    top: 60,
    right: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    zIndex: 0,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg, position: 'relative', zIndex: 2 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.md, flexWrap: 'wrap', position: 'relative', zIndex: 2 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  categoryBadgeText: { fontSize: 12, fontWeight: '700' },
  recurringBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: themeColors.primary + '22', paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  recurringBadgeText: { fontSize: 12, color: themeColors.primary, fontWeight: '600' },
  genderBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  genderBadgeText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', color: themeColors.textPrimary, marginBottom: Spacing.lg, lineHeight: 32, position: 'relative', zIndex: 2 },
  infoCard: { backgroundColor: themeColors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: themeColors.border, gap: Spacing.md, position: 'relative', zIndex: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  infoIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: Typography.fontSize.xs, color: themeColors.textSecondary, marginBottom: 2, fontWeight: '500' },
  infoValue: { fontSize: Typography.fontSize.md, color: themeColors.textPrimary, fontWeight: '600' },
  descriptionSection: { backgroundColor: themeColors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: themeColors.border, position: 'relative', zIndex: 2 },
  descriptionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary, marginBottom: Spacing.sm },
  descriptionText: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, lineHeight: 24 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: themeColors.background, borderTopWidth: 1, borderTopColor: themeColors.border, zIndex: 10 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, height: 54, borderRadius: BorderRadius.md },
  joinButton: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  leaveButton: { backgroundColor: themeColors.error + '22', borderWidth: 1, borderColor: themeColors.error + '44' },
  disabledButton: { backgroundColor: themeColors.surfaceLight, shadowOpacity: 0 },
  actionButtonText: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.background },
  modalOverlay: { flex: 1, backgroundColor: themeColors.overlay, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  modalContainer: { backgroundColor: themeColors.surface, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', width: '100%', borderWidth: 1, borderColor: themeColors.border },
  modalIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: themeColors.surfaceLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary, marginBottom: Spacing.sm },
  modalMessage: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg },
  modalButton: { backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.xl, paddingVertical: 12 },
  modalButtonText: { fontSize: Typography.fontSize.md, fontWeight: '700', color: themeColors.background },
});