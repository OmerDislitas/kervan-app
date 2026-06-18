import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, useThemeColors } from '@/constants/theme';
import { Platform, InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import AppTourModal from '@/components/AppTourModal';
import { useTourStore } from '@/stores/tourStore';
import { fetchOrganizations, fetchActiveEventsCount } from './events/index';
import { fetchDailyFacts } from './explore/index';
import { useJSThreadProbe } from '@/lib/debugPerf';

export default function AppLayout() {
  useJSThreadProbe('TabLayout');
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuthStore();
  const themeColors = useThemeColors();
  const { showTour, setShowTour } = useTourStore();
  const queryClient = useQueryClient();

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
        tabBarStyle: {
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
        tabBarLabelStyle: {
          fontSize: Typography.fontSize.xs,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="soz-sende"
        options={{
          title: 'Söz Sende',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('soz-sende', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Etkinlikler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hesabım',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            // Prevent default behavior and force navigation to index
            e.preventDefault();
            navigation.navigate('profile', { screen: 'index' });
          },
        })}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
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
    </Tabs>
      <AppTourModal visible={showTour} onClose={() => setShowTour(false)} />
    </>
  );
}
