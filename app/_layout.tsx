import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/constants/theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestPermissions, registerPushToken } from '@/lib/notificationService';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import { OfflineNotice } from '@/components/OfflineNotice';

// Native splash ekranını JS bundle yüklenene kadar dondur
SplashScreen.preventAutoHideAsync().catch(() => {});



const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 2,
    },
  },
});

// Configure React Query's onlineManager to respond to network status changes
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

function RootLayoutNav() {
  const { session, profile, setSession, fetchProfile, setLoading, isLoading, passwordRecoveryInProgress } =
    useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const lastNotificationResponse = Notifications.useLastNotificationResponse();

  // Auth başlatma sadece bir kez yapılsın diye guard
  const authInitDone = useRef(false);

  // Splash animasyonu kaldırıldı — routing hemen etkinleşir
  const splashReady = true;

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
      // Load cached profile on startup to prevent routing glitches (e.g. login screen redirect)
      await useAuthStore.getState().loadCachedProfile();

      try {
        // Geçersiz (expired/revoked) refresh token'ı burada yakala.
        // Yakalanmazsa Supabase bunu unhandled promise rejection olarak fırlatır.
        // NOT: Supabase auth-js bazı durumlarda AuthApiError'ı throw eder
        // (tuple olarak dönmek yerine), bu yüzden try-catch şart.
        const { error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          // Ignore network errors — user may be offline. Only clear for real auth errors.
          const isNetworkErr = sessionError.message?.toLowerCase().includes('network') ||
            sessionError.message?.toLowerCase().includes('fetch') ||
            sessionError.message?.toLowerCase().includes('failed');
          if (isNetworkErr) {
            console.warn('[Auth] Ağ hatası, session korunuyor:', sessionError.message);
            // Continue to set up the auth listener even when offline
          } else {
            console.warn('[Auth] Geçersiz session temizlendi:', sessionError.message);
            await clearStaleSession();
            return;
          }
        }
      } catch (err: any) {
        // Distinguish network errors from real auth errors
        const msg: string = err?.message || '';
        const isNetworkErr = msg.toLowerCase().includes('network request failed') ||
          msg.toLowerCase().includes('network') ||
          msg.toLowerCase().includes('fetch') ||
          msg.toLowerCase().includes('failed to fetch');
        if (isNetworkErr) {
          // User is offline — do NOT clear session, cached profile handles routing
          console.warn('[Auth] Ağ bağlantısı yok, session korunuyor:', msg);
          // Fall through to set up auth listener; it will sync when back online
        } else {
          console.warn('[Auth] getSession exception, session temizleniyor:', msg);
          await clearStaleSession();
          return;
        }
      }

      // Auth state listener — tek kaynak (INITIAL_SESSION dahil)
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          try {
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

            // NOT: PASSWORD_RECOVERY (şifremi unuttum OTP doğrulaması) da
            // buraya dahil — aksi halde profil hiç çekilmez ve routing
            // effect'i "profile === null" gördüğü için kullanıcıyı yeni
            // şifre ekranından login'e geri atar.
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'PASSWORD_RECOVERY') {
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
          } catch (err: any) {
            console.warn('[Auth] onAuthStateChange exception:', err?.message || err);
            // Auth state callback'inde beklenmeyen hata —
            // session'ı temizleyip login sayfasına düş
            await clearStaleSession();
          }
        }
      );
      subscription = data.subscription;
    };

    initAuth().catch((err) => {
      console.warn('[Auth] initAuth uncaught error:', err);
      clearStaleSession();
    });

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

    // Şifremi unuttum OTP doğrulaması geçici bir oturum açar — bu sırada
    // otomatik yönlendirmeyi durdurmazsak kullanıcı yeni şifresini
    // girmeden uygulamaya atılır. Ekran kendi navigasyonunu kendisi yapar.
    if (passwordRecoveryInProgress) return;

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
  }, [session, segments, isLoading, profile, splashReady, passwordRecoveryInProgress]);

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
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeStatusBar />
            <RootLayoutNav />
            <OfflineNotice />
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
