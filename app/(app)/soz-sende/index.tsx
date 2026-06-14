import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Dimensions, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

async function fetchQuestions() {
  const { data, error } = await supabase
    .from('weekly_questions')
    .select('*, profiles(full_name, username)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export default function SozSendeScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();

  const { data: questions = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['weekly_questions'],
    queryFn: fetchQuestions,
  });

  const [suggestModalVisible, setSuggestModalVisible] = React.useState(false);
  const [suggestText, setSuggestText] = React.useState('');

  const submitSuggestion = async (title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Hata', 'Giriş yapılmış bir kullanıcı bulunamadı.');
        return;
      }
      const { error } = await supabase
        .from('topic_suggestions')
        .insert({ user_id: user.id, title: title, status: 'pending' });
      if (error) throw error;
      Alert.alert('Harika! 🎉', 'Tartışma konusu öneriniz başarıyla alınmıştır. İnceleme sonrası yayına alınacaktır.');
    } catch (err: any) {
      Alert.alert('Hata', 'Öneri iletilemedi: ' + err.message);
    }
  };

  const handleSuggestTopic = () => {
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Konu Önerisi 💡',
        'Tartışılmasını istediğin fikri veya soruyu gir:',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Gönder',
            onPress: (text) => {
              if (text && text.trim()) submitSuggestion(text.trim());
            },
          },
        ],
        'plain-text'
      );
    } else {
      // Android & diğer platformlar: özel modal
      setSuggestText('');
      setSuggestModalVisible(true);
    }
  };

  const handleAndroidSuggestSubmit = async () => {
    if (!suggestText.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir öneri yazınız.');
      return;
    }
    setSuggestModalVisible(false);
    await submitSuggestion(suggestText.trim());
    setSuggestText('');
  };


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Söz Sende</Text>
          </View>
          
          <TouchableOpacity
            style={styles.suggestBtn}
            onPress={handleSuggestTopic}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[themeColors.primary, themeColors.primaryLight || '#F5C96A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.suggestBtnGradient}
            >
              <Ionicons name="bulb" size={13} color="#0F1923" />
              <Text style={styles.suggestBtnText}>Konu Öner</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Fikirlerini özgürce paylaş, toplulukla tartışmaya katıl.</Text>
      </View>

      <FlatList
        data={questions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={themeColors.primary} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.9}
            onPress={() => router.push(`/(app)/soz-sende/${item.id}`)}
          >
            <View style={styles.cardGlow} />
            <View style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, !item.is_active && styles.badgeInactive]}>
                  <View style={[styles.badgeDot, { backgroundColor: item.is_active ? themeColors.primary : themeColors.textMuted }]} />
                  <Text style={[styles.badgeText, !item.is_active && { color: themeColors.textMuted }]}>
                    {item.is_active ? 'AKTİF TARTIŞMA' : 'KAPANDI'}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(item.created_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
              
              <Text style={styles.title}>{item.title}</Text>
              
              {item.description && (
                <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              )}
              
              <View style={styles.cardFooter}>
                <View style={styles.authorGroup}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorAvatarText}>
                      {(item.profiles?.username || item.profiles?.full_name || 'K').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.authorName}>
                    {item.profiles?.username ? `@${item.profiles.username}` : (item.profiles?.full_name || 'Kullanıcı')}
                  </Text>
                </View>
                <View style={styles.commentInfo}>
                  <Ionicons name="chatbubbles" size={16} color={themeColors.primary} />
                  <Text style={styles.commentCount}>Tartışmaya Katıl</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={40} color={themeColors.border} />
              </View>
              <Text style={styles.emptyText}>Henüz bir soru eklenmedi.</Text>
              <Text style={styles.emptySubtext}>Takipte kal, yakında yeni sorular gelecek!</Text>
            </View>
          ) : null
        }
      />

      <Modal
        visible={suggestModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuggestModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Konu Önerisi 💡</Text>
              <TouchableOpacity onPress={() => setSuggestModalVisible(false)}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              Tartışılmasını istediğin fikri veya soruyu yaz:
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Önerinizi buraya yazın..."
              placeholderTextColor={themeColors.textMuted}
              value={suggestText}
              onChangeText={setSuggestText}
              multiline
              maxLength={300}
              autoFocus
            />
            <Text style={styles.charCount}>{suggestText.length}/300</Text>
            <TouchableOpacity style={styles.modalSubmitBtn} onPress={handleAndroidSuggestSubmit} activeOpacity={0.85}>
              <Text style={styles.modalSubmitText}>Öneriyi Gönder</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  header: { padding: Spacing.lg, paddingBottom: Spacing.md },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: 32, fontWeight: '900', color: themeColors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, marginTop: 4, lineHeight: 22 },
  suggestBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  suggestBtnText: {
    color: '#0F1923',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  listContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
  card: { 
    backgroundColor: themeColors.surface, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg, 
    borderWidth: 1, 
    borderColor: themeColors.border, 
    overflow: 'hidden',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 4
  },
  cardGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: themeColors.primary + '08',
  },
  cardContent: { padding: Spacing.lg },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: themeColors.primary + '10', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  badgeInactive: { backgroundColor: themeColors.surfaceLight },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontWeight: '900', color: themeColors.primary, letterSpacing: 0.5 },
  dateText: { fontSize: 11, color: themeColors.textMuted, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: themeColors.textPrimary, marginBottom: Spacing.xs, lineHeight: 28 },
  description: { fontSize: 14, color: themeColors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: themeColors.border + '50' },
  authorGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  authorAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: themeColors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  authorAvatarText: { fontSize: 12, fontWeight: 'bold', color: themeColors.primary },
  authorName: { fontSize: 13, fontWeight: '700', color: themeColors.textSecondary },
  commentInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  commentCount: { fontSize: 12, fontWeight: '800', color: themeColors.primary },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 1, borderColor: themeColors.border },
  emptyText: { fontSize: 18, fontWeight: '700', color: themeColors.textPrimary, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: themeColors.textMuted, textAlign: 'center', paddingHorizontal: 40 },
  // Android Konu Önerisi Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderColor: themeColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: themeColors.surface,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: themeColors.textPrimary,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: themeColors.textMuted,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  modalSubmitBtn: {
    backgroundColor: themeColors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modalSubmitText: {
    color: '#0F1923',
    fontWeight: '800',
    fontSize: 15,
  },
});

