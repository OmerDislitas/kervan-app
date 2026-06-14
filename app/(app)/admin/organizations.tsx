import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

type Organization = {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  created_at: string;
};

async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default function AdminOrganizationsScreen() {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuthStore();

  const [showModal, setShowModal] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
  });

  // Admin kontrolü
  React.useEffect(() => {
    if (!isAdmin) {
      router.replace('/(app)/events');
    }
  }, [isAdmin]);

  const { data: organizations = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-organizations'],
    queryFn: fetchOrganizations,
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };

      if (editingOrg) {
        // Update
        const { error } = await supabase
          .from('organizations')
          .update(payload)
          .eq('id', editingOrg.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('organizations')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      Alert.alert('Başarılı', editingOrg ? 'STK başarıyla güncellendi!' : 'Yeni STK başarıyla eklendi!');
      closeModal();
    },
    onError: (err: any) => {
      Alert.alert('Hata', 'STK kaydedilirken bir hata oluştu: ' + err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      Alert.alert('Başarılı', 'STK başarıyla silindi.');
    },
    onError: (err: any) => {
      Alert.alert('Hata', 'STK silinemedi: ' + err.message);
    },
  });

  const openAddModal = () => {
    setEditingOrg(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (org: Organization) => {
    setEditingOrg(org);
    setForm({
      name: org.name,
      description: org.description ?? '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOrg(null);
    setForm({ name: '', description: '' });
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      Alert.alert('Uyarı', 'Lütfen kurum adı giriniz.');
      return;
    }
    saveMutation.mutate();
  };

  const handleDelete = (org: Organization) => {
    Alert.alert(
      'STK Sil',
      `"${org.name}" kurumunu silmek istediğinize emin misiniz? Bu kuruma ait etkinliklerin STK bağlantısı koparılacaktır.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(org.id),
        },
      ]
    );
  };

  const renderOrgItem = ({ item }: { item: Organization }) => {
    const initials = item.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();

    return (
      <View style={styles.card}>
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
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={() => openEditModal(item)}
            style={[styles.actionBtn, styles.editBtn]}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={16} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item)}
            style={[styles.actionBtn, styles.deleteBtn]}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={16} color={themeColors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>STK Yönetimi</Text>
        <TouchableOpacity onPress={openAddModal} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : (
        <FlatList
          data={organizations}
          keyExtractor={(item) => item.id}
          renderItem={renderOrgItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={60} color={themeColors.textMuted} />
              <Text style={styles.emptyStateTitle}>Kayıtlı STK bulunamadı</Text>
              <Text style={styles.emptyStateSubtitle}>
                Yeni bir STK/vakıf kartı eklemek için sağ üstteki '+' butonunu kullanın.
              </Text>
            </View>
          }
        />
      )}

      {/* Ekle / Düzenle Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingOrg ? 'STK Düzenle' : 'Yeni STK Ekle'}
              </Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>STK / Vakıf Adı *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: İHH, Kervan, TDV vb."
                  placeholderTextColor={themeColors.textMuted}
                  value={form.name}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, name: v }))}
                />
              </View>


              <View style={styles.inputGroup}>
                <Text style={styles.label}>Açıklama (Opsiyonel)</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="STK hakkında kısa bilgi..."
                  placeholderTextColor={themeColors.textMuted}
                  value={form.description}
                  onChangeText={(v) => setForm((prev) => ({ ...prev, description: v }))}
                  multiline
                />
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, saveMutation.isPending && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingOrg ? 'Değişiklikleri Kaydet' : 'Kurum Ekle'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) =>
  StyleSheet.create({
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
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    headerTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: '800',
      color: themeColors.textPrimary,
    },
    addButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: themeColors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listContent: { padding: Spacing.lg },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: themeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginBottom: Spacing.md,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cardInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing.md },
    logo: { width: 48, height: 48, borderRadius: BorderRadius.md, backgroundColor: '#f0f0f0' },
    avatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: BorderRadius.md,
      backgroundColor: themeColors.primary + '22',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.primary + '44',
    },
    avatarPlaceholderText: {
      color: themeColors.primary,
      fontWeight: '700',
      fontSize: 16,
    },
    textContainer: { flex: 1, gap: 2 },
    orgName: { fontSize: 16, fontWeight: '700', color: themeColors.textPrimary },
    orgDesc: { fontSize: 12, color: themeColors.textSecondary, lineHeight: 16 },
    actions: { flexDirection: 'row', gap: Spacing.xs },
    actionBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.surfaceLight,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    editBtn: {},
    deleteBtn: { backgroundColor: themeColors.error + '11', borderColor: themeColors.error + '22' },
    emptyState: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
    emptyStateTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: '700',
      color: themeColors.textSecondary,
      marginTop: Spacing.md,
    },
    emptyStateSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textMuted,
      textAlign: 'center',
      marginTop: Spacing.xs,
      paddingHorizontal: Spacing.xl,
    },
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
    modalTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: '800',
      color: themeColors.textPrimary,
    },
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
  });
