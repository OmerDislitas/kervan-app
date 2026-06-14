import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { sendPushNotification } from '@/lib/notificationService';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

type FollowRequest = {
  id: string;
  follower_id: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string;
    username: string | null;
  };
};

async function fetchFollowRequests(userId: string): Promise<FollowRequest[]> {
  const { data, error } = await supabase
    .from('follows')
    .select('id, follower_id, created_at, profiles:follower_id(id, full_name, username)')
    .eq('following_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as any) || [];
}

export default function FollowRequestsScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const { profile } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['follow-requests', profile?.id],
    queryFn: () => fetchFollowRequests(profile!.id),
    enabled: !!profile?.id,
  });

  const acceptMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('id', requestId);
      if (error) throw error;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: ['follow-requests', profile?.id] });
      const previousRequests = queryClient.getQueryData(['follow-requests', profile?.id]);
      queryClient.setQueryData(['follow-requests', profile?.id], (old: any[] = []) => 
        old.filter(r => r.id !== requestId)
      );
      return { previousRequests };
    },
    onSuccess: (_, requestId) => {
      const req = requests.find(r => r.id === requestId);
      if (req) {
        sendPushNotification(req.follower_id, 'Takip İsteğin Kabul Edildi! 👥', 'Takip isteğin kabul edildi.', { type: 'follow-accepted' }).catch(() => {});
      }
      queryClient.invalidateQueries({ queryKey: ['follow-requests', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['profile-stats', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['follow-requests-count', profile?.id] });
    },
    onError: (error, requestId, context) => {
      queryClient.setQueryData(['follow-requests', profile?.id], context?.previousRequests);
      Alert.alert('Hata', 'İstek kabul edilemedi: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests', profile?.id] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('id', requestId);
      if (error) throw error;
    },
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: ['follow-requests', profile?.id] });
      const previousRequests = queryClient.getQueryData(['follow-requests', profile?.id]);
      queryClient.setQueryData(['follow-requests', profile?.id], (old: any[] = []) => 
        old.filter(r => r.id !== requestId)
      );
      return { previousRequests };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests', profile?.id] });
      queryClient.invalidateQueries({ queryKey: ['follow-requests-count', profile?.id] });
    },
    onError: (error, requestId, context) => {
      queryClient.setQueryData(['follow-requests', profile?.id], context?.previousRequests);
      Alert.alert('Hata', 'İstek reddedilemedi: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['follow-requests', profile?.id] });
    },
  });

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const renderItem = ({ item }: { item: FollowRequest }) => (
    <View style={styles.requestItem}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(item.profiles.full_name)}</Text>
        </View>
        <View style={styles.nameContainer}>
          <Text style={styles.fullName}>{item.profiles.full_name}</Text>
          {item.profiles.username && (
            <Text style={styles.username}>@{item.profiles.username}</Text>
          )}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.acceptButton} 
          onPress={() => acceptMutation.mutate(item.id)}
          disabled={acceptMutation.isPending}
        >
          {acceptMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.rejectButton} 
          onPress={() => rejectMutation.mutate(item.id)}
          disabled={rejectMutation.isPending}
        >
          <Ionicons name="close" size={20} color={themeColors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Takip İstekleri</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people-outline" size={64} color={themeColors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Henüz İstek Yok</Text>
          <Text style={styles.emptySubtitle}>
            Yeni takip istekleri geldiğinde burada görünecektir.
          </Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.borderLight,
  },
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
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.lg,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: themeColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: themeColors.background,
  },
  nameContainer: {
    gap: 2,
  },
  fullName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  username: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.primary,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
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
