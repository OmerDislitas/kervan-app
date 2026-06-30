import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator, Modal, Switch, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';
import { DAYS_OF_WEEK, EVENT_CATEGORIES } from '@/constants/data';
import DatePickerModal from '@/components/DatePickerModal';
import TimePickerModal from '@/components/TimePickerModal';

type EventLink = {
  label: string;
  url: string;
};

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<any>(null);
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

  const { data: event, isLoading } = useQuery({
    queryKey: ['admin-event', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (event) {
      let dateStr = '';
      let timeStr = '';
      if (event.event_date) {
        const d = new Date(event.event_date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        dateStr = `${yyyy}-${mm}-${dd}`;
        timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
      setForm({
        title: event.title,
        description: event.description ?? '',
        location: event.location ?? '',
        isRecurring: event.is_recurring,
        eventDate: dateStr,
        eventTime: timeStr,
        recurringDay: event.recurring_day,
        recurringTime: event.recurring_time?.slice(0, 5) ?? '',
        genderRestriction: event.gender_restriction,
        maxCapacity: event.max_capacity ? String(event.max_capacity) : '',
        isPublished: event.is_published,
        category: event.category ?? 'other',
        organizationId: event.organization_id ?? '',
        links: Array.isArray(event.links) ? event.links : [],
      });
    }
  }, [event]);

  const update = (key: string, value: any) =>
    setForm((prev: any) => ({ ...prev, [key]: value }));

  const updateMutation = useMutation({
    mutationFn: async () => {
      let event_date: string | null = null;

      if (!form.organizationId) {
        throw new Error('STK / Kurum seçilmesi zorunludur.');
      }

      if (!form.isRecurring) {
        if (!form.eventDate || !form.eventTime) throw new Error('Tarih ve saat zorunludur.');
        const [y, m, d] = form.eventDate.split('-').map(Number);
        const [hh, mm] = form.eventTime.split(':').map(Number);
        const localDate = new Date(y, m - 1, d, hh, mm);
        event_date = localDate.toISOString();
      } else {
        if (form.recurringDay === null || !form.recurringTime) throw new Error('Gün ve saat zorunludur.');
      }

      const { error } = await supabase.from('events').update({
        title: form.title.trim(),
        description: form.description.trim() || null,
        location: form.location.trim() || null,
        event_date,
        is_recurring: form.isRecurring,
        recurring_day: form.isRecurring ? form.recurringDay : null,
        recurring_time: form.isRecurring ? `${form.recurringTime}:00` : null,
        gender_restriction: form.genderRestriction,
        max_capacity: form.maxCapacity ? parseInt(form.maxCapacity, 10) : null,
        is_published: form.isPublished,
        category: form.category,
        organization_id: form.organizationId,
        links: form.links ?? [],
      }).eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-event', id] });
      // STK kart sayısını ve org etkinlik listesini güncelle
      queryClient.invalidateQueries({ queryKey: ['active-events-counts'] });
      queryClient.invalidateQueries({ queryKey: ['org-events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events-home'] });
      Alert.alert('Başarılı', 'Etkinlik güncellendi!', [
        { text: 'Tamam', onPress: () => router.back() },
      ]);
    },
    onError: (err: any) => Alert.alert('Hata', err.message),
  });

  if (isLoading || !form) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Etkinliği Düzenle</Text>
            <View style={{ width: 36 }} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Başlık *</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholderTextColor={Colors.textMuted} value={form.title} onChangeText={(v) => update('title', v)} />
            </View>
          </View>

          {/* Kategori Seçimi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Etkinlik Türü *</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowCategoryModal(true)}>
              <Ionicons
                name={(EVENT_CATEGORIES.find(c => c.value === form.category)?.icon as any) || 'star'}
                size={17}
                color={Colors.categories[form.category as keyof typeof Colors.categories] || Colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.selectText, { color: Colors.textPrimary }]}>
                {EVENT_CATEGORIES.find(c => c.value === form.category)?.label || 'Seçiniz'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* STK / Kurum Seçimi */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>STK / Kurum *</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowOrgModal(true)}>
              <Ionicons name="business-outline" size={17} color={Colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.selectText, form.organizationId ? { color: Colors.textPrimary } : {}]}>
                {organizations.find(o => o.id === form.organizationId)?.name || 'STK / Kurum seçin'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Açıklama</Text>
            <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: Spacing.sm }]}>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholderTextColor={Colors.textMuted} value={form.description} onChangeText={(v) => update('description', v)} multiline />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konum</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={17} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput style={styles.input} placeholderTextColor={Colors.textMuted} value={form.location} onChangeText={(v) => update('location', v)} />
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Haftalık Tekrarlayan</Text>
              <Text style={styles.labelSub}>Kapalıysa tek seferlik</Text>
            </View>
            <Switch value={form.isRecurring} onValueChange={(v) => update('isRecurring', v)} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor={Colors.textPrimary} />
          </View>

          {!form.isRecurring ? (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tarih *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={17} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.eventDate ? { color: Colors.textPrimary } : {}]}>
                    {form.eventDate
                      ? (() => {
                          const [y, m, d] = form.eventDate.split('-');
                          const months = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
                          return `${d} ${months[parseInt(m)-1]} ${y}`;
                        })()
                      : 'Tarih seçin'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Saat *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={17} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.eventTime ? { color: Colors.textPrimary } : {}]}>
                    {form.eventTime || 'Saat seçin'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gün *</Text>
                <TouchableOpacity style={styles.selectButton} onPress={() => setShowDayModal(true)}>
                  <Text style={[styles.selectText, form.recurringDay !== null && { color: Colors.textPrimary }]}>
                    {form.recurringDay !== null ? DAYS_OF_WEEK[form.recurringDay] : 'Gün seçin'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Saat *</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowRecurringTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={17} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                  <Text style={[styles.selectText, form.recurringTime ? { color: Colors.textPrimary } : {}]}>
                    {form.recurringTime || 'Saat seçin'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cinsiyet Kısıtlaması</Text>
            <TouchableOpacity style={styles.selectButton} onPress={() => setShowGenderModal(true)}>
              <Text style={[styles.selectText, form.genderRestriction && { color: Colors.textPrimary }]}>
                {form.genderRestriction === 'male' ? 'Sadece Erkekler' : form.genderRestriction === 'female' ? 'Sadece Kadınlar' : 'Kısıtlama yok'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kontenjan (Opsiyonel)</Text>
            <View style={styles.inputWrapper}>
              <TextInput style={styles.input} placeholder="Boş = limitsiz" placeholderTextColor={Colors.textMuted} value={form.maxCapacity} onChangeText={(v) => update('maxCapacity', v.replace(/[^0-9]/g, ''))} keyboardType="number-pad" />
            </View>
          </View>

          {/* Bağlantı Linkleri */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bağlantı Linkleri (Opsiyonel)</Text>
            <Text style={styles.labelSub}>Harita, kayıt formu, burs başvurusu vb. linkler ekleyin</Text>

            {(form.links ?? []).map((link: EventLink, idx: number) => (
              <View key={idx} style={styles.linkItem}>
                <Ionicons name="link-outline" size={16} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkLabel}>{link.label}</Text>
                  <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => update('links', (form.links ?? []).filter((_: any, i: number) => i !== idx))}
                  style={styles.linkRemoveBtn}
                >
                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.linkAddContainer}>
              <View style={[styles.inputWrapper, { marginBottom: 8 }]}>
                <Ionicons name="pricetag-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.input, { minHeight: 44 }]}
                  placeholder="Başlık (ör: Harita, Kayıt)"
                  placeholderTextColor={Colors.textMuted}
                  value={newLinkLabel}
                  onChangeText={setNewLinkLabel}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <Ionicons name="globe-outline" size={15} color={Colors.textSecondary} style={{ marginRight: 6 }} />
                  <TextInput
                    style={[styles.input, { minHeight: 44 }]}
                    placeholder="https://..."
                    placeholderTextColor={Colors.textMuted}
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
                    update('links', [...(form.links ?? []), { label, url: finalUrl }]);
                    setNewLinkLabel('');
                    setNewLinkUrl('');
                  }}
                >
                  <Ionicons name="add" size={22} color={Colors.background} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.switchRow}>
            <View>
              <Text style={styles.label}>Yayında</Text>
              <Text style={styles.labelSub}>Kapalıysa taslak</Text>
            </View>
            <Switch value={form.isPublished} onValueChange={(v) => update('isPublished', v)} trackColor={{ false: Colors.border, true: Colors.success }} thumbColor={Colors.textPrimary} />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, updateMutation.isPending && { opacity: 0.6 }]}
            onPress={() => updateMutation.mutate()}
            disabled={updateMutation.isPending}
            activeOpacity={0.85}
          >
            {updateMutation.isPending ? <ActivityIndicator color={Colors.background} /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.background} />
                <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showDayModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gün Seç</Text>
              <TouchableOpacity onPress={() => setShowDayModal(false)}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            </View>
            {DAYS_OF_WEEK.map((day, i) => (
              <TouchableOpacity key={day} style={[styles.modalItem, form.recurringDay === i && styles.modalItemSelected]} onPress={() => { update('recurringDay', i); setShowDayModal(false); }}>
                <Text style={[styles.modalItemText, form.recurringDay === i && { color: Colors.primary }]}>{day}</Text>
                {form.recurringDay === i && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal visible={showGenderModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cinsiyet Kısıtlaması</Text>
              <TouchableOpacity onPress={() => setShowGenderModal(false)}><Ionicons name="close" size={24} color={Colors.textPrimary} /></TouchableOpacity>
            </View>
            {[{ label: 'Herkese Açık', value: null }, { label: 'Sadece Erkekler', value: 'male' }, { label: 'Sadece Kadınlar', value: 'female' }].map((opt) => (
              <TouchableOpacity key={String(opt.value)} style={[styles.modalItem, form.genderRestriction === opt.value && styles.modalItemSelected]} onPress={() => { update('genderRestriction', opt.value); setShowGenderModal(false); }}>
                <Text style={[styles.modalItemText, form.genderRestriction === opt.value && { color: Colors.primary }]}>{opt.label}</Text>
                {form.genderRestriction === opt.value && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Tarih Picker */}
      <DatePickerModal
        visible={showDatePicker}
        value={form?.eventDate ?? ''}
        onClose={() => setShowDatePicker(false)}
        onSelect={(date) => update('eventDate', date)}
      />

      {/* Saat Picker (tek seferlik) */}
      <TimePickerModal
        visible={showTimePicker}
        value={form?.eventTime ?? ''}
        onClose={() => setShowTimePicker(false)}
        onSelect={(time) => update('eventTime', time)}
      />

      {/* Saat Picker (tekrarlayan) */}
      <TimePickerModal
        visible={showRecurringTimePicker}
        value={form?.recurringTime ?? ''}
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
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
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
                    color={form.category === cat.value ? Colors.categories[cat.value as keyof typeof Colors.categories] : Colors.textSecondary}
                  />
                  <Text style={[styles.modalItemText, form.category === cat.value && { color: Colors.categories[cat.value as keyof typeof Colors.categories], fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                  {form.category === cat.value && <Ionicons name="checkmark" size={18} color={Colors.categories[cat.value as keyof typeof Colors.categories]} />}
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
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
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
                    color={form.organizationId === org.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.modalItemText, form.organizationId === org.id && { color: Colors.primary, fontWeight: '700' }]}>
                    {org.name}
                  </Text>
                  {form.organizationId === org.id && <Ionicons name="checkmark" size={18} color={Colors.primary} />}
                </TouchableOpacity>
              ))}
              {organizations.length === 0 && (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ color: Colors.textSecondary }}>Kayıtlı STK bulunamadı. Lütfen önce STK oluşturun.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  headerTitle: { fontSize: Typography.fontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.xs, fontWeight: '600' },
  labelSub: { fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: 2, marginBottom: Spacing.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md },
  input: { flex: 1, minHeight: 50, color: Colors.textPrimary, fontSize: Typography.fontSize.md },
  selectButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, height: 50 },
  selectText: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.textMuted },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.md },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md, height: 54, marginTop: Spacing.md, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  submitButtonText: { color: Colors.background, fontSize: Typography.fontSize.lg, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.lg },
  modalTitle: { fontSize: Typography.fontSize.xl, fontWeight: '700', color: Colors.textPrimary },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border },
  modalItemSelected: { backgroundColor: Colors.surfaceLight, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm },
  modalItemText: { flex: 1, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  // Link styles
  linkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surfaceLight ?? Colors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.primary + '40', padding: Spacing.sm, marginBottom: Spacing.xs },
  linkLabel: { fontSize: Typography.fontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  linkUrl: { fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  linkRemoveBtn: { padding: 4 },
  linkAddContainer: { marginTop: Spacing.sm },
  linkAddBtn: { width: 44, height: 44, borderRadius: BorderRadius.md, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
