import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { 
  requestPermissions, 
  cancelAllNotifications, 
  scheduleAllRecurringNotifications,
  registerPushToken
} from '@/lib/notificationService';
import { useAuthStore } from '@/stores/authStore';

export default function SettingsScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const isLightMode = themeColors.background === '#FFFFFF';
  const router = useRouter();
  const {
    theme,
    setTheme,
    notificationsEnabled,
    setNotificationsEnabled,
    hapticFeedback,
    setHapticFeedback,
  } = useSettingsStore();
  const { profile } = useAuthStore();
  const [aboutVisible, setAboutVisible] = React.useState(false);

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      Alert.alert(
        'Bildirimleri Aç 🔔',
        'Bildirimleri açmak istiyor musunuz?',
        [
          {
            text: 'Hayır',
            style: 'cancel',
          },
          {
            text: 'Evet, Açılsın',
            onPress: async () => {
              const granted = await requestPermissions();
              if (granted) {
                setNotificationsEnabled(true);
                if (profile?.id) {
                  await registerPushToken(profile.id);
                }
                // Bildirimleri zamanla
                await scheduleAllRecurringNotifications(true);
              } else {
                Alert.alert(
                  'İzin Gerekli',
                  'Bildirimleri açabilmek için sistem ayarlarından FikirForum uygulamasına bildirim izni vermelisiniz.'
                );
              }
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      setNotificationsEnabled(false);
      await cancelAllNotifications();
    }
  };

  

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton]}>
          <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hesap */}
        <Text style={styles.sectionTitle}>Hesap</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingAction}
            activeOpacity={0.7}
            onPress={() => router.push('/(app)/profile/edit-profile')}
          >
            <View style={styles.settingInfo}>
              <Ionicons name="person-circle" size={20} color={themeColors.textSecondary} />
              <Text style={styles.settingActionText}>Profili Düzenle</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Görünüm Ayarları */}
        <Text style={styles.sectionTitle}>Görünüm</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, isLightMode && { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name={isLightMode ? "sunny" : "moon"} size={20} color={themeColors.primary} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Arka Plan Teması</Text>
                <Text style={styles.settingSubtitle}>
                  {isLightMode ? 'Aydınlık Mod (Beyaz Arka Plan)' : 'Karanlık Mod (Mevcut)'}
                </Text>
              </View>
            </View>
            <Switch
              value={isLightMode}
              onValueChange={(val) => setTheme(val ? 'light' : 'dark')}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : isLightMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Bildirimler */}
        <Text style={styles.sectionTitle}>Tercihler</Text>
        <View style={styles.settingsGroup}>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, isLightMode && { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="notifications" size={20} color={themeColors.primary} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Bildirimler</Text>
                <Text style={styles.settingSubtitle}>Etkinlik ve yorum bildirimleri</Text>
              </View>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : notificationsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <View style={[styles.settingIcon, isLightMode && { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="phone-portrait" size={20} color={themeColors.primary} />
              </View>
              <View>
                <Text style={styles.settingTitle}>Titreşim Geri Bildirimi</Text>
                <Text style={styles.settingSubtitle}>Uygulama içi haptic etkileşimler</Text>
              </View>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: themeColors.border, true: themeColors.primary }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : hapticFeedback ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Destek ve Hakkında */}
        <Text style={styles.sectionTitle}>Hakkında</Text>
        <View style={styles.settingsGroup}>
          <TouchableOpacity style={styles.settingAction} activeOpacity={0.7} onPress={() => router.push('/(app)/profile/terms')}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={20} color={themeColors.textSecondary} />
              <Text style={styles.settingActionText}>Kullanım Koşulları</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingAction} activeOpacity={0.7} onPress={() => router.push('/(app)/profile/privacy')}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark" size={20} color={themeColors.textSecondary} />
              <Text style={styles.settingActionText}>Gizlilik Politikası</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.settingAction} activeOpacity={0.7} onPress={() => setAboutVisible(true)}>
            <View style={styles.settingInfo}>
              <Ionicons name="information-circle" size={20} color={themeColors.textSecondary} />
              <Text style={styles.settingActionText}>FikirForum Hakkında</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>v1.2.0</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <Modal
        visible={aboutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAboutVisible(false)}
        >
          <View style={styles.aboutContent}>
            <View style={styles.aboutIndicator} />
            <Ionicons name="information-circle" size={36} color={themeColors.primary} />
            <Text style={styles.aboutTitle}>FikirForum Hakkında</Text>
            <Text style={styles.aboutText}>
              FikirForum; fikirlerin, sorulara verilen yanıtların ve toplulukla paylaşılan
              düşüncelerin bir araya geldiği bir tartışma platformudur.
            </Text>
            <View style={styles.aboutCreditsBox}>
              <Text style={styles.aboutCreditsTitle}>Geliştirici Ekip:</Text>
              <Text style={styles.aboutCreditsLine}>Vizyon & Konsept: Talha Yasir Koç</Text>
              <Text style={styles.aboutCreditsLine}>Yazılım Geliştirme (Developer): Ömer Faruk Dişlitaş</Text>
            </View>
            <TouchableOpacity style={styles.aboutCloseBtn} onPress={() => setAboutVisible(false)}>
              <Text style={styles.aboutCloseBtnText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.lg,
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
  sectionTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: themeColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    marginLeft: Spacing.xs,
  },
  settingsGroup: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: themeColors.border + '50',
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: themeColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: themeColors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
  },
  settingActionText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '500',
    color: themeColors.textPrimary,
  },
  divider: {
    height: 1,
    backgroundColor: themeColors.border + '40',
    marginLeft: 60,
  },
  versionBadge: {
    backgroundColor: themeColors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  versionText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  aboutContent: {
    backgroundColor: themeColors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  aboutIndicator: {
    width: 40,
    height: 4,
    backgroundColor: themeColors.border,
    borderRadius: 2,
    marginBottom: Spacing.md,
  },
  aboutTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aboutText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  aboutCreditsBox: {
    width: '100%',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  aboutCreditsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  aboutCreditsLine: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    lineHeight: 20,
  },
  aboutCloseBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
  },
  aboutCloseBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
});
