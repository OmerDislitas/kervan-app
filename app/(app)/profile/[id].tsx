import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { sendPushNotification } from '@/lib/notificationService';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { DAYS_OF_WEEK } from '@/constants/data';
import { LinearGradient } from 'expo-linear-gradient';
import { BADGES, UserBadgeStats } from '@/constants/badges';

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

async function fetchUserProfile(userId: string) {
  // Başka kullanıcının profili: yalnızca herkese açık güvenli kolonlar.
  // email/phone/push_token ARTIK okunamaz (PII koruması — security_fixes.sql K-2).
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, bio, gender, role, is_private, points, followers_count, following_count, university_name, department, university_year, created_at')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

async function fetchUserEvents(userId: string): Promise<MyEvent[]> {
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

async function checkFollowStatus(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  
  if (error) throw error;
  return data; // { id, status, ... } or null
}

async function checkFollowBackStatus(followerId: string, followingId: string) {
  const { data, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile: currentProfile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  // Kendi profilini görüntülemeye çalışıyorsa ana profil sayfasına yönlendir.
  // useEffect içinde yapılmazsa render sırasında navigation tetiklenip
  // "Cannot update a component while rendering a different component" hatası alınır.
  React.useEffect(() => {
    if (id && currentProfile?.id && id === currentProfile.id) {
      router.replace('/(app)/profile');
    }
  }, [id, currentProfile?.id]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-profile', id] }),
        queryClient.invalidateQueries({ queryKey: ['user-events', id] }),
        queryClient.invalidateQueries({ queryKey: ['profile-stats', id] }),
        queryClient.invalidateQueries({ queryKey: ['follow-status', currentProfile?.id, id] }),
        queryClient.invalidateQueries({ queryKey: ['follow-back-status', currentProfile?.id, id] }),
      ]);
    } catch (e) {
      console.error('onRefresh user error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [id, currentProfile?.id, queryClient]);

  const { data: userProfile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['user-profile', id],
    queryFn: () => fetchUserProfile(id),
    enabled: !!id,
  });

  const { data: userEvents = [], isLoading: isEventsLoading } = useQuery({
    queryKey: ['user-events', id],
    queryFn: () => fetchUserEvents(id),
    enabled: !!id,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['profile-stats', id],
    queryFn: () => fetchProfileStats(id),
    enabled: !!id,
  });

  const { data: followRecord, isLoading: isFollowLoading } = useQuery({
    queryKey: ['follow-status', currentProfile?.id, id],
    queryFn: () => checkFollowStatus(currentProfile!.id, id),
    enabled: !!id && !!currentProfile?.id,
  });

  const { data: followBackRecord } = useQuery({
    queryKey: ['follow-back-status', currentProfile?.id, id],
    queryFn: () => checkFollowBackStatus(id, currentProfile!.id),
    enabled: !!id && !!currentProfile?.id,
  });

  const isFollowing = followRecord?.status === 'accepted';
  const isPending = followRecord?.status === 'pending';
  const isMutual = isFollowing && followBackRecord?.status === 'accepted';

  const followMutation = useMutation({
    mutationFn: async () => {
      const isTargetPrivate = userProfile?.is_private;
      const { error } = await supabase
        .from('follows')
        .insert({ 
          follower_id: currentProfile!.id, 
          following_id: id,
          status: isTargetPrivate ? 'pending' : 'accepted'
        });
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follow-status', currentProfile?.id, id] });
      await queryClient.cancelQueries({ queryKey: ['profile-stats', id] });

      // Save last follow time for compass task verification
      AsyncStorage.setItem('@kervan_last_follow', Date.now().toString()).catch(() => {});

      const previousRecord = queryClient.getQueryData(['follow-status', currentProfile?.id, id]);
      const previousStats = queryClient.getQueryData(['profile-stats', id]);

      const isTargetPrivate = userProfile?.is_private;
      queryClient.setQueryData(['follow-status', currentProfile?.id, id], { status: isTargetPrivate ? 'pending' : 'accepted' });
      
      if (!isTargetPrivate) {
        queryClient.setQueryData(['profile-stats', id], (old: any) => ({
          ...old,
          followersCount: (old?.followersCount ?? 0) + 1,
        }));
      }

      return { previousRecord, previousStats };
    },
    onError: (err: any, newTodo, context) => {
      queryClient.setQueryData(['follow-status', currentProfile?.id, id], context?.previousRecord);
      queryClient.setQueryData(['profile-stats', id], context?.previousStats);
      Alert.alert('Hata', 'İşlem başarısız: ' + err.message);
    },
    onSuccess: () => {
      const isTargetPrivate = userProfile?.is_private;
      if (isTargetPrivate) {
        sendPushNotification(id, 'Yeni Takip İsteği! 👥', 'Biri sana takip isteği gönderdi.', { type: 'follow-request' }).catch(() => {});
      } else {
        sendPushNotification(id, 'Yeni Bir Takipçi! 👥', 'Biri seni takip etmeye başladı.', { type: 'new-follower' }).catch(() => {});
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', currentProfile?.id, id] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', currentProfile?.id] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentProfile!.id)
        .eq('following_id', id);
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['follow-status', currentProfile?.id, id] });
      await queryClient.cancelQueries({ queryKey: ['profile-stats', id] });

      const previousRecord = queryClient.getQueryData(['follow-status', currentProfile?.id, id]);
      const previousStats = queryClient.getQueryData(['profile-stats', id]);

      queryClient.setQueryData(['follow-status', currentProfile?.id, id], null);
      
      if (isFollowing) {
        queryClient.setQueryData(['profile-stats', id], (old: any) => ({
          ...old,
          followersCount: Math.max(0, (old?.followersCount ?? 0) - 1),
        }));
      }

      return { previousRecord, previousStats };
    },
    onError: (err: any, newTodo, context) => {
      queryClient.setQueryData(['follow-status', currentProfile?.id, id], context?.previousRecord);
      queryClient.setQueryData(['profile-stats', id], context?.previousStats);
      Alert.alert('Hata', 'İşlem başarısız: ' + err.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-status', currentProfile?.id, id] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', currentProfile?.id] });
    },
  });

  const handleFollowPress = () => {
    if (isFollowing || isPending) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const handleFollowersPress = () => {
    if (isMutual) {
      router.push({ pathname: '/(app)/profile/follows', params: { userId: id, initialTab: 'followers' } });
    } else {
      Alert.alert('Erişim Sınırlandırıldı 🔒', 'Bu kullanıcının takipçi listesini görmek için karşılıklı takipleşmeniz gerekmektedir.');
    }
  };

  const handleFollowingPress = () => {
    if (isMutual) {
      router.push({ pathname: '/(app)/profile/follows', params: { userId: id, initialTab: 'following' } });
    } else {
      Alert.alert('Erişim Sınırlandırıldı 🔒', 'Bu kullanıcının takip edilenler listesini görmek için karşılıklı takipleşmeniz gerekmektedir.');
    }
  };

  const badgeStats: UserBadgeStats = React.useMemo(() => ({
    commentsCount: stats?.commentsCount ?? 0,
    points: stats?.points ?? 0,
    followersCount: stats?.followersCount ?? 0,
    followingCount: stats?.followingCount ?? 0,
    eventsCount: userEvents?.length ?? 0,
  }), [stats, userEvents]);

  const earnedBadges = React.useMemo(() => BADGES.filter(b => b.isEarned(badgeStats)), [badgeStats]);

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

  if (isProfileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={themeColors.primary} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  const isPrivate = userProfile?.is_private;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} tintColor={themeColors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Profil Kartı */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[themeColors.primary + '15', 'transparent']}
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
                <Text style={styles.avatarText}>{getInitials(userProfile?.full_name ?? 'U')}</Text>
              </View>
            </LinearGradient>
          </View>

          <Text style={styles.profileName}>{userProfile?.full_name}</Text>
          {userProfile?.username && (
            <Text style={styles.profileUsername}>@{userProfile.username}</Text>
          )}

          {/* Biyografi */}
          {userProfile?.bio ? (
            <View style={styles.bioContainer}>
              <Text style={styles.bioText}>{userProfile.bio}</Text>
            </View>
          ) : null}

          {/* Premium İstatistik Paneli */}
          <View style={styles.statsDashboard}>
            <View style={styles.statsRow}>
              <TouchableOpacity 
                style={styles.statDashboardItem}
                onPress={handleFollowersPress}
                activeOpacity={0.7}
              >
                <Text style={styles.statDashboardValue}>{stats?.followersCount ?? 0}</Text>
                <Text style={styles.statDashboardLabel}>Takipçi</Text>
              </TouchableOpacity>
              
              <View style={styles.statDashboardDivider} />
              
              <TouchableOpacity 
                style={styles.statDashboardItem}
                onPress={handleFollowingPress}
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
                  <Text style={styles.footerStatHighlight}>{userEvents.length}</Text> Etkinlik
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

          {/* Follow Button */}
          <TouchableOpacity 
            style={[
              styles.followButton, 
              (isFollowing || isPending) && styles.followingButton
            ]}
            onPress={handleFollowPress}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isFollowing || isPending ? "person-remove" : "person-add"} 
              size={18} 
              color={isFollowing || isPending ? themeColors.primary : "#fff"} 
            />
            <Text style={[
              styles.followButtonText,
              (isFollowing || isPending) && styles.followingButtonText
            ]}>
              {isFollowing ? 'Takibi Bırak' : isPending ? 'İstek Gönderildi' : 'Takip Et'}
            </Text>
          </TouchableOpacity>
          
          {/* Rozetler Bölümü (Herkes görebilir) */}
          <View style={styles.badgesSection}>
            <View style={styles.badgesHeader}>
              <Text style={styles.badgesTitle}>Rozetler</Text>
            </View>
            
            {earnedBadges.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesList}>
                {earnedBadges.map(badge => (
                  <View key={badge.id} style={styles.earnedBadgeItem}>
                    <LinearGradient colors={badge.colors as [string, string]} style={styles.earnedBadgeIconContainer}>
                      <Ionicons name={badge.icon as any} size={20} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.earnedBadgeTitle} numberOfLines={1}>{badge.title}</Text>
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noBadgesBox}>
                <Ionicons name="medal-outline" size={32} color={themeColors.textMuted} />
                <Text style={styles.noBadgesText}>Henüz rozet kazanılmadı.</Text>
              </View>
            )}
          </View>


        </View>

        {/* Katıldığı Etkinlikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Katıldığı Etkinlikler</Text>
        </View>

        {isPrivate ? (
          <View style={styles.privateState}>
            <Ionicons name="lock-closed-outline" size={48} color={themeColors.textMuted} />
            <Text style={styles.privateStateText}>Bu kullanıcı hesabını gizledi.</Text>
            <Text style={styles.privateStateSubtext}>Etkinlik geçmişi görüntülenemez.</Text>
          </View>
        ) : (
          <>
            {userEvents.length === 0 && !isEventsLoading && (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-clear-outline" size={48} color={themeColors.textMuted} />
                <Text style={styles.emptyStateText}>Henüz kayıtlı olduğu bir etkinlik yok.</Text>
              </View>
            )}

            {userEvents.map((item) => {
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
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoChip({ icon, label, color, themeColors }: { icon?: string; label: string; color?: string; themeColors: any }) {
  return (
    <View style={[chipStyles(themeColors).container]}>
      {icon && <Ionicons name={icon as any} size={13} color={color ?? themeColors.textSecondary} />}
      <Text style={[chipStyles(themeColors).text, color && { color }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const chipStyles = (themeColors: any) => StyleSheet.create({
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.lg },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '800', color: themeColors.textPrimary },
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
  avatarImage: { width: '100%', height: '100%' },
  avatarText: { fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
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
  statsDashboard: {
    width: '100%',
    backgroundColor: themeColors.surfaceLight + '50',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
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
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.full,
    gap: 8,
    marginBottom: Spacing.lg,
    width: '80%',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  followingButton: {
    backgroundColor: themeColors.surface,
    borderWidth: 1.5,
    borderColor: themeColors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  followButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  followingButtonText: {
    color: themeColors.primary,
  },
  profileInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, justifyContent: 'center' },
  section: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  emptyStateText: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, textAlign: 'center' },
  eventItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: themeColors.border },
  eventItemIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: themeColors.primary + '22', alignItems: 'center', justifyContent: 'center' },
  eventItemContent: { flex: 1 },
  eventItemTitle: { fontSize: Typography.fontSize.md, fontWeight: '600', color: themeColors.textPrimary },
  eventItemDate: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, marginTop: 2 },
  privateState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginHorizontal: Spacing.xs,
  },
  privateStateText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginTop: Spacing.sm,
  },
  privateStateSubtext: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
  },
  badgesSection: {
    width: '100%',
    marginTop: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: themeColors.border,
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
});

