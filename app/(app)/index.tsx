import React from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useThemeColors } from '@/constants/theme';
import { useTourStore } from '@/stores/tourStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  scheduleWeeklyFridayMessage,
  scheduleDailyWisdom,
  scheduleDailyCompass,
  scheduleDailyFactsNotification,
  requestPermissions,
  cancelAllNotifications,
  registerPushToken,
} from '@/lib/notificationService';
import { useSettingsStore } from '@/stores/settingsStore';

import { useFocusTimer, createProfilerHandler } from '@/lib/debugPerf';
import { HomeHeader } from './_components/HomeHeader';
import { HomeHero } from './_components/HomeHero';
import { QuestionOfTheWeek } from './_components/QuestionOfTheWeek';
import { CompassCard } from './_components/CompassCard';
import { FridayCard } from './_components/FridayCard';
import { UpcomingEventsSection } from './_components/UpcomingEventsSection';
import { NextEventSection } from './_components/NextEventSection';
import { RankingModal } from './_components/RankingModal';

async function fetchMyNextEvent(userId: string) {
  const { data: regs, error: regError } = await supabase
    .from('event_registrations')
    .select('event_id')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (regError || !regs || regs.length === 0) return null;

  const eventIds = regs.map((r) => r.event_id);
  const now = new Date().toISOString();

  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .gte('event_date', now)
    .order('event_date', { ascending: true })
    .limit(1);

  if (error || !events || events.length === 0) return null;
  return events[0];
}

async function fetchUpcomingEvents() {
  const now = new Date().toISOString();
  const { data: events, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('event_date', now)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return events;
}

async function fetchActiveQuestions() {
  const { data, error } = await supabase
    .from('weekly_questions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data || [];
}

export default function HomeScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  const { setShowTour } = useTourStore();

  React.useEffect(() => {
    if (profile?.id) checkNotificationsFirstPrompt();
  }, [profile?.id]);

  async function checkNotificationsFirstPrompt() {
    try {
      const askedKey = `@kervan_notif_first_prompt_shown_${profile?.id}`;
      const asked = await AsyncStorage.getItem(askedKey);
      if (asked === null) {
        Alert.alert(
          'Bildirim İzni 🔔',
          'Etkinliklerden, yeni yorumlardan ve günün hap bilgilerinden anında haberdar olmak için bildirimleri açmak ister misiniz?',
          [
            {
              text: 'Hayır, Kapat',
              style: 'cancel',
              onPress: async () => {
                await AsyncStorage.setItem(askedKey, 'true');
                useSettingsStore.getState().setNotificationsEnabled(false);
                await cancelAllNotifications();
              },
            },
            {
              text: 'Evet, Açılsın',
              onPress: async () => {
                await AsyncStorage.setItem(askedKey, 'true');
                const granted = await requestPermissions();
                if (granted) {
                  useSettingsStore.getState().setNotificationsEnabled(true);
                  await registerPushToken(profile!.id);
                  await scheduleWeeklyFridayMessage();
                  await scheduleDailyWisdom();
                  await scheduleDailyCompass();
                  await scheduleDailyFactsNotification();
                } else {
                  useSettingsStore.getState().setNotificationsEnabled(false);
                  Alert.alert(
                    'İzin Gerekli',
                    'Bildirimleri açabilmek için sistem ayarlarından Kervan uygulamasına bildirim izni vermelisiniz.'
                  );
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        const enabled = useSettingsStore.getState().notificationsEnabled;
        if (enabled) {
          scheduleWeeklyFridayMessage();
          scheduleDailyWisdom();
          scheduleDailyCompass();
          scheduleDailyFactsNotification();
        }
      }
    } catch (e) {
      console.log('checkNotificationsFirstPrompt error:', e);
    }
  }

  const { data: nextEvent, isLoading: isNextLoading, refetch: refetchNextEvent } = useQuery({
    queryKey: ['my-next-event', profile?.id],
    queryFn: () => fetchMyNextEvent(profile!.id),
    enabled: !!profile?.id,
  });

  const { data: upcomingEvents, isLoading: isUpcomingLoading, refetch: refetchUpcomingEvents } = useQuery({
    queryKey: ['upcoming-events-home'],
    queryFn: fetchUpcomingEvents,
  });

  const { data: activeQuestions, isLoading: isQuestionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ['active-questions-home'],
    queryFn: fetchActiveQuestions,
  });

  const [showRanking, setShowRanking] = React.useState(false);
  const { data: topUsers, isLoading: isRankingLoading, refetch: refetchRanking } = useQuery({
    queryKey: ['top-users-ranking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, points')
        .order('points', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const [refreshing, setRefreshing] = React.useState(false);
  const handleRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      const promises: Promise<unknown>[] = [
        refetchUpcomingEvents(),
        refetchQuestions(),
        refetchRanking(),
      ];
      if (profile?.id) {
        promises.push(refetchNextEvent());
        promises.push(fetchProfile(profile.id));
      }
      await Promise.all(promises);
    } catch (e) {
      console.error('Home refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  }, [profile?.id, refetchNextEvent, refetchUpcomingEvents, refetchQuestions, refetchRanking, fetchProfile]);

  useFocusTimer('HomeScreen');

  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'K';
  const homeProfilerHandler = React.useMemo(() => createProfilerHandler('HomeScreen'), []);

  // Stabil callback referansları — React.memo olan alt bileşenlerin bypass edilmesini önler
  const handlePressProfile = React.useCallback(() => router.push('/(app)/profile'), [router]);
  const handlePressTour = React.useCallback(() => setShowTour(true), [setShowTour]);
  const handlePressRanking = React.useCallback(() => setShowRanking(true), []);
  const handlePressEvents = React.useCallback(() => router.push('/(app)/events'), [router]);
  const handlePressSozSende = React.useCallback(() => router.push('/(app)/soz-sende'), [router]);
  const handlePressQuestion = React.useCallback(
    (qid: string) => router.push(`/(app)/soz-sende/${qid}`),
    [router]
  );
  const handlePressEvent = React.useCallback(
    (id: string) => router.push(`/(app)/events/${id}`),
    [router]
  );
  const handlePressAllEvents = React.useCallback(() => router.push('/(app)/events'), [router]);
  const handlePressUser = React.useCallback(
    (userId: string) => router.push(`/(app)/profile/${userId}`),
    [router]
  );
  const handleCloseRanking = React.useCallback(() => setShowRanking(false), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themeColors.background }} edges={['top']}>
      <React.Profiler id="HomeScreen" onRender={homeProfilerHandler}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
        }
      >
        <HomeHeader
          userInitial={userInitial}
          userName={profile?.full_name || 'Kullanıcı'}
          onPressProfile={handlePressProfile}
          onPressTour={handlePressTour}
          onPressRanking={handlePressRanking}
        />

        <HomeHero
          onPressEvents={handlePressEvents}
          onPressSozSende={handlePressSozSende}
        />

        <QuestionOfTheWeek
          questions={activeQuestions}
          isLoading={isQuestionsLoading}
          onPressQuestion={handlePressQuestion}
        />

        <CompassCard />

        <FridayCard />

        <UpcomingEventsSection
          events={upcomingEvents}
          isLoading={isUpcomingLoading}
          onPressEvent={handlePressEvent}
          onPressAll={handlePressAllEvents}
        />

        <NextEventSection
          event={nextEvent}
          isLoading={isNextLoading}
          onPressEvent={handlePressEvent}
          onPressAll={handlePressAllEvents}
        />
      </ScrollView>

      </React.Profiler>
      <RankingModal
        visible={showRanking}
        onClose={handleCloseRanking}
        topUsers={topUsers ?? []}
        isLoading={isRankingLoading}
        currentUserId={profile?.id}
        onPressUser={handlePressUser}
      />
    </SafeAreaView>
  );
}
