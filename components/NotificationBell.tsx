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

const STORAGE_KEY = '@kervan_notifications';
const MAX_NOTIFICATIONS = 30;

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  date: string; // ISO string
  read: boolean;
  type?: string;
  eventId?: string;
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  // İlk yükleme — AsyncStorage'dan oku
  useEffect(() => {
    loadStoredNotifications().then(setNotifications);
  }, []);

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

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
  };

  const markAllRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
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

  const getIcon = (item: NotificationItem): 'add-circle' | 'alarm' | 'calendar' => {
    if (item.type === 'new-event') return 'add-circle';
    if (item.type === 'event-reminder') return 'alarm';
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
              {notifications.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{notifications.length}</Text>
                </View>
              )}
            </View>
            {notifications.length > 0 && (
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
            {notifications.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="notifications-off-outline" size={40} color={themeColors.textMuted} />
                <Text style={styles.emptyTitle}>Bildirim yok</Text>
                <Text style={styles.emptySubtitle}>
                  Etkinliklere kayıt olduğunda ve yeni etkinlikler eklendiğinde burada görünecek.
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.notifItem, !item.read && styles.notifItemUnread]}
                  onPress={() => {
                    markAsRead(item.id);
                    setVisible(false);
                    if (item.eventId) {
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