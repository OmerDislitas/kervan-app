import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { Platform, InteractionManager, Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import AppTourModal from '@/components/AppTourModal';
import { useTourStore } from '@/stores/tourStore';
import { useTabBarStore } from '@/stores/tabBarStore';
import { useUnsavedChangesStore } from '@/stores/unsavedChangesStore';
import { fetchOrganizations, fetchActiveEventsCount } from './events/index';
import { fetchDailyFacts } from './explore/index';

export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuthStore();
  const themeColors = useThemeColors();
  const { showTour, setShowTour } = useTourStore();
  const tabBarHidden = useTabBarStore((state) => state.hidden);
  const queryClient = useQueryClient();

  // ------------------------------------------------------------------
  // KAYDEDİLMEMİŞ DEĞİŞİKLİK KORUMASI — bir ekran (örn. Profili Düzenle)
  // useUnsavedChangesStore.hasUnsavedChanges'i true yaptığında, herhangi
  // bir tab ikonuna basılması varsayılan davranışı (ekranı terk etmeyi)
  // engeller ve tema ile uyumlu bir onay modalı gösterir. Onaylanırsa
  // ertelenen navigasyon aksiyonu çalıştırılır.
  // ------------------------------------------------------------------
  const [leaveConfirmVisible, setLeaveConfirmVisible] = React.useState(false);
  const pendingNavigationRef = React.useRef<null | (() => void)>(null);

  const requestLeaveConfirmation = React.useCallback((action: () => void) => {
    pendingNavigationRef.current = action;
    setLeaveConfirmVisible(true);
  }, []);

  const confirmLeave = React.useCallback(() => {
    setLeaveConfirmVisible(false);
    useUnsavedChangesStore.getState().setHasUnsavedChanges(false);
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    action?.();
  }, []);

  const cancelLeave = React.useCallback(() => {
    setLeaveConfirmVisible(false);
    pendingNavigationRef.current = null;
  }, []);

  // Kaydedilmemiş değişiklik varken sekmeye geçişi engelleyip onay ister;
  // yoksa hedef sekmeye normal şekilde geçişi tamamlar.
  const guardTabSwitch = React.useCallback((navigate: () => void) => {
    if (useUnsavedChangesStore.getState().hasUnsavedChanges) {
      requestLeaveConfirmation(navigate);
    } else {
      navigate();
    }
  }, [requestLeaveConfirmation]);

  const leaveStyles = React.useMemo(() => createLeaveModalStyles(themeColors), [themeColors]);

  // PERFORMANS (Faz 3): Giriş sonrası, ilk etkileşimler bittikten sonra Events ve
  // Explore sekmelerinin verisini arka planda ısıt. Böylece o sekmeye İLK geçişte
  // "yükleniyor" spinner'ı görünmez — veri zaten cache'tedir. Anahtarlar ekranlarla
  // birebir aynı; aynı fetch fonksiyonları kullanılır (drift yok).
  React.useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      const today = new Date().toISOString().split('T')[0];
      queryClient.prefetchQuery({ queryKey: ['organizations'], queryFn: fetchOrganizations });
      queryClient.prefetchQuery({ queryKey: ['active-events-counts'], queryFn: fetchActiveEventsCount });
      queryClient.prefetchQuery({ queryKey: ['daily-facts', today], queryFn: fetchDailyFacts });
    });
    return () => task.cancel();
  }, [queryClient]);

  return (
    <>
      <Tabs
      screenOptions={{
        headerShown: false,
        // PERFORMANS: Odakta olmayan tab ekranlarını dondur (react-native-screens).
        // Arka plandaki ağır ekranların (özellikle Ana Sayfa) yeniden render
        // olmasını ve interval/animasyonlarla JS thread'i meşgul etmesini
        // engeller → tab geçişleri belirgin şekilde hızlanır.
        freezeOnBlur: true,
        // NOT: lazy:false (tüm panelleri girişte eager mount) bu iç içe stack
        // navigasyon yapısında "Maximum update depth" döngüsü tetiklediği için
        // KULLANILMIYOR. Ekranlar ilk ziyarette mount edilir (lazy=varsayılan).
        // "Anında geçiş" hedefi freezeOnBlur + ekran-içi optimizasyon + veri
        // prefetch (Faz 3) ile sağlanır.
        lazy: true,
        tabBarHideOnKeyboard: true,
        // NOT: tabBarHidden true olduğunda ekranlar (örn. soz-sende/[id]) tab
        // bar'ı display:none ile gizler. Stil HER ZAMAN burada, güncel
        // insets/themeColors ile tek bir yerden hesaplanır — başka bir
        // ekranın statik/eski bir kopyasını setOptions ile geri yazması söz
        // konusu değil. Bu, geri dönüşte tab bar'ın yanlış boyut/pozisyonla
        // (sistem navigasyon çubuğunun ikonların üstüne binmesi) görünmesini
        // engeller.
        tabBarStyle: tabBarHidden
          ? { display: 'none' }
          : {
              backgroundColor: themeColors.surface,
              borderTopColor: themeColors.border,
              borderTopWidth: 1,
              // edgeToEdgeEnabled=true'da Android'de sistem nav bar transparan;
              // Math.max ile minimum bottom pad garantileniyor
              height: (Platform.OS === 'ios' ? 64 : 60) + Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0),
              paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 0) + (Platform.OS === 'ios' ? 8 : 10),
              paddingTop: 8,
            },
        tabBarActiveTintColor: themeColors.tabActive,
        tabBarInactiveTintColor: themeColors.tabInactive,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={28} color={color} />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (useUnsavedChangesStore.getState().hasUnsavedChanges) {
              e.preventDefault();
              guardTabSwitch(() => navigation.navigate(route.name as never));
            }
          },
        })}
      />
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass" size={28} color={color} />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (useUnsavedChangesStore.getState().hasUnsavedChanges) {
              e.preventDefault();
              guardTabSwitch(() => navigation.navigate(route.name as never));
            }
          },
        })}
      />
      <Tabs.Screen
        name="soz-sende"
        options={{
          title: 'Söz Sende',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={28} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            guardTabSwitch(() => navigation.navigate('soz-sende', { screen: 'index' }));
          },
        })}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Etkinlikler',
          tabBarIcon: ({ color }) => (
            <Ionicons name="calendar" size={28} color={color} />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (useUnsavedChangesStore.getState().hasUnsavedChanges) {
              e.preventDefault();
              guardTabSwitch(() => navigation.navigate(route.name as never));
            }
          },
        })}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hesabım',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={28} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior and force navigation to index
            e.preventDefault();
            guardTabSwitch(() => navigation.navigate('profile', { screen: 'index' }));
          },
        })}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color }) => (
            <Ionicons name="shield-checkmark" size={28} color={color} />
          ),
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            if (useUnsavedChangesStore.getState().hasUnsavedChanges) {
              e.preventDefault();
              guardTabSwitch(() => navigation.navigate(route.name as never));
            }
          },
        })}
      />
      <Tabs.Screen name="onboarding" options={{ href: null }} />

      {/* _components klasörleri — route değil, tab'dan gizle */}
      <Tabs.Screen name="_components/HomeHeader" options={{ href: null }} />
      <Tabs.Screen name="_components/HomeHero" options={{ href: null }} />
      <Tabs.Screen name="_components/QuestionOfTheWeek" options={{ href: null }} />
      <Tabs.Screen name="_components/CompassCard" options={{ href: null }} />
      <Tabs.Screen name="_components/FridayCard" options={{ href: null }} />
      <Tabs.Screen name="_components/UpcomingEventsSection" options={{ href: null }} />
      <Tabs.Screen name="_components/NextEventSection" options={{ href: null }} />
      <Tabs.Screen name="_components/RankingModal" options={{ href: null }} />
      <Tabs.Screen name="explore/_components/ExploreHeader" options={{ href: null }} />
      <Tabs.Screen name="explore/_components/StoryModal" options={{ href: null }} />
      <Tabs.Screen name="explore/_components/CategoryBar" options={{ href: null }} />
      <Tabs.Screen name="explore/_components/FactCardList" options={{ href: null }} />
    </Tabs>
      {showTour && <AppTourModal visible={showTour} onClose={() => setShowTour(false)} />}

      {/* Kaydedilmemiş değişiklik onayı — tema (lacivert) ile uyumlu, native Alert değil */}
      <Modal visible={leaveConfirmVisible} transparent animationType="fade" onRequestClose={cancelLeave}>
        <View style={leaveStyles.overlay}>
          <View style={leaveStyles.card}>
            <View style={leaveStyles.iconCircle}>
              <Ionicons name="alert-circle" size={30} color={themeColors.warning} />
            </View>
            <Text style={leaveStyles.title}>Değişiklikleri kaydetmek istiyor musunuz?</Text>
            <Text style={leaveStyles.desc}>
              Kaydedilmemiş değişiklikleriniz var. Bu sayfadan çıkarsanız değişiklikler kaybolur.
            </Text>
            <TouchableOpacity
              style={leaveStyles.cancelBtn}
              activeOpacity={0.85}
              onPress={cancelLeave}
            >
              <Text style={leaveStyles.cancelBtnText}>Vazgeç, Düzenlemeye Devam Et</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={leaveStyles.discardBtn}
              activeOpacity={0.85}
              onPress={confirmLeave}
            >
              <Text style={leaveStyles.discardBtnText}>Kaydetmeden Çık</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createLeaveModalStyles = (themeColors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: themeColors.warning + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  desc: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.background,
  },
  discardBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    backgroundColor: themeColors.surfaceLight,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  discardBtnText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.error,
  },
});
