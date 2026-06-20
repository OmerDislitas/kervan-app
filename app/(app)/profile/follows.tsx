import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FollowItem = {
  profiles: {
    id: string;
    full_name: string;
    username: string | null;
  };
};

export default function FollowsScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const { userId, initialTab } = useLocalSearchParams<{ userId: string; initialTab: 'followers' | 'following' }>();
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab || 'followers');
  const { profile: currentUser } = useAuthStore();
  const router = useRouter();

  // Privacy check: only allow viewing own follow lists or mutual follows
  const isOwnProfile = userId === currentUser?.id;

  // Mutual follow check
  const { data: isMutual, isLoading: isMutualCheckLoading } = useQuery({
    queryKey: ['mutual-follow-check', currentUser?.id, userId],
    queryFn: async () => {
      if (!currentUser?.id || !userId || currentUser.id === userId) return false;
      const { data: records, error } = await supabase
        .from('follows')
        .select('*')
        .or(`and(follower_id.eq.${currentUser.id},following_id.eq.${userId},status.eq.accepted),and(follower_id.eq.${userId},following_id.eq.${currentUser.id},status.eq.accepted)`);
      
      if (error) throw error;
      return (records?.length ?? 0) === 2;
    },
    enabled: !!currentUser?.id && !!userId && userId !== currentUser.id,
  });

  const isAllowed = isOwnProfile || isMutual === true;

  const [searchQuery, setSearchQuery] = useState('');

  const { data: list = [], isLoading, refetch } = useQuery({
    queryKey: ['follows', userId, activeTab],
    queryFn: async () => {
      if (!isAllowed) return [];

      const isFollowers = activeTab === 'followers';
      const selectCol = isFollowers ? 'follower_id' : 'following_id';
      const filterCol = isFollowers ? 'following_id' : 'follower_id';

      const { data, error } = await supabase
        .from('follows')
        .select(`
          profiles!${selectCol} (
            id,
            full_name,
            username
          )
        `)
        .eq(filterCol, userId);

      if (error) throw error;
      
      // Filter out any rows where the profile join might have failed
      const result = (data as any[] || []).filter(item => !!item.profiles);
      return result as FollowItem[];
    },
    enabled: !!userId && !!currentUser?.id && isAllowed,
  });

  const filteredList = list.filter(item => 
    item.profiles && (
      item.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.profiles.username?.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  // Redirect if not allowed
  React.useEffect(() => {
    if (userId && currentUser?.id && !isOwnProfile && isMutual === false) {
      Alert.alert(
        'Erişim Sınırlandırıldı 🔒', 
        'Bu kullanıcının takipçi listesini görmek için karşılıklı takipleşmeniz gerekmektedir.'
      );
      router.replace('/(app)/profile');
    }
  }, [userId, currentUser?.id, isOwnProfile, isMutual]);

  if (userId && currentUser?.id && !isOwnProfile && isMutual === undefined) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={themeColors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isAllowed) return null;

  const renderItem = ({ item }: { item: FollowItem }) => {
    const p = item.profiles;
    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => router.push(`/(app)/profile/${p.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{p.full_name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userHandle}>@{p.username || p.full_name.toLowerCase().replace(' ', '')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bağlantılar</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('followers')}
        >
          <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>Takipçiler</Text>
          {activeTab === 'followers' && <View style={styles.activeTabLine} />}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.tab}
          onPress={() => setActiveTab('following')}
        >
          <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Takip Edilen</Text>
          {activeTab === 'following' && <View style={styles.activeTabLine} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchBarContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={themeColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Ara..."
            placeholderTextColor={themeColors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={themeColors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filteredList}
          keyExtractor={(item) => item.profiles.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrapper}>
                <Ionicons name="people-outline" size={48} color={themeColors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Burada henüz kimse yok</Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'followers' ? 'Seni takip eden kimse yok.' : 'Henüz kimseyi takip etmiyorsun.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    backgroundColor: themeColors.surface,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginLeft: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  tab: {
    marginRight: Spacing.lg,
    paddingVertical: 8,
    position: 'relative',
  },
  tabText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: themeColors.textSecondary,
  },
  activeTabText: {
    color: themeColors.primary,
    fontWeight: '800',
  },
  activeTabLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.full,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: themeColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: themeColors.textPrimary,
  },
  listContainer: {
    padding: Spacing.lg,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: themeColors.primary + '22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.primary + '44',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: themeColors.primary,
  },
  userInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'center',
  },
  userHandle: {
    fontSize: 17,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: themeColors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
