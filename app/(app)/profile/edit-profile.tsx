import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore, UserProfile } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import {
  ISTANBUL_UNIVERSITIES,
  DEPARTMENTS,
  UNIVERSITY_YEARS,
} from '@/constants/data';
import { AVATARS, getAvatarSource } from '@/constants/avatars';
import { useUnsavedChangesStore } from '@/stores/unsavedChangesStore';

type EditForm = {
  full_name: string;
  username: string;
  phone: string;
  university_name: string;
  department: string;
  university_year: string;
  is_private: boolean;
  bio: string;
  avatar_id: number | null;
};

export default function EditProfileScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const { profile, setProfile } = useAuthStore();

  const initialForm: EditForm = {
    full_name: profile?.full_name ?? '',
    username: profile?.username ?? '',
    phone: profile?.phone ?? '',
    university_name: profile?.university_name ?? '',
    department: profile?.department ?? '',
    university_year: profile?.university_year ?? '',
    is_private: profile?.is_private ?? false,
    bio: profile?.bio ?? '',
    avatar_id: profile?.avatar_id ?? null,
  };

  const [form, setForm] = useState<EditForm>(initialForm);
  // İlk yüklemedeki değerlerin sabit anlık görüntüsü — kirli/değişti
  // kontrolü bu referansa göre yapılır (profile store'u save sonrası
  // güncellense bile bu değişmez).
  const initialFormRef = React.useRef<EditForm>(initialForm);

  const [showUniversityModal, setShowUniversityModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showYearModal, setShowYearModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uniSearch, setUniSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');

  const update = (key: keyof EditForm, value: string | boolean | number | null) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Kaydedilmemiş değişiklik var mı? Alt tab bar ikonlarına basıldığında
  // bu ekrandan uyarısız çıkılmasını engellemek için paylaşılan store'a
  // yazılır — bkz. app/(app)/_layout.tsx tabPress guard'ı.
  const setHasUnsavedChanges = useUnsavedChangesStore((s) => s.setHasUnsavedChanges);
  React.useEffect(() => {
    const dirty = (Object.keys(initialFormRef.current) as (keyof EditForm)[]).some(
      (key) => form[key] !== initialFormRef.current[key]
    );
    setHasUnsavedChanges(dirty);
  }, [form, setHasUnsavedChanges]);

  // Ekrandan ayrılınca (kaydedilsin ya da vazgeçilsin) bayrağı temizle.
  React.useEffect(() => {
    return () => setHasUnsavedChanges(false);
  }, [setHasUnsavedChanges]);

  const filteredUniversities = ISTANBUL_UNIVERSITIES.filter((u) =>
    u.toLowerCase().includes(uniSearch.toLowerCase())
  );

  const filteredDepartments = DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error('Ad Soyad zorunludur.');
      if (!form.username.trim()) throw new Error('Kullanıcı adı zorunludur.');

      // Username format check
      const usernameRegex = /^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/;
      if (!usernameRegex.test(form.username.trim())) {
        throw new Error('Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir.');
      }

      // Check username uniqueness if changed
      if (form.username.trim().toLowerCase() !== profile?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', form.username.trim().toLowerCase())
          .maybeSingle();

        if (checkError) throw checkError;
        if (existingUser) throw new Error('Bu kullanıcı adı zaten alınmış.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name.trim(),
          username: form.username.trim().toLowerCase(),
          phone: form.phone.trim() || null,
          university_name: form.university_name || null,
          department: form.department || null,
          university_year: form.university_year || null,
          is_private: form.is_private,
          bio: form.bio.trim() || null,
          avatar_id: form.avatar_id,
        })
        .eq('id', profile!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Local store'u güncelle
      setProfile({
        ...profile!,
        full_name: form.full_name.trim(),
        username: form.username.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        university_name: form.university_name || null,
        department: form.department || null,
        university_year: form.university_year || null,
        is_private: form.is_private,
        bio: form.bio.trim() || null,
        avatar_id: form.avatar_id,
      } as UserProfile);

      // Az önce kaydedilen değerleri "başlangıç" kabul et ki kirli/değişti
      // kontrolü artık false dönsün, sonra sessizce geri dön.
      initialFormRef.current = { ...form };
      setHasUnsavedChanges(false);
      router.back();
    },
    onError: (err: any) => {
      Alert.alert('Hata', err.message ?? 'Profil güncellenemedi.');
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Profili Düzenle</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Avatar seçimi */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarHint}>
              <LinearGradient
                colors={[themeColors.primary, themeColors.primary + '88', themeColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarOuterRing}
              >
                <View style={styles.avatar}>
                  {form.avatar_id ? (
                    <Image source={getAvatarSource(form.avatar_id)} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {form.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || 'U'}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </View>
            <TouchableOpacity
              style={styles.avatarPickButton}
              activeOpacity={0.8}
              onPress={() => setShowAvatarModal(true)}
            >
              <Ionicons name="pencil" size={14} color={themeColors.primary} />
              <Text style={styles.avatarPickButtonText}>Avatar Seç</Text>
            </TouchableOpacity>
          </View>

          {/* Ad Soyad */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ad Soyad *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="Adınız Soyadınız"
                placeholderTextColor={themeColors.textMuted}
                value={form.full_name}
                onChangeText={(v) => update('full_name', v)}
              />
            </View>
          </View>

          {/* Kullanıcı Adı */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kullanıcı Adı *</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="at-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="kullanici_adi"
                placeholderTextColor={themeColors.textMuted}
                value={form.username}
                onChangeText={(v) => update('username', v.toLowerCase())}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* E-posta (Salt Okunur) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={[styles.inputWrapper, styles.disabledInputWrapper]}>
              <Ionicons name="mail-outline" size={17} color={themeColors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={profile?.email}
                editable={false}
                selectTextOnFocus={false}
              />
              <Ionicons name="lock-closed" size={14} color={themeColors.textMuted} />
            </View>
          </View>

          {/* Telefon */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Telefon</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.input}
                placeholder="05XX XXX XX XX"
                placeholderTextColor={themeColors.textMuted}
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* Üniversite */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Üniversite</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowUniversityModal(true)}
            >
              <Ionicons name="school-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.selectText, form.university_name && { color: themeColors.textPrimary }]} numberOfLines={1}>
                {form.university_name || 'Üniversite seçin'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Bölüm */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bölüm</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDepartmentModal(true)}
            >
              <Ionicons name="book-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.selectText, form.department && { color: themeColors.textPrimary }]} numberOfLines={1}>
                {form.department || 'Bölüm seçin'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Sınıf */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sınıf</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowYearModal(true)}
            >
              <Ionicons name="layers-outline" size={17} color={themeColors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={[styles.selectText, form.university_year && { color: themeColors.textPrimary }]}>
                {form.university_year || 'Sınıf seçin'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Biyografi */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Biyografi</Text>
              <Text style={[
                styles.charCounter,
                form.bio.length >= 140 ? { color: themeColors.error } :
                form.bio.length >= 100 ? { color: '#F59E0B' } :
                { color: themeColors.textMuted }
              ]}>
                {form.bio.length} / 150
              </Text>
            </View>
            <View style={[styles.inputWrapper, styles.bioWrapper]}>
              <TextInput
                style={[styles.input, styles.bioInput]}
                placeholder="Kendini kısaca tanıt..."
                placeholderTextColor={themeColors.textMuted}
                value={form.bio}
                onChangeText={(v) => {
                  if (v.length <= 150) update('bio', v);
                }}
                multiline
                numberOfLines={4}
                maxLength={150}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Hesap Gizliliği */}
          <View style={styles.privacyGroup}>
            <View style={styles.privacyTextContainer}>
              <Text style={styles.privacyTitle}>Hesap Gizliliği</Text>
              <Text style={styles.privacyDesc}>Hesabını gizlediğinde okul, sınıf ve katıldığın etkinlikler diğer kullanıcılardan gizlenir.</Text>
            </View>
            <Switch
              value={form.is_private}
              onValueChange={(v) => update('is_private', v)}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : form.is_private ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            style={[styles.saveButton, saveMutation.isPending && { opacity: 0.6 }]}
            onPress={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            activeOpacity={0.85}
          >
            {saveMutation.isPending ? (
              <ActivityIndicator color={themeColors.background} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={themeColors.background} />
                <Text style={styles.saveButtonText}>Değişiklikleri Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Üniversite Modal */}
      <Modal visible={showUniversityModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Üniversite Seç</Text>
              <TouchableOpacity onPress={() => { setShowUniversityModal(false); setUniSearch(''); }}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={16} color={themeColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Üniversite ara..."
                placeholderTextColor={themeColors.textMuted}
                value={uniSearch}
                onChangeText={setUniSearch}
                autoFocus
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredUniversities.map((uni) => (
                <TouchableOpacity
                  key={uni}
                  style={[styles.modalItem, form.university_name === uni && styles.modalItemSelected]}
                  onPress={() => {
                    update('university_name', uni);
                    setShowUniversityModal(false);
                    setUniSearch('');
                  }}
                >
                  <Text style={[styles.modalItemText, form.university_name === uni && { color: themeColors.primary }]}>
                    {uni}
                  </Text>
                  {form.university_name === uni && (
                    <Ionicons name="checkmark" size={18} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bölüm Modal */}
      <Modal visible={showDepartmentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bölüm Seç</Text>
              <TouchableOpacity onPress={() => { setShowDepartmentModal(false); setDeptSearch(''); }}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.searchWrapper}>
              <Ionicons name="search" size={16} color={themeColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Bölüm ara..."
                placeholderTextColor={themeColors.textMuted}
                value={deptSearch}
                onChangeText={setDeptSearch}
                autoFocus
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {filteredDepartments.map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[styles.modalItem, form.department === dept && styles.modalItemSelected]}
                  onPress={() => {
                    update('department', dept);
                    setShowDepartmentModal(false);
                    setDeptSearch('');
                  }}
                >
                  <Text style={[styles.modalItemText, form.department === dept && { color: themeColors.primary }]}>
                    {dept}
                  </Text>
                  {form.department === dept && (
                    <Ionicons name="checkmark" size={18} color={themeColors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Sınıf Modal */}
      <Modal visible={showYearModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sınıf Seç</Text>
              <TouchableOpacity onPress={() => setShowYearModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            {UNIVERSITY_YEARS.map((year) => (
              <TouchableOpacity
                key={year}
                style={[styles.modalItem, form.university_year === year && styles.modalItemSelected]}
                onPress={() => {
                  update('university_year', year);
                  setShowYearModal(false);
                }}
              >
                <Text style={[styles.modalItemText, form.university_year === year && { color: themeColors.primary }]}>
                  {year}
                </Text>
                {form.university_year === year && (
                  <Ionicons name="checkmark" size={18} color={themeColors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Avatar Seçim Modalı */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Avatar Seç</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing.xl }}>
              <View style={styles.avatarGrid}>
                <TouchableOpacity
                  style={styles.avatarGridItem}
                  activeOpacity={0.85}
                  onPress={() => {
                    update('avatar_id', null);
                    setShowAvatarModal(false);
                  }}
                >
                  <View style={[
                    styles.avatarGridThumb,
                    styles.avatarGridInitials,
                    !form.avatar_id && styles.avatarGridThumbSelected,
                  ]}>
                    <Text style={styles.avatarGridInitialsText}>
                      {form.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                    </Text>
                  </View>
                  {!form.avatar_id && (
                    <View style={styles.avatarGridCheck}>
                      <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                    </View>
                  )}
                </TouchableOpacity>

                {Object.keys(AVATARS).map((key) => {
                  const id = Number(key);
                  const selected = form.avatar_id === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={styles.avatarGridItem}
                      activeOpacity={0.85}
                      onPress={() => {
                        update('avatar_id', id);
                        setShowAvatarModal(false);
                      }}
                    >
                      <View style={[styles.avatarGridThumb, selected && styles.avatarGridThumbSelected]}>
                        <Image source={AVATARS[id]} style={styles.avatarGridImage} />
                      </View>
                      {selected && (
                        <View style={styles.avatarGridCheck}>
                          <Ionicons name="checkmark-circle" size={20} color={themeColors.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: themeColors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: themeColors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarHint: {
    marginBottom: Spacing.md,
  },
  avatarPickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: themeColors.primary + '40',
    backgroundColor: themeColors.primary + '10',
  },
  avatarPickButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: themeColors.primary,
  },
  avatarOuterRing: {
    padding: 3,
    borderRadius: 40,
  },
  avatar: {
    width: 74, height: 74, borderRadius: 37,
    backgroundColor: themeColors.primary,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: themeColors.background,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: themeColors.background,
  },
  inputGroup: { marginBottom: Spacing.md },
  label: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  input: {
    flex: 1,
    color: themeColors.textPrimary,
    fontSize: Typography.fontSize.md,
    minHeight: 50,
  },
  disabledInputWrapper: {
    backgroundColor: themeColors.surfaceLight,
    borderColor: themeColors.border,
    opacity: 0.8,
  },
  disabledInput: {
    color: themeColors.textMuted,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  selectText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: themeColors.textMuted,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.md,
    height: 54,
    marginTop: Spacing.md,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: themeColors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: themeColors.overlay,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: themeColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surfaceLight,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: themeColors.textPrimary,
    fontSize: Typography.fontSize.md,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    gap: Spacing.md,
  },
  modalItemSelected: {
    backgroundColor: themeColors.surfaceLight,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
  },
  modalItemText: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: themeColors.textPrimary,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  avatarGridItem: {
    width: '22%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGridThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: themeColors.background,
    borderWidth: 2,
    borderColor: themeColors.border,
  },
  avatarGridThumbSelected: {
    borderColor: themeColors.primary,
    borderWidth: 3,
  },
  avatarGridImage: {
    width: '100%',
    height: '100%',
  },
  avatarGridInitials: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.primary,
  },
  avatarGridInitialsText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.background,
  },
  avatarGridCheck: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: themeColors.surface,
    borderRadius: 12,
  },
  privacyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  privacyTextContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  privacyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 2,
  },
  privacyDesc: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    lineHeight: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  charCounter: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  bioWrapper: {
    alignItems: 'flex-start',
    minHeight: 110,
    paddingVertical: Spacing.sm,
  },
  bioInput: {
    minHeight: 90,
    textAlignVertical: 'top',
    paddingTop: 0,
    lineHeight: 20,
  },
});
