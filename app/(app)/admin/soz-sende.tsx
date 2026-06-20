import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';

export default function AdminSozSende() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { profile, isAdmin } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['admin_weekly_questions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_questions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 0,
  });

  const upsertMutation = useMutation({
    mutationFn: async () => {
      if (!profile?.id) throw new Error('Oturum bilgisi bulunamadı.');
      if (!isAdmin) throw new Error('Bu işlem için admin yetkisi gerekiyor.');

      const questionData = {
        title: title.trim(),
        description: description.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('weekly_questions')
          .update(questionData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const insertData = {
          ...questionData,
          is_active: true,
          created_by: profile.id,
        };
        const { error } = await supabase
          .from('weekly_questions')
          .insert(insertData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setIsCreating(false);
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ['admin_weekly_questions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly_questions'] });
      queryClient.invalidateQueries({ queryKey: ['trend-questions-explore'] });
      Alert.alert('Başarılı', editingId ? 'Soru güncellendi.' : 'Yeni soru oluşturuldu.');
    },
    onError: (error: any) => {
      console.error('Upsert Error:', error);
      Alert.alert('Hata', error.message || 'Bir sorun oluştu.');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from('weekly_questions').update({ is_active: !is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_weekly_questions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly_questions'] });
      queryClient.invalidateQueries({ queryKey: ['trend-questions-explore'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('weekly_questions').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_weekly_questions'] });
      queryClient.invalidateQueries({ queryKey: ['weekly_questions'] });
      queryClient.invalidateQueries({ queryKey: ['trend-questions-explore'] });
    }
  });

  const handleEdit = (question: any) => {
    setTitle(question.title);
    setDescription(question.description || '');
    setEditingId(question.id);
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setTitle('');
    setDescription('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Söz Sende (Yönetim)</Text>
        <TouchableOpacity 
          style={[styles.addButton, isCreating && { backgroundColor: themeColors.error }]} 
          onPress={() => isCreating ? handleCancel() : setIsCreating(true)}
        >
          <Ionicons name={isCreating ? "close" : "add"} size={22} color={themeColors.background} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        {isCreating && (
          <View style={styles.createForm}>
            <Text style={styles.formTitle}>{editingId ? 'Soruyu Düzenle' : 'Yeni Soru Oluştur'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Soru başlığı"
              placeholderTextColor={themeColors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Açıklama veya detay (opsiyonel)"
              placeholderTextColor={themeColors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.formActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={handleCancel}
              >
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitBtn, !title.trim() && { opacity: 0.5 }]} 
                disabled={!title.trim() || upsertMutation.isPending}
                onPress={() => upsertMutation.mutate()}
              >
                {upsertMutation.isPending ? (
                  <ActivityIndicator color={themeColors.background} />
                ) : (
                  <Text style={styles.submitBtnText}>{editingId ? 'Güncelle' : 'Yayınla'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={themeColors.primary} />
          </View>
        ) : (
          <FlatList
            data={questions}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.cardBadgeRow}>
                      <View style={[styles.statusBadge, item.is_active ? styles.activeBadge : styles.inactiveBadge]}>
                        <View style={[styles.statusDot, { backgroundColor: item.is_active ? themeColors.success : themeColors.textMuted }]} />
                        <Text style={[styles.statusText, { color: item.is_active ? themeColors.success : themeColors.textMuted }]}>
                          {item.is_active ? 'Aktif' : 'Pasif'}
                        </Text>
                      </View>
                      <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
                    </View>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {item.description && (
                      <Text style={styles.cardDescription} numberOfLines={2}>{item.description}</Text>
                    )}
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <TouchableOpacity 
                    style={styles.commentBtn}
                    onPress={() => router.push(`/(app)/soz-sende/${item.id}`)}
                  >
                    <Ionicons name="chatbubble-outline" size={16} color={themeColors.primary} />
                    <Text style={styles.commentBtnText}>Yorumları Gör</Text>
                  </TouchableOpacity>

                  <View style={styles.actions}>
                    <TouchableOpacity 
                      onPress={() => toggleMutation.mutate({ id: item.id, is_active: item.is_active })} 
                      style={[styles.actionBtn, item.is_active ? styles.deactivateBtn : styles.activateBtn]}
                    >
                      <Text style={[styles.actionBtnText, { color: item.is_active ? themeColors.error : themeColors.success }]}>
                        {item.is_active ? 'Durdur' : 'Başlat'}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity onPress={() => handleEdit(item)} style={styles.editBtn}>
                      <Ionicons name="pencil" size={16} color={themeColors.textSecondary} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => {
                      Alert.alert('Sil', 'Bu soruyu ve tüm yorumları silmek istediğinize emin misiniz?', [
                        { text: 'Vazgeç', style: 'cancel' },
                        { text: 'Sil', style: 'destructive', onPress: () => deleteMutation.mutate(item.id) }
                      ])
                    }} style={styles.deleteBtn}>
                      <Ionicons name="trash" size={16} color={themeColors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color={themeColors.textMuted} />
                <Text style={styles.emptyStateTitle}>Henüz soru eklenmemiş</Text>
                <TouchableOpacity style={styles.createButton} onPress={() => setIsCreating(true)}>
                  <Text style={styles.createButtonText}>İlk Soruyu Sor</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.md, 
    borderBottomWidth: 1, 
    borderBottomColor: themeColors.border,
    backgroundColor: themeColors.surface 
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: themeColors.textPrimary },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center' },
  
  createForm: { padding: Spacing.lg, backgroundColor: themeColors.surface, borderBottomWidth: 1, borderBottomColor: themeColors.border },
  formTitle: { fontSize: Typography.fontSize.md, fontWeight: '700', color: themeColors.textPrimary, marginBottom: Spacing.md },
  input: { backgroundColor: themeColors.background, borderWidth: 1, borderColor: themeColors.border, borderRadius: BorderRadius.md, padding: Spacing.md, color: themeColors.textPrimary, marginBottom: Spacing.md },
  formActions: { flexDirection: 'row', gap: Spacing.md },
  submitBtn: { flex: 2, backgroundColor: themeColors.primary, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  submitBtnText: { color: themeColors.background, fontWeight: '700', fontSize: Typography.fontSize.md },
  cancelBtn: { flex: 1, backgroundColor: themeColors.surfaceLight, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center', borderWidth: 1, borderColor: themeColors.border },
  cancelBtnText: { color: themeColors.textSecondary, fontWeight: '600' },
  
  list: { padding: Spacing.lg },
  card: { backgroundColor: themeColors.surface, borderRadius: BorderRadius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: themeColors.border },
  cardHeader: { marginBottom: Spacing.md },
  cardBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full },
  activeBadge: { backgroundColor: themeColors.success + '11' },
  inactiveBadge: { backgroundColor: themeColors.surfaceLight },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },
  date: { fontSize: 11, color: themeColors.textMuted },
  cardTitle: { fontSize: Typography.fontSize.md, fontWeight: '700', color: themeColors.textPrimary, marginBottom: 4 },
  cardDescription: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, lineHeight: 18 },
  
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: themeColors.border },
  commentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 },
  commentBtnText: { fontSize: 13, color: themeColors.primary, fontWeight: '600' },
  
  actions: { flexDirection: 'row', gap: Spacing.xs, alignItems: 'center' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1 },
  activateBtn: { backgroundColor: themeColors.success + '11', borderColor: themeColors.success + '44' },
  deactivateBtn: { backgroundColor: themeColors.error + '11', borderColor: themeColors.error + '44' },
  actionBtnText: { fontSize: 12, fontWeight: '600' },
  editBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: themeColors.surfaceLight, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: themeColors.error + '11', alignItems: 'center', justifyContent: 'center' },
  
  emptyState: { alignItems: 'center', paddingVertical: 50, gap: Spacing.md },
  emptyStateTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textSecondary },
  createButton: { backgroundColor: themeColors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: BorderRadius.md },
  createButtonText: { color: themeColors.background, fontWeight: '700' }
});

