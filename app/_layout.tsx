import React, { useEffect, useRef, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestPermissions, registerPushToken } from '@/lib/notificationService';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';

// Native splash ekranını JS bundle yüklenene kadar dondur
SplashScreen.preventAutoHideAsync().catch(() => {});

// Splash animasyonu toplam süresi: 2000 (slide) + 4000 (delay) + 1200 (fade) = 7200ms
// 7500ms'de kesinlikle routing'e izin ver.
const SPLASH_DURATION_MS = 7500;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

function RootLayoutNav() {
  const { session, profile, setSession, fetchProfile, setLoading, isLoading } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Splash ekranının animasyonu bitmesi için yeterli süre geçti mi?
  const [splashReady, setSplashReady] = useState(false);

  // Auth başlatma sadece bir kez yapılsın diye guard
  const authInitDone = useRef(false);

  useEffect(() => {
    // Splash: animasyonun bitmesi için sabit süre bekliyoruz.
    // Animasyon callback'e bağlı değil → hiçbir zaman takılmaz.
    const splashTimer = setTimeout(() => {
      setSplashReady(true);
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (authInitDone.current) return;
    authInitDone.current = true;

    // Geçersiz session'ı local'den temizle
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

    let subscription: ReturnType<typeof supabase.auth.onAuthStateChange>['data']['subscription'] | null = null;

    const initAuth = async () => {
      // Geçersiz (expired/revoked) refresh token'ı burada yakala.
      // Yakalanmazsa Supabase bunu unhandled promise rejection olarak fırlatır.
      const { error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[Auth] Geçersiz session temizlendi:', sessionError.message);
        await clearStaleSession();
        return;
      }

      // Auth state listener — tek kaynak (INITIAL_SESSION dahil)
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
  
          if (event === 'SIGNED_OUT') {
            queryClient.clear();
            setSession(null);
            setLoading(false);
            return;
          }

          if (event === 'TOKEN_REFRESHED' && !session) {
            await clearStaleSession();
            return;
          }

          if (!session) {
            queryClient.clear();
            setSession(null);
            setLoading(false);
            return;
          }

          if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
            try {
              setSession(session);
              await fetchProfile(session.user.id);

              if (event === 'SIGNED_IN') {
                // Bildirim izni ve token kaydı sadece giriş sırasında
                const enabled = useSettingsStore.getState().notificationsEnabled;
                if (enabled) {
                  const granted = await requestPermissions();
                  if (granted) {
                    await registerPushToken(session.user.id);
                  }
                }
              }
            } catch (err) {
              console.error('[Auth] Session init error:', err);
            } finally {
              setLoading(false);
            }
            return;
          }

          setSession(session);
          setLoading(false);
        }
      );
      subscription = data.subscription;
    };

    initAuth();

    return () => subscription?.unsubscribe();
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

  // Routing effect — hem splash hem auth tamamlanınca çalışır
  useEffect(() => {
    if (isLoading || !splashReady) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[1] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session) {
      if (profile === null) {
        router.replace('/(auth)/login');
        return;
      }

      if (!profile.username && !isOnboarding) {
        router.replace('/(app)/onboarding');
      } else if (profile.username && (inAuthGroup || isOnboarding || (segments as string[]).length === 0)) {
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
