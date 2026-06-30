import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { DAYS_OF_WEEK } from '@/constants/data';
import { BADGES, UserBadgeStats } from '@/constants/badges';
import BadgesModal from '@/components/BadgesModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppScreenHeader from '@/components/AppScreenHeader';

type MyEvent = {
  event_id: string;
  status: string;
  registered_at: string;
  events: {
    id: string;
    title: string;
    event_date: string | null;
    is_recurring: boolean;
    recurring_day: number | null;
    recurring_time: string | null;
    location: string | null;
  };
};

async function fetchMyEvents(userId: string): Promise<MyEvent[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('event_id, status, registered_at, events(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('registered_at', { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as MyEvent[];
}

async function fetchProfileStats(userId: string) {
  const [comments, profileData, followData] = await Promise.all([
    supabase.from('question_comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('profiles').select('points').eq('id', userId).single(),
    supabase.rpc('get_user_follow_counts', { target_user_id: userId }),
  ]);

  const follows = followData.data?.[0] || { followers_count: 0, following_count: 0 };

  return {
    commentsCount: comments.count || 0,
    points: profileData.data?.points || 0,
    followersCount: Number(follows.followers_count),
    followingCount: Number(follows.following_count),
  };
}

export default function ProfileScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const chipStyles = React.useMemo(() => createChipStyles(themeColors), [themeColors]);
  const { profile, signOut, setProfile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme } = useSettingsStore();
  const isLightMode = theme === 'light';
  const currentBackground = isLightMode ? '#FFFFFF' : themeColors.background;
  const currentSurface = isLightMode ? '#F5F7FA' : themeColors.surface;
  
  const [isBadgesModalVisible, setIsBadgesModalVisible] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile-stats', profile?.id] }),
        queryClient.invalidateQueries({ queryKey: ['my-events', profile?.id] }),
        queryClient.invalidateQueries({ queryKey: ['follow-requests-count', profile?.id] }),
      ]);
    } catch (e) {
      console.error('onRefresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [profile?.id, queryClient]);
  
  React.useEffect(() => {
    AsyncStorage.setItem('@fikirforum_last_profile_view', Date.now().toString()).catch(() => {});
  }, []);
 
  const privacyMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_private: newValue })
        .eq('id', profile!.id);
      if (error) throw error;
      return newValue;
    },
    onSuccess: (newValue) => {
      setProfile({ ...profile!, is_private: newValue });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profile?.id] });
    },
    onError: (error: any) => {
      Alert.alert('Hata', 'Gizlilik ayarı değiştirilemedi: ' + error.message);
    }
  });

  const { data: myEvents = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['my-events', profile?.id],
    queryFn: () => fetchMyEvents(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['profile-stats', profile?.id],
    queryFn: () => fetchProfileStats(profile!.id),
    enabled: !!profile?.id,
  });

  const badgeStats: UserBadgeStats = React.useMemo(() => ({
    commentsCount: stats?.commentsCount ?? 0,
    points: stats?.points ?? 0,
    followersCount: stats?.followersCount ?? 0,
    followingCount: stats?.followingCount ?? 0,
    eventsCount: myEvents?.length ?? 0,
  }), [stats, myEvents]);

  const earnedBadges = React.useMemo(() => BADGES.filter(b => b.isEarned(badgeStats)), [badgeStats]);

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil ⚠️',
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz (profil, katıldığınız etkinlikler, puanlar, yorumlar vb.) kalıcı olarak silinecektir.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabımı Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              // delete_user() RPC: auth.users dahil tüm kaydı siler (migration_v10)
              const { error } = await supabase.rpc('delete_user');
              if (error) throw error;
              await signOut();
            } catch (err: any) {
              Alert.alert('Hata', 'Hesap silinirken hata oluştu: ' + err.message);
            }
          },
        },
      ]
    );
  };

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
  }


  const { data: requestCount = 0 } = useQuery({
    queryKey: ['follow-requests-count', profile?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', profile!.id)
        .eq('status', 'pending');
      if (error) throw error;
      return count || 0;
    },
    enabled: !!profile?.id && profile?.is_private,
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
        }
      >
        <AppScreenHeader
          title="Hesabım"
          rightActions={
            <>
              {profile?.role === 'admin' && (
                <View style={styles.adminBadge}>
                  <Ionicons name="shield-checkmark" size={12} color={themeColors.primary} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsBadgesModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="medal-outline" size={18} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/(app)/profile/settings')}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={18} color={themeColors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => router.push('/(app)/profile/edit-profile')}
                activeOpacity={0.8}
              >
                <Ionicons name="create-outline" size={18} color={themeColors.primary} />
              </TouchableOpacity>
            </>
          }
        />

        {/* Takip İstekleri Bildirimi */}
        {requestCount > 0 && (
          <TouchableOpacity 
            style={styles.requestNotification} 
            onPress={() => router.push('/(app)/profile/requests')}
            activeOpacity={0.85}
          >
            <View style={styles.requestInfo}>
              <View style={styles.requestIconContainer}>
                <Ionicons name="people" size={20} color={themeColors.background} />
                <View style={styles.requestBadge}>
                  <Text style={styles.requestBadgeText}>{requestCount}</Text>
                </View>
              </View>
              <View>
                <Text style={styles.requestTitle}>Takip İstekleri</Text>
                <Text style={styles.requestSubtitle}>{requestCount} yeni takip isteğin var</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
          </TouchableOpacity>
        )}

        {/* Profil Kartı */}
        <View style={[styles.profileCard]}>
          <LinearGradient
            colors={[themeColors.primary + '10', 'transparent']}
            style={styles.cardHeaderGradient}
          />
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[themeColors.primary, themeColors.primary + '88', themeColors.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarOuterRing}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile?.full_name ?? 'U')}</Text>
              </View>
            </LinearGradient>
          </View>

          <Text style={[styles.profileName, !profile?.username && { marginBottom: Spacing.md }]}>{profile?.full_name}</Text>
          {profile?.username && (
            <Text style={styles.profileUsername}>@{profile.username}</Text>
          )}

          {/* Biyografi */}
          {profile?.bio ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{profile.bio}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bioEmpty}
              onPress={() => router.push('/(app)/profile/edit-profile')}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil-outline" size={12} color={themeColors.primary} />
              <Text style={styles.bioEmptyText}>Biyografi ekle...</Text>
            </TouchableOpacity>
          )}

          {/* Premium İstatistik Paneli */}
          <View style={styles.statsDashboard}>
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statDashboardItem}
                onPress={() => router.push({ pathname: '/(app)/profile/follows', params: { userId: profile?.id, initialTab: 'followers' } })}
                activeOpacity={0.7}
              >
                <Text style={styles.statDashboardValue}>{stats?.followersCount ?? 0}</Text>
                <Text style={styles.statDashboardLabel}>Takipçi</Text>
              </TouchableOpacity>
              
              <View style={styles.statDashboardDivider} />
              
              <TouchableOpacity 
                style={styles.statDashboardItem}
                onPress={() => router.push({ pathname: '/(app)/profile/follows', params: { userId: profile?.id, initialTab: 'following' } })}
                activeOpacity={0.7}
              >
                <Text style={styles.statDashboardValue}>{stats?.followingCount ?? 0}</Text>
                <Text style={styles.statDashboardLabel}>Takip</Text>
              </TouchableOpacity>

              <View style={styles.statDashboardDivider} />

              <View style={styles.statDashboardItem}>
                <Text style={styles.statDashboardValue}>{stats?.points ?? 0}</Text>
                <Text style={styles.statDashboardLabel}>Puan</Text>
              </View>
            </View>

            <View style={styles.statsDashboardFooter}>
              <View style={styles.footerStatItem}>
                <Ionicons name="calendar-outline" size={14} color={themeColors.textSecondary} />
                <Text style={styles.footerStatText}>
                  <Text style={styles.footerStatHighlight}>{myEvents.length}</Text> Etkinlik
                </Text>
              </View>
              <View style={styles.footerStatDivider} />
              <View style={styles.footerStatItem}>
                <Ionicons name="chatbubbles-outline" size={14} color={themeColors.textSecondary} />
                <Text style={styles.footerStatText}>
                  <Text style={styles.footerStatHighlight}>{stats?.commentsCount ?? 0}</Text> Yorum
                </Text>
              </View>
            </View>
          </View>


          
          {/* Rozetler Bölümü */}
          <View style={styles.badgesSection}>
            <View style={styles.badgesHeader}>
              <Text style={styles.badgesTitle}>Rozetler</Text>
              <TouchableOpacity onPress={() => setIsBadgesModalVisible(true)}>
                <Text style={styles.viewAllBadgesText}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            
            {earnedBadges.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesList}>
                {earnedBadges.map(badge => (
                  <View key={badge.id} style={styles.earnedBadgeItem}>
                    <LinearGradient colors={badge.colors} style={styles.earnedBadgeIconContainer}>
                      <Ionicons name={badge.icon as any} size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.earnedBadgeTitle} numberOfLines={1}>{badge.title}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <TouchableOpacity style={styles.noBadgesBox} onPress={() => setIsBadgesModalVisible(true)}>
                <Ionicons name="medal-outline" size={32} color={themeColors.textMuted} />
                <Text style={styles.noBadgesText}>Henüz rozet kazanılmadı.</Text>
                <Text style={styles.noBadgesSubtext}>Nasıl kazanılacağını öğren!</Text>
              </TouchableOpacity>
            )}
          </View>
 
          {/* Hızlı Gizlilik Ayarı */}
          <View style={styles.privacySection}>
            <View style={styles.privacyInfo}>
              <View style={styles.privacyIconContainer}>
                <Ionicons 
                  name={profile?.is_private ? "lock-closed" : "lock-open"} 
                  size={20} 
                  color={profile?.is_private ? themeColors.primary : themeColors.textSecondary} 
                />
              </View>
              <View>
                <Text style={styles.privacyTitle}>Hesap Gizliliği</Text>
                <Text style={styles.privacyStatus}>
                  {profile?.is_private ? 'Hesabın şu an gizli' : 'Hesabın şu an herkese açık'}
                </Text>
              </View>
            </View>
            {privacyMutation.isPending ? (
              <ActivityIndicator size="small" color={themeColors.primary} />
            ) : (
              <Switch
                value={profile?.is_private}
                onValueChange={(v) => privacyMutation.mutate(v)}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={Platform.OS === 'ios' ? '#fff' : profile?.is_private ? '#fff' : '#f4f3f4'}
              />
            )}
          </View>
        </View>

        {/* Katıldığım Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kayıtlı Etkinliklerim</Text>
        </View>

        {myEvents.length === 0 && !isEventsLoading && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={48} color={themeColors.textMuted} />
            <Text style={styles.emptyStateText}>Henüz kayıtlı olduğun etkinlik yok.</Text>
          </View>
        )}

        {myEvents.map((item) => {
          const ev = item.events;
          const dateStr = ev.is_recurring
            ? `Her ${DAYS_OF_WEEK[ev.recurring_day!]} · ${ev.recurring_time?.slice(0, 5)}`
            : ev.event_date
            ? formatDate(ev.event_date)
            : '—';

          return (
            <TouchableOpacity
              key={item.event_id}
              style={styles.eventItem}
              onPress={() => router.push(`/(app)/events/${item.event_id}`)}
              activeOpacity={0.85}
            >
              <View style={styles.eventItemIcon}>
                <Ionicons
                  name={ev.is_recurring ? 'repeat' : 'calendar'}
                  size={18}
                  color={themeColors.primary}
                />
              </View>
              <View style={styles.eventItemContent}>
                <Text style={styles.eventItemTitle} numberOfLines={1}>{ev.title}</Text>
                <Text style={styles.eventItemDate}>{dateStr}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
            </TouchableOpacity>
          );
        })}

        {/* Çıkış Yap & Hesabı Sil */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={20} color={themeColors.error} />
          <Text style={styles.signOutText}>Çıkış Yap</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={20} color={themeColors.error} />
          <Text style={styles.deleteAccountText}>Hesabımı Sil</Text>
        </TouchableOpacity>
      </ScrollView>

      <BadgesModal
        visible={isBadgesModalVisible}
        onClose={() => setIsBadgesModalVisible(false)}
        userStats={badgeStats}
      />
    </SafeAreaView>
  );
}

function InfoChip({ icon, label, color }: { icon?: string; label: string; color?: string }) {
  const themeColors = useThemeColors();
  const chipStyles = React.useMemo(() => createChipStyles(themeColors), [themeColors]);
  return (
    <View style={chipStyles.container}>
      {icon && <Ionicons name={icon as any} size={13} color={color ?? themeColors.textSecondary} />}
      <Text style={[chipStyles.text, color && { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const createChipStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: themeColors.surfaceLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  text: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    fontWeight: '500',
    maxWidth: 130,
  },
});

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing.xl },
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
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: themeColors.primary + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full },
  adminBadgeText: { fontSize: 11, color: themeColors.primary, fontWeight: '700' },
  editButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  profileCard: { 
    backgroundColor: themeColors.surface, 
    borderRadius: BorderRadius.xl * 1.25, 
    padding: Spacing.lg + 4, 
    marginBottom: Spacing.lg, 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: themeColors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  cardHeaderGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  avatarContainer: { position: 'relative', marginBottom: Spacing.md },
  avatarOuterRing: {
    padding: 3,
    borderRadius: 50,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: { 
    width: 86, 
    height: 86, 
    borderRadius: 43, 
    backgroundColor: themeColors.primary, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: themeColors.surface,
  },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  genderDot: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: themeColors.surface },
  profileName: { fontSize: 23, fontWeight: '900', color: themeColors.textPrimary, marginBottom: 4, letterSpacing: -0.5 },
  profileUsername: { fontSize: 14, color: themeColors.primary, fontWeight: '700', marginBottom: Spacing.sm, opacity: 0.9, letterSpacing: 0.2 },
  bioContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
    maxWidth: '90%',
  },
  bioText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  bioEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: themeColors.primary + '44',
    borderStyle: 'dashed',
    backgroundColor: themeColors.primary + '08',
  },
  bioEmptyText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.primary,
    fontWeight: '600',
    opacity: 0.8,
  },
  
  statsDashboard: {
    width: '100%',
    backgroundColor: themeColors.surfaceLight + '50',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderLight,
  },
  statDashboardItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDashboardValue: {
    fontSize: 22,
    fontWeight: '900',
    color: themeColors.primary,
    letterSpacing: -0.5,
  },
  statDashboardLabel: {
    fontSize: 11,
    color: themeColors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  statDashboardDivider: {
    width: 1.5,
    height: 32,
    backgroundColor: themeColors.border,
    alignSelf: 'center',
    borderRadius: 1,
  },
  statsDashboardFooter: {
    flexDirection: 'row',
    backgroundColor: themeColors.background,
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  footerStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: themeColors.border,
  },
  footerStatText: {
    fontSize: 12,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  footerStatHighlight: {
    color: themeColors.textPrimary,
    fontWeight: '800',
  },
  profileInfoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: Spacing.sm, 
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  section: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  sectionSubtitle: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyStateText: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, textAlign: 'center' },
  eventItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: themeColors.border },
  eventItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: themeColors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  eventItemContent: { flex: 1 },
  eventItemTitle: { fontSize: Typography.fontSize.md, fontWeight: '600', color: themeColors.textPrimary },
  eventItemDate: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, marginTop: 2 },
  signOutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: themeColors.error + '11', borderWidth: 1, borderColor: themeColors.error + '33' },
  signOutText: { fontSize: Typography.fontSize.md, fontWeight: '700', color: themeColors.error },
  deleteAccountButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: 'transparent', borderWidth: 1, borderColor: themeColors.error + '55' },
  deleteAccountText: { fontSize: Typography.fontSize.md, fontWeight: '700', color: themeColors.error },
  privacySection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: themeColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.borderLight,
  },
  privacyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  privacyIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  privacyStatus: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  requestNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeColors.primary + '15',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.primary + '33',
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  requestIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  requestBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: themeColors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: themeColors.background,
  },
  requestBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
  },
  requestTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  requestSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  badgesSection: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: themeColors.borderLight,
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  badgesTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  viewAllBadgesText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: themeColors.primary,
  },
  badgesList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  earnedBadgeItem: {
    alignItems: 'center',
    width: 64,
  },
  earnedBadgeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  earnedBadgeTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: themeColors.textSecondary,
    textAlign: 'center',
  },
  noBadgesBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: themeColors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderStyle: 'dashed',
  },
  noBadgesText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: themeColors.textSecondary,
    marginTop: 8,
  },
  noBadgesSubtext: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
});

