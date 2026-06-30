import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Modal, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { DAYS_OF_WEEK, EVENT_CATEGORIES } from '@/constants/data';
import DatePickerModal from '@/components/DatePickerModal';
import TimePickerModal from '@/components/TimePickerModal';

type EventLink = {
  label: string;
  url: string;
};

type EventForm = {
  title: string;
  description: string;
  location: string;
  isRecurring: boolean;
  eventDate: string;    // YYYY-MM-DD
  eventTime: string;    // HH:MM
  recurringDay: number | null;
  recurringTime: string;
  genderRestriction: 'male' | 'female' | null;
  maxCapacity: string;  // boş = limitsiz
  isPublished: boolean;
  category: string;
  organizationId: string;
  links: EventLink[];
};

import { useQuery } from '@tanstack/react-query';

export default function CreateEventScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile } = useAuthStore();

  const [form, setForm] = useState<EventForm>({
    title: '',
    description: '',
    location: '',
    isRecurring: false,
    eventDate: '',
    eventTime: '',
    recurringDay: null,
    recurringTime: '',
    genderRestriction: null,
    maxCapacity: '',
    isPublished: true,
    category: 'other',
    organizationId: '',
    links: [],
  });

  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  const [showDayModal, setShowDayModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecurringTimePicker, setShowRecurringTimePicker] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);

  const { data: organizations = [] } = useQuery<any[]>({
    queryKey: ['admin-organizations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').order('name');
      if (error) throw error;
      return data ?? [];
    }
  });

  const update = (key: keyof EventForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const createMutation = useMutation({
    mutationFn: async () => {
      let event_date: string | null = null;

      if (!form.organizationId) {
        throw new Error('STK / Kurum seçilmesi zorunludur.');
      }

      if (!form.isRecurring) {
        if (!form.eventDate || !form.eventTime) {
          throw new Error('Tarih ve saat zorunludur.');
        }
        const [y, m, d] = form.eventDate.split('-').map(Number);
        const [hh, mm] = form.eventTime.split(':').map(Number);
        const localDate = new Date(y, m - 1, d, hh, mm);
        event_date = localDate.toISOString();
      } else {
        if (form.recurringDay === null || !form.recurringTime) {
          throw new Error('Gün ve saat zorunludur.');
        }
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        event_date,
        is_recurring: form.isRecurring,
        recurring_day: form.isRecurring ? form.recurringDay : null,
        recurring_time: form.isRecurring ? `${form.recurringTime}:00` : null,
        gender_restriction: form.genderRestriction,
        max_capacity: form.maxCapacity ? parseInt(form.maxCapacity, 10) : null,
        created_by: profile!.id,
        is_published: form.isPublished,
        category: form.category,
        organization_id: form.organizationId,
        links: form.links,
      };

      const { data, error } = await supabase.from('events').insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      // STK kart sayacını ve org etkinlik listesini güncelle
      queryClient.invalidateQueries({ queryKey: ['active-events-counts'] });
      queryClient.invalidateQueries({ queryKey: ['org-events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events-home'] });
      Alert.alert('Başarılı', 'Etkinlik oluşturuldu!', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.message ?? 'Etkinlik oluşturulamadı.');
    },
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      Alert.alert('Eksik Bilgi', 'Etkinlik başlığı zorunludur.');
      return;
    }
    createMutation.mutate();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Etkinlik Oluştur</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Başlık */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Başlık *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Etkinlik başlığı"
                placeholderTextColor={themeColors.textMuted}
                value={form.title}
                onChangeText={(v) => update('title', v)}
              />
            </View>
          </View>

          {/* Kategori Seçimi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Etkinlik Türü *</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
              <Ionicons
                name={(EVENT_CATEGORIES.find(c => c.value === form.category)?.icon as any) || 'star'}
                size={17}
                color={themeColors.categories[form.category as keyof typeof themeColors.categories] || themeColors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.selectText, { color: themeColors.textPrimary }]}>
                {EVENT_CATEGORIES.find(c => c.value === form.category)?.label || 'Seçiniz'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* STK / Kurum Seçimi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>STK / Kurum *</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowOrgModal(true)}>
              <Ionicons name="business-outline" size={17} color={themeColors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.selectText, form.organizationId ? { color: themeColors.textPrimary } : {}]}>
                {organizations.find(o => o.id === form.organizationId)?.name || 'STK / Kurum seçin'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Açıklama */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Açıklama</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: Spacing.sm }]}>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Etkinlik hakkında kısa bir açıklama..."
                placeholderTextColor={themeColors.textMuted}
                value={form.description}
                onChangeText={(v) => update('description', v)}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Konum */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konum</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={17} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Örn: Kampüs kafeteryası"
                placeholderTextColor={Colors.textMuted}
                value={form.location}
                onChangeText={(v) => update('location', v)}
              />
            </View>
          </View>

          {/* Düzenli mi? */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Haftalık Tekrarlayan Etkinlik</Text>
              <Text style={styles.labelSub}>Kapalıysa tek seferlik</Text>
            </View>
            <Switch
              value={form.isRecurring}
              onValueChange={(v) => update('isRecurring', v)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={themeColors.textPrimary}
            />
          </View>

          {/* Tek seferlik tarih/saat */}
          {!form.isRecurring && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tarih *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.eventDate ? { color: themeColors.textPrimary } : {}]}>
                    {form.eventDate
                      ? (() => {
                          const [y, m, d] = form.eventDate.split('-');
                          const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
                          return `${d} ${months[parseInt(m)-1]} ${y}`;
                        })()
                      : 'Tarih seçin'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Saat *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.eventTime ? { color: themeColors.textPrimary } : {}]}>
                    {form.eventTime || 'Saat seçin'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Tekrarlayan gün/saat */}
          {form.isRecurring && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gün *</Text>
                <TouchableOpacity style={styles.selectButton} onPress={() => setShowDayModal(true)}>
                  <Ionicons name="calendar-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.recurringDay !== null ? { color: themeColors.textPrimary } : {}]}>
                    {form.recurringDay !== null ? DAYS_OF_WEEK[form.recurringDay] : 'Gün seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Saat *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowRecurringTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.recurringTime ? { color: themeColors.textPrimary } : {}]}>
                    {form.recurringTime || 'Saat seçin'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={themeColors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Cinsiyet Kısıtlaması */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cinsiyet Kısıtlaması</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowGenderModal(true)}>
              <Ionicons name="people-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.selectText, form.genderRestriction ? { color: themeColors.textPrimary } : {}]}>
                {form.genderRestriction === 'male' ? 'Sadece Erkekler'
                  : form.genderRestriction === 'female' ? 'Sadece Kadınlar'
                  : 'Kısıtlama yok (Herkese açık)'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Kontenjan */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kontenjan (Opsiyonel)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="people-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Boş bırakılırsa limitsiz"
                placeholderTextColor={themeColors.textMuted}
                value={form.maxCapacity}
                onChangeText={(v) => update('maxCapacity', v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
              />
            </View>
          </View>

          {/* Linkler */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bağlantı Linkleri (Opsiyonel)</Text>
            <Text style={styles.labelSub}>Harita, kayıt formu, burs başvurusu vb. linkler ekleyin</Text>

            {/* Mevcut linkler */}
            {form.links.map((link, idx) => (
              <View key={idx} style={styles.linkItem}>
                <Ionicons name="link-outline" size={16} color={themeColors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>{link.label}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => update('links', form.links.filter((_, i) => i !== idx))}
                  style={styles.linkRemoveBtn}
                >
                  <Ionicons name="close-circle" size={20} color={themeColors.error ?? '#ef4444'} />
                </TouchableOpacity>
              </View>
            ))}

            {/* Yeni link ekleme */}
            <View style={styles.linkAddContainer}>
              <View style={[styles.inputWrapper, { flex: 1, marginRight: 0, marginBottom: 8 }]}>
                <Ionicons name="pricetag-outline" size={15} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.input, { minHeight: 44 }]}
                  placeholder="Başlık (ör: Harita, Kayıt)"
                  placeholderTextColor={themeColors.textMuted}
                  value={newLinkLabel}
                  onChangeText={setNewLinkLabel}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Ionicons name="globe-outline" size={15} color={themeColors.textSecondary} style={{ marginRight: 6 }} />
                  <TextInput
                    style={[styles.input, { minHeight: 44 }]}
                    placeholder="https://..."
                    placeholderTextColor={themeColors.textMuted}
                    value={newLinkUrl}
                    onChangeText={setNewLinkUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity
                  style={styles.linkAddBtn}
                  onPress={() => {
                    const label = newLinkLabel.trim();
                    const url = newLinkUrl.trim();
                    if (!label || !url) {
                      Alert.alert('Eksik', 'Başlık ve URL giriniz.');
                      return;
                    }
                    const finalUrl = url.startsWith('http') ? url : `https://${url}`;
                    update('links', [...form.links, { label, url: finalUrl }]);
                    setNewLinkLabel('');
                    setNewLinkUrl('');
                  }}
                >
                  <Ionicons name="add" size={22} color={themeColors.background} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Yayınla toggle */}
          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Hemen Yayınla</Text>
              <Text style={styles.labelSub}>Kapalıysa taslak olarak kaydedilir</Text>
            </View>
            <Switch
              value={form.isPublished}
              onValueChange={(v) => update('isPublished', v)}
              trackColor={{ false: themeColors.border, true: themeColors.success }}
              thumbColor={themeColors.textPrimary}
            />
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            style={[styles.submitButton, createMutation.isPending && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={createMutation.isPending}
            activeOpacity={0.85}
          >
            {createMutation.isPending ? (
              <ActivityIndicator color={themeColors.background} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={themeColors.background} />
                <Text style={styles.submitButtonText}>
                  {form.isPublished ? 'Oluştur ve Yayınla' : 'Taslak Olarak Kaydet'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Gün Modal */}
      <Modal visible={showDayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gün Seç</Text>
              <TouchableOpacity onPress={() => setShowDayModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            {DAYS_OF_WEEK.map((day, i) => (
              <TouchableOpacity
                key={day}
                style={[styles.modalItem, form.recurringDay === i && styles.modalItemSelected]}
                onPress={() => { update('recurringDay', i); setShowDayModal(false); }}
              >
                <Text style={[styles.modalItemText, form.recurringDay === i && { color: themeColors.primary }]}>{day}</Text>
                {form.recurringDay === i && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Cinsiyet Modal */}
      <Modal visible={showGenderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cinsiyet Kısıtlaması</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            {[
              { label: 'Herkese Açık', value: null, icon: 'people-outline' },
              { label: 'Sadece Erkekler', value: 'male', icon: 'shield-outline' },
              { label: 'Sadece Kadınlar', value: 'female', icon: 'shield-outline' },
            ].map((opt) => (
              <TouchableOpacity
                key={String(opt.value)}
                style={[styles.modalItem, form.genderRestriction === opt.value && styles.modalItemSelected]}
                onPress={() => { update('genderRestriction', opt.value); setShowGenderModal(false); }}
              >
                <Ionicons name={opt.icon as any} size={18} color={themeColors.textSecondary} />
                <Text style={[styles.modalItemText, form.genderRestriction === opt.value && { color: themeColors.primary }]}>{opt.label}</Text>
                {form.genderRestriction === opt.value && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Tarih Picker */}
      <DatePickerModal
        visible={showDatePicker}
        value={form.eventDate}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => update('eventDate', date)}
      />

      {/* Saat Picker (tek seferlik) */}
      <TimePickerModal
        visible={showTimePicker}
        value={form.eventTime}
        onClose={() => setShowTimePicker(false)}
        onSelect={(time) => update('eventTime', time)}
      />

      {/* Saat Picker (tekrarlayan) */}
      <TimePickerModal
        visible={showRecurringTimePicker}
        value={form.recurringTime}
        onClose={() => setShowRecurringTimePicker(false)}
        onSelect={(time) => update('recurringTime', time)}
      />

      {/* Kategori Modal */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Etkinlik Türü Seç</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {EVENT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[styles.modalItem, form.category === cat.value && styles.modalItemSelected]}
                  onPress={() => { update('category', cat.value); setShowCategoryModal(false); }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={20}
                    color={form.category === cat.value ? themeColors.categories[cat.value as keyof typeof themeColors.categories] : themeColors.textSecondary}
                  />
                  <Text style={[styles.modalItemText, form.category === cat.value && { color: themeColors.categories[cat.value as keyof typeof themeColors.categories], fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                  {form.category === cat.value && <Ionicons name="checkmark" size={18} color={themeColors.categories[cat.value as keyof typeof themeColors.categories]} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* STK / Kurum Modal */}
      <Modal visible={showOrgModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>STK / Kurum Seç</Text>
              <TouchableOpacity onPress={() => setShowOrgModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              {organizations.map((org) => (
                <TouchableOpacity
                  key={org.id}
                  style={[styles.modalItem, form.organizationId === org.id && styles.modalItemSelected]}
                  onPress={() => { update('organizationId', org.id); setShowOrgModal(false); }}
                >
                  <Ionicons
                    name="business-outline"
                    size={20}
                    color={form.organizationId === org.id ? themeColors.primary : themeColors.textSecondary}
                  />
                  <Text style={[styles.modalItemText, form.organizationId === org.id && { color: themeColors.primary, fontWeight: '700' }]}>
                    {org.name}
                  </Text>
                  {form.organizationId === org.id && <Ionicons name="checkmark" size={18} color={themeColors.primary} />}
                </TouchableOpacity>
              ))}
              {organizations.length === 0 && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: themeColors.textSecondary }}>Kayıtlı STK bulunamadı. Lütfen önce STK oluşturun.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: themeColors.textPrimary },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, marginBottom: Spacing.xs, fontWeight: '600' },
  labelSub: { fontSize: Typography.fontSize.xs, color: themeColors.textMuted, marginTop: 2, marginBottom: Spacing.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.border, paddingHorizontal: Spacing.md },
  input: { flex: 1, minHeight: 50, color: themeColors.textPrimary, fontSize: Typography.fontSize.md },
  selectButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.border, paddingHorizontal: Spacing.md, height: 50 },
  selectText: { flex: 1, fontSize: Typography.fontSize.md, color: themeColors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.border, padding: Spacing.md, marginBottom: Spacing.md },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, height: 54, marginTop: Spacing.md, shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitButtonText: { color: themeColors.background, fontSize: Typography.fontSize.lg, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: themeColors.overlay, justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: themeColors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, borderWidth: 1, borderColor: themeColors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: themeColors.textPrimary },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.border },
  modalItemSelected: { backgroundColor: themeColors.surfaceLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  modalItemText: { flex: 1, fontSize: Typography.fontSize.md, color: themeColors.textPrimary },
  // Link styles
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: themeColors.surfaceLight ?? themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.primary + '40', padding: Spacing.sm, marginBottom: Spacing.xs },
  linkLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: themeColors.textPrimary },
  linkUrl: { fontSize: Typography.fontSize.xs, color: themeColors.textSecondary, marginTop: 2 },
  linkRemoveBtn: { padding: 4 },
  linkAddContainer: { marginTop: Spacing.sm },
  linkAddBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center' },
});
