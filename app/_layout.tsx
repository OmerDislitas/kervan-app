import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, useThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestPermissions, registerPushToken } from '@/lib/notificationService';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { onSplashDone } from '@/lib/splashState';

// Native splash ekranını JS bundle yüklenene kadar dondur
SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2, // 2 dakika
    },
  },
});

function RootLayoutNav() {
  const { session, profile, setSession, fetchProfile, setLoading, isLoading } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Splash animasyonu tamamlandığında true olur
  // index.tsx'teki markSplashDone() sinyalini burada dinliyoruz
  const [splashReady, setSplashReady] = useState(false);
  useEffect(() => {
    const unsub = onSplashDone(() => setSplashReady(true));
    return unsub;
  }, []);

  useEffect(() => {
    if (
      lastNotificationResponse &&
      lastNotificationResponse.notification.request.content.data.eventId &&
      lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
    ) {
      const eventId = lastNotificationResponse.notification.request.content.data.eventId;
      if (session) {
        setTimeout(() => {
          router.push(`/(app)/events/${eventId}`);
        }, 500);
      }
    }
  }, [lastNotificationResponse, session]);

  useEffect(() => {
    // Geçersiz/süresi dolmuş refresh token'ı YEREL depodan kesin olarak temizle.
    // scope:'local' sunucuya istek atmadan AsyncStorage'daki oturumu siler;
    // böylece "Invalid Refresh Token" hatası bir sonraki açılışta tekrarlamaz.
    const clearStaleSession = async () => {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // ignore
      }
      queryClient.clear();
      setSession(null);
      setLoading(false);
    };

    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Geçersiz/süresi dolmuş refresh token — oturumu temizle, login'e yönlendir
        console.log('Auth session error (token temizleniyor):', error.message);
        clearStaleSession();
        return;
      }
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.log('getSession catch error (token temizleniyor):', err?.message ?? err);
      clearStaleSession();
    });

    // Auth durum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // SIGNED_OUT veya token yenileme hatası — cache temizle
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
          queryClient.clear();
          setSession(null);
          setLoading(false);
          return;
        }

        if (!session) {
          queryClient.clear();
          setSession(null);
          setLoading(false);
          return;
        }

        setSession(session);
        if (session?.user) {
          await fetchProfile(session.user.id);
          // Bildirim izni ve token kaydı sadece kullanıcı aktif ettiyse yapılır
          const enabled = useSettingsStore.getState().notificationsEnabled;
          if (enabled) {
            const granted = await requestPermissions();
            if (granted) {
              await registerPushToken(session.user.id);
            }
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !splashReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[1] === 'onboarding';

    if (!session && !inAuthGroup) {
      // Oturum yok → giriş ekranına
      router.replace('/(auth)/login');
    } else if (session) {
      if (profile === null) {
        // Oturum var ama profil henüz yüklenmedi (fetchProfile devam ediyor).
        // Yönlendirme yapma; profil gelince bu effect tekrar çalışacak.
        return;
      }

      // Profil yüklendi. username kontrolü artık güvenilir.
      if (!profile.username && !isOnboarding) {
        // Kullanıcı adı belirlenmemiş → onboarding ekranına
        router.replace('/(app)/onboarding');
      } else if (profile.username && (inAuthGroup || isOnboarding || (segments as string[]).length === 0)) {
        // Kullanıcı adı var → ana ekrana
        router.replace('/(app)');
      }
    }
  }, [session, segments, isLoading, profile, splashReady]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

function ThemeStatusBar() {
  const themeColors = useThemeColors();
  const theme = useSettingsStore((state) => state.theme);
  
  return (
    <StatusBar 
      style={theme === 'light' ? 'dark' : 'light'} 
      backgroundColor={themeColors.background} 
    />
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeStatusBar />
          <RootLayoutNav />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
