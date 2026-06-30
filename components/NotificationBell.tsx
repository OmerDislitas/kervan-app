import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

const STORAGE_KEY = '@fikirforum_notifications';
const MAX_NOTIFICATIONS = 30;

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  date: string; // ISO string
  read: boolean;
  type?: string;
  eventId?: string;
  data?: Record<string, any>;
};

async function loadStoredNotifications(): Promise<NotificationItem[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

async function saveNotifications(items: NotificationItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // ignore
  }
}

export default function NotificationBell() {
  const themeColors = useThemeColors();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dbNotifications, setDbNotifications] = useState<NotificationItem[]>([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();
  const { profile } = useAuthStore();

  // Tüm bildirimler: DB (sosyal) + yerel (push/zamanlı), tarihe göre sıralı
  const allNotifications = useMemo(() => {
    const merged = [...dbNotifications, ...notifications];
    const seen = new Set<string>();
    return merged
      .filter((n) => { if (seen.has(n.id)) return false; seen.add(n.id); return true; })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dbNotifications, notifications]);

  const unreadCount = allNotifications.filter((n) => !n.read).length;

  // İlk yükleme — AsyncStorage'dan oku
  useEffect(() => {
    loadStoredNotifications().then(setNotifications);
  }, []);

  // Supabase'den sosyal bildirimleri yükle + real-time dinle
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!profile?.id) return;

    // Önceki kanalı temizle
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (data) {
          setDbNotifications(
            data.map((n: any) => ({
              id: n.id,
              title: n.title,
              body: n.body,
              date: n.created_at,
              read: n.is_read,
              type: n.type,
              data: n.data,
            }))
          );
        }
      });

    // Benzersiz kanal adı: her mount'ta farklı olsun
    const channelName = `notifications:${profile.id}:${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          const n = payload.new as any;
          const item: NotificationItem = {
            id: n.id,
            title: n.title,
            body: n.body,
            date: n.created_at,
            read: n.is_read,
            type: n.type,
            data: n.data,
          };
          setDbNotifications((prev) => {
            if (prev.some((x) => x.id === item.id)) return prev;
            return [item, ...prev];
          });
          Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
          ]).start();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [profile?.id]);

  // Yeni bildirim gelince listeye ekle + kaydet
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const newItem: NotificationItem = {
        id: notification.request.identifier,
        title: notification.request.content.title ?? 'Bildirim',
        body: notification.request.content.body ?? '',
        date: new Date().toISOString(),
        read: false,
        type: (notification.request.content.data as any)?.type || (notification.request.content.data as any)?.data?.type,
        eventId: (notification.request.content.data as any)?.eventId || (notification.request.content.data as any)?.data?.eventId,
      };

      setNotifications((prev) => {
        // Aynı id varsa ekleme
        if (prev.some((n) => n.id === newItem.id)) return prev;
        const updated = [newItem, ...prev];
        saveNotifications(updated);
        return updated;
      });

      // Zil animasyonu
      Animated.sequence([
        Animated.spring(scaleAnim, { toValue: 1.35, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
      ]).start();
    });

    return () => sub.remove();
  }, []);

  const markAsRead = (notifId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notifId ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
    setDbNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    supabase.from('notifications').update({ is_read: true }).eq('id', notifId).then();
  };

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
    if (profile?.id) {
      setDbNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).then();
    }
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
    if (profile?.id) {
      setDbNotifications([]);
      supabase.from('notifications').delete().eq('user_id', profile.id).then();
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} sa önce`;
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getIcon = (item: NotificationItem): 'add-circle' | 'alarm' | 'calendar' | 'chatbubble' | 'heart' | 'people' | 'person-add' | 'checkmark-circle' => {
    if (item.type === 'comment-reply') return 'chatbubble';
    if (item.type === 'comment-like') return 'heart';
    if (item.type === 'new-event') return 'add-circle';
    if (item.type === 'event-reminder') return 'alarm';
    if (item.type === 'new-follower') return 'people';
    if (item.type === 'follow-request') return 'person-add';
    if (item.type === 'follow-accepted') return 'checkmark-circle';
    if (item.title?.includes('Yeni')) return 'add-circle';
    return 'calendar';
  };

  return (
    <>
      <TouchableOpacity
        style={styles.bellBtn}
        onPress={() => {
          setVisible(true);
        }}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
            size={22}
            color={unreadCount > 0 ? themeColors.primary : themeColors.textSecondary}
          />
        </Animated.View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        />
        <View style={styles.panel}>
          {/* Panel header */}
          <View style={styles.panelHeader}>
            <View style={styles.panelTitleRow}>
              <Ionicons name="notifications" size={18} color={themeColors.primary} />
              <Text style={styles.panelTitle}>Bildirimler</Text>
              {allNotifications.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{allNotifications.length}</Text>
                </View>
              )}
            </View>
            {allNotifications.length > 0 && (
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={markAllRead} style={{ marginRight: Spacing.md }}>
                  <Text style={styles.markReadText}>Hepsini Oku</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={clearAll}>
                  <Text style={styles.clearText}>Temizle</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.list}>
            {allNotifications.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={40} color={themeColors.textMuted} />
                <Text style={styles.emptyTitle}>Bildirim yok</Text>
                <Text style={styles.emptySubtitle}>
                  Etkinliklere kayıt olduğunda ve yeni etkinlikler eklendiğinde burada görünecek.
                </Text>
              </View>
            ) : (
              allNotifications.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.notifItem, !item.read && styles.notifItemUnread]}
                  onPress={() => {
                    markAsRead(item.id);
                    setVisible(false);
                    // Sosyal bildirimler: yoruma/beğeniye git
                    const socialTypes = ['comment-reply', 'comment-like'];
                    const questionId = (item as any).data?.questionId;
                    if (socialTypes.includes(item.type || '') && questionId) {
                      router.push(`/(app)/soz-sende/${questionId}` as any);
                    } else if (item.type === 'new-follower' || item.type === 'follow-accepted') {
                      const followerId = (item as any).data?.followerId || (item as any).data?.followingId;
                      if (followerId) {
                        router.push(`/(app)/profile/${followerId}` as any);
                      } else {
                        router.push('/(app)/profile');
                      }
                    } else if (item.type === 'follow-request') {
                      router.push('/(app)/profile/requests');
                    } else if (item.eventId) {
                      router.push(`/(app)/events/${item.eventId}`);
                    } else {
                      router.push('/(app)/events');
                    }
                  }}
                >
                  <View style={styles.notifIconWrap}>
                    <Ionicons
                      name={getIcon(item)}
                      size={18}
                      color={item.read ? themeColors.textMuted : themeColors.primary}
                    />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, item.read && styles.notifTitleRead]} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                    <Text style={styles.notifDate}>{formatDate(item.date)}</Text>
                  </View>
                  <View style={styles.notifStatusIcon}>
                    <Ionicons 
                      name={item.read ? 'mail-open-outline' : 'mail'} 
                      size={18} 
                      color={item.read ? themeColors.textMuted : themeColors.primary} 
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: themeColors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: themeColors.background,
  },
  badgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '800',
  },
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: themeColors.overlay,
  },
  panel: {
    position: 'absolute',
    top: 90,
    right: Spacing.lg,
    left: Spacing.lg,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: themeColors.border,
    maxHeight: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
    backgroundColor: themeColors.surfaceLight,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  panelTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  countBadge: {
    backgroundColor: themeColors.primary + '33',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.primary,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  markReadText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.primary,
    fontWeight: '600',
  },
  clearText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.error,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textSecondary,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  notifItemUnread: {
    backgroundColor: themeColors.primary + '08',
  },
  notifIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: themeColors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 2,
  },
  notifTitleRead: {
    fontWeight: '500',
    color: themeColors.textSecondary,
  },
  notifBody: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    lineHeight: 17,
    marginBottom: 4,
  },
  notifDate: {
    fontSize: 10,
    color: themeColors.textMuted,
  },
  notifStatusIcon: {
    paddingLeft: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
});