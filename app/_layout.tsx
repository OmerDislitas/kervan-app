import React, { useEffect } from 'react';
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
    // Mevcut oturumu kontrol et
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.log('Auth session error:', error.message);
        supabase.auth.signOut().catch(() => {});
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    }).catch(err => {
      console.log('getSession catch error:', err);
      supabase.auth.signOut().catch(() => {});
      setSession(null);
      setLoading(false);
    });

    // Auth durum değişikliklerini dinle
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          queryClient.clear();
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
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isOnboarding = segments[1] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session) {
      // Eğer kullanıcı giriş yapmışsa ama kullanıcı adı yoksa onboarding'e gönder (onboarding sayfası hariç)
      if (!profile?.username && !isOnboarding) {
        router.replace('/(app)/onboarding');
      } else if (profile?.username && (inAuthGroup || isOnboarding || (segments as string[]).length === 0)) {
        router.replace('/(app)');
      }
    }
  }, [session, segments, isLoading, profile?.username]);

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
