import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Dimensions,
  ImageBackground,
  Animated,
  Image,
  Easing,
  Alert,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import NotificationBell from '@/components/NotificationBell';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  scheduleWeeklyFridayMessage, 
  scheduleDailyWisdom, 
  scheduleDailyCompass, 
  scheduleDailyFactsNotification,
  requestPermissions,
  cancelAllNotifications,
  registerPushToken
} from '@/lib/notificationService';
import { useTourStore } from '@/stores/tourStore';
import { useSettingsStore } from '@/stores/settingsStore';

// PERFORMANS: Bu sabit diziler eskiden render gövdesindeydi ve her render'da
// yeniden oluşturuluyordu (gereksiz allocation). Modül seviyesine taşındı —
// uygulama ömrü boyunca bir kez oluşturulur.
const HOME_COMPASS_TASKS = [
  { id: 'h1', title: 'Tartışmaya Katıl', desc: 'Söz Sende paneline git ve aktif bir soruya yorum yaz.', icon: 'chatbubbles', color: '#8A2BE2' },
  { id: 'h2', title: 'Bilgi Avcısı', desc: 'Keşfet\'teki günün hap bilgilerinden birine tıkla ve sonuna kadar oku.', icon: 'book', color: '#4D96FF' },
  { id: 'h3', title: 'Topluluk Desteği', desc: 'Söz Sende panelinde hoşuna giden 3 farklı yoruma beğeni bırak.', icon: 'heart', color: '#FF6B6B' },
  { id: 'h4', title: 'Profilini Güçlendir', desc: 'Profiline git, rozetlerini ve istatistiklerini kontrol et.', icon: 'person', color: '#E0144C' },
  { id: 'h5', title: 'Günün Sözünü Oku', desc: 'Keşfet ekranındaki "Günün Sözü" yuvarlağına tıkla ve günün ilhamını al.', icon: 'book-outline', color: '#A78BFA' },
  { id: 'h6', title: 'Yeni Bağlantı Kur', desc: 'Profil sekmesine git ve tanıdığın birinin profilini ziyaret edip takip et.', icon: 'people', color: '#00C9A7' },
  { id: 'h7', title: 'Gündem Yorumcusu', desc: 'Keşfet\'teki Gündem bölümünde aktif bir konuya yorum bırak.', icon: 'trending-up', color: '#1A5D1A' },
  { id: 'h8', title: 'Hap Bilgi Okuyucusu', desc: 'Bugünün iki hap bilgisini de oku ve yeni bir şeyler öğren.', icon: 'bulb', color: '#610C9F' },
];

const HOME_WISDOM_POOL = [
  { text: "Birlikte yola çıkmak bir başlangıçtır, bir arada kalmak ilerlemedir, birlikte çalışmak ise başarıdır.", author: "Henry Ford" },
  { text: "İyilik yap, denize at; balık bilmezse Halik bilir.", author: "Anonim" },
  { text: "Gençlik, geleceğin tohumudur; onu sevgi ve bilgiyle sula.", author: "Kervan" },
  { text: "Yol seni nereye götürüyorsa oraya gitme, yol olmayan yerden git ki iz bırak.", author: "R.W. Emerson" },
  { text: "En büyük başarı, hiçbir zaman düşmemekte değil, her düştüğünde tekrar ayağa kalkabilmektedir.", author: "Konfüçyüs" },
  { text: "Bilgi ışık gibidir; paylaştıkça çoğalır.", author: "Mevlana" },
  { text: "Sabır acıdır, ama meyvesi tatlıdır.", author: "Sa'dî" },
  { text: "Düşüncelerinde büyük ol, hayallerinde cesur, eylemlerinde kararlı.", author: "Thomas J. Watson" },
  { text: "Başkalarına hizmet etmek, yeryüzünde sürdüğünüz kiranın bedelidir.", author: "Muhammad Ali" },
  { text: "Küçük adımlar büyük yolculukların başlangıcıdır.", author: "Lao Tzu" },
  { text: "İnsanın en güzel yolculuğu kendi içine yaptığı yolculuktur.", author: "Rumi" },
  { text: "Dünyanı değiştirmek istiyorsan önce kendini değiştir.", author: "Mahatma Gandhi" },
  { text: "Bir ağaç dikmenin en iyi zamanı yirmi yıl önceydi; ikinci en iyi zaman şimdi.", author: "Çin Atasözü" },
  { text: "Başarının sırrı; başlamaktır.", author: "Mark Twain" },
  { text: "Azimli bir insan için imkânsız diye bir şey yoktur.", author: "Aleksander Büyük" },
  { text: "Bilgelik, deneyimden öğrenilen bilgidir.", author: "Oscar Wilde" },
  { text: "Yüce hedefler, sıradan insanları olağanüstü kılar.", author: "John D. Rockefeller" },
  { text: "Her zorluk, yeni bir fırsatın kapısını aralar.", author: "Albert Einstein" },
  { text: "İnsanlar yapabileceğini düşündükleri şeyi değil, istediklerini başarırlar.", author: "Vince Lombardi" },
  { text: "Karanlıkta bir mum yakmak, karanlığa küsmekten iyidir.", author: "Konfüçyüs" },
  { text: "Kendinize inandığınızda başkalarını da inandırabilirsiniz.", author: "Zig Ziglar" },
  { text: "Bir toplumun geleceği gençlerin elindedir; onlara güvenin ve yol gösterin.", author: "Atatürk" },
  { text: "Öğrenmek bir hazinedir, onu taşıyan her yere gider.", author: "Çin Atasözü" },
  { text: "Sevgi vermek, sevgi almaktır.", author: "Fyodor Dostoyevski" },
  { text: "Adalet, güçlünün zayıfa merhameti değil, herkesin hakkının korunmasıdır.", author: "Platon" },
  { text: "Umut etmek, yaşamaya devam etmektir.", author: "Victor Hugo" },
  { text: "İyi bir kitap yüz arkadaşa bedeldir.", author: "A.P.J. Abdul Kalam" },
  { text: "Gülümsemek, insanlar arasındaki en kısa mesafedir.", author: "Victor Borge" },
  { text: "Birlik güçtür; birlikte hiçbir şey imkânsız değildir.", author: "Walton Family" },
  { text: "Dürüstlük, en iyi politikadır.", author: "Benjamin Franklin" },
];

const HISTORICAL_EVENTS_POOL = [
  [
    { title: "Fetih Hazırlıkları", detail: "Fatih Sultan Mehmet kuşatma planlarını inceledi." },
    { title: "Gülhane Hatt-ı Hümayunu", detail: "Tanzimat Fermanı ilan edildi." },
    { title: "Kervan Vizyon", detail: "Platformun ilk temelleri atıldı." }
  ],
  [
    { title: "Mescid-i Aksa", detail: "Kudüs'te önemli tarihi gelişmeler yaşandı." },
    { title: "Mimar Sinan", detail: "Süleymaniye Camii inşaatı devam ediyordu." },
    { title: "Bilgi Hikmet", detail: "Gençlik buluşmaları organize edildi." }
  ],
  [
    { title: "İlim Meclisleri", detail: "Semerkand'da büyük alimler toplandı." },
    { title: "Endülüs Mirası", detail: "Kurtuba Kütüphanesi genişletildi." },
    { title: "Gelecek Tasavvuru", detail: "Gençler için yeni projeler açıklandı." }
  ]
];

// PERFORMANS: "Söz Sende" carousel'i kendi state'ini (questionIndex + animasyon)
// yöneten ayrı, memo'lu bir bileşendir. Eskiden bu state ana ekrandaydı ve 5
// saniyede bir 2200+ satırlık ekranın tamamını yeniden render ediyordu. Artık
// yalnızca bu kart yeniden render olur. Ayrıca ekran odakta değilken interval
// durur (useIsFocused) → arka plan tab'ı CPU/pil yemez.
type HomeQuestion = { id: string; title: string };
const QuestionOfTheWeek = React.memo(function QuestionOfTheWeek({
  questions,
  styles,
  themeColors,
  onPressQuestion,
}: {
  questions: HomeQuestion[] | undefined;
  styles: any;
  themeColors: any;
  onPressQuestion: (id: string) => void;
}) {
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const translateYAnim = React.useRef(new Animated.Value(0)).current;

  // PERFORMANS (Faz 4): useIsFocused yerine useFocusEffect. useIsFocused odak
  // değişiminde bileşeni YENİDEN RENDER eder; useFocusEffect ise yalnızca effect'i
  // odak/blur'da çalıştırır, render tetiklemez → sekme geçişinde gereksiz render yok.
  useFocusEffect(
    React.useCallback(() => {
      if (!questions || questions.length <= 1) return;
      const interval = setInterval(() => {
        Animated.parallel([
          Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.timing(translateYAnim, { toValue: -10, duration: 400, useNativeDriver: true }),
        ]).start(() => {
          setQuestionIndex((prev) => (prev + 1) % questions.length);
          translateYAnim.setValue(10);
          Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(translateYAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]).start();
        });
      }, 5000);
      return () => clearInterval(interval);
    }, [questions, fadeAnim, translateYAnim])
  );

  const activeQuestion = questions?.[questionIndex];
  if (!activeQuestion) return null;

  return (
    <TouchableOpacity
      style={[styles.questionOfTheWeekCard, styles.premiumShadow]}
      activeOpacity={0.9}
      onPress={() => onPressQuestion(activeQuestion.id)}
    >
      <LinearGradient colors={[themeColors.surface, themeColors.surfaceLight]} style={styles.qowContent}>
        <View style={styles.qowGlow} />
        <View style={styles.qowHeader}>
          <View style={styles.qowBadge}>
            <Ionicons name="chatbubbles" size={14} color={themeColors.surface} />
            <Text style={styles.qowBadgeText}>Söz Sende</Text>
          </View>
          {questions && questions.length > 1 && (
            <View style={styles.qowPagination}>
              {questions.map((_, idx) => (
                <View key={idx} style={[styles.qowDot, idx === questionIndex && styles.qowDotActive]} />
              ))}
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={themeColors.primary} />
        </View>
        <View style={{ minHeight: 70, justifyContent: 'center' }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: translateYAnim }] }}>
            <Text style={styles.qowTitle} numberOfLines={2}>{activeQuestion.title}</Text>
            <Text style={styles.qowSubtitle}>Toplulukla tartışmaya katıl, fikrini paylaş.</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

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
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  const { setShowTour } = useTourStore();
  const [activeSlide, setActiveSlide] = React.useState(0);
  const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    checkFirstLaunch();
  }, []);

  React.useEffect(() => {
    if (profile?.id) {
      checkNotificationsFirstPrompt();
    }
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
              }
            },
            {
              text: 'Evet, Açılsın',
              onPress: async () => {
                await AsyncStorage.setItem(askedKey, 'true');
                const granted = await requestPermissions();
                if (granted) {
                  useSettingsStore.getState().setNotificationsEnabled(true);
                  await registerPushToken(profile!.id);
                  // Bildirimleri planla
                  await scheduleWeeklyFridayMessage();
                  await scheduleDailyWisdom();
                  await scheduleDailyCompass();
                  await scheduleDailyFactsNotification();
                } else {
                  useSettingsStore.getState().setNotificationsEnabled(false);
                  Alert.alert('İzin Gerekli', 'Bildirimleri açabilmek için sistem ayarlarından Kervan uygulamasına bildirim izni vermelisiniz.');
                }
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        // Zaten sorulmuş, eğer aktifse zamanlamaları yapalım
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

  async function checkFirstLaunch() {
    try {
      const value = await AsyncStorage.getItem('@has_launched');
      if (value === null) {
        setIsFirstLaunch(true);
      } else {
        setIsFirstLaunch(false);
      }
    } catch (e) {
      setIsFirstLaunch(false);
    }
  }

  async function handleStartExploring() {
    setShowTour(true);
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      setIsFirstLaunch(false);
    } catch (e) {
      console.error('Error saving launch state', e);
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

  const { data: activeQuestions, refetch: refetchQuestions } = useQuery({
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
        refetchRanking()
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

  // Kervan Pusulası States (işlevsel, gece 12 ve gündüz 12 resetli)
  const compassAnim = React.useRef(new Animated.Value(0)).current;
  const [homeCompassTask, setHomeCompassTask] = React.useState<any>(null);
  const [homeIsSpinning, setHomeIsSpinning] = React.useState(false);
  const [homeTaskCompleted, setHomeTaskCompleted] = React.useState(false);
  const [homeCooldown, setHomeCooldown] = React.useState<string | null>(null);
  const [earnedCompassPoints, setEarnedCompassPoints] = React.useState(false);
  const COMPASS_POINTS = 25;

  const loadHomeCompassTask = React.useCallback(async () => {
    try {
      const savedTaskStr = await AsyncStorage.getItem('@kervan_compass_task');
      const timestampStr = await AsyncStorage.getItem('@kervan_compass_time');
      const completedStr = await AsyncStorage.getItem('@kervan_compass_completed');
      const earnedStr = await AsyncStorage.getItem('@kervan_compass_points_earned');
      
      if (savedTaskStr && timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const now = new Date();
        
        // Gece 12 (00:00) ve Gündüz 12 (12:00) periyot başlangıçları
        const periodStart = new Date(now);
        if (now.getHours() < 12) {
          periodStart.setHours(0, 0, 0, 0);
        } else {
          periodStart.setHours(12, 0, 0, 0);
        }
        
        const nextPeriodStart = new Date(now);
        if (now.getHours() < 12) {
          nextPeriodStart.setHours(12, 0, 0, 0);
        } else {
          nextPeriodStart.setHours(0, 0, 0, 0);
          nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
        }

        if (timestamp >= periodStart.getTime()) {
          setHomeCompassTask(JSON.parse(savedTaskStr));
          setHomeTaskCompleted(completedStr === 'true');
          setEarnedCompassPoints(earnedStr === 'true');
          
          const remainingMs = nextPeriodStart.getTime() - now.getTime();
          const rH = Math.floor(remainingMs / (1000 * 60 * 60));
          const rM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setHomeCooldown(`${rH}s ${rM}d`);
        } else {
          // Yeni periyot başladı, eski verileri temizle
          await AsyncStorage.multiRemove([
            '@kervan_compass_task',
            '@kervan_compass_time',
            '@kervan_compass_completed',
            '@kervan_compass_points_earned'
          ]);
          setHomeCompassTask(null);
          setHomeTaskCompleted(false);
          setHomeCooldown(null);
          setEarnedCompassPoints(false);
        }
      } else {
        setHomeCompassTask(null);
        setHomeTaskCompleted(false);
        setHomeCooldown(null);
        setEarnedCompassPoints(false);
      }
    } catch (e) {
      console.error('loadHomeCompassTask error:', e);
    }
  }, []);

  // PERFORMANS (Faz 4): Pusula durumunu yalnızca ekran odaktayken yenile. Eskiden
  // burada üst seviye useIsFocused vardı; o her odak değişiminde 2247 satırlık bu
  // ekranı tamamen yeniden render edip sekme geçiş animasyonunu kekeletiyordu.
  // useFocusEffect render tetiklemeden odak/blur'da çalışır. Sekmeye dönünce hemen
  // bir kez yenilenir (cooldown güncel kalır), blur'da timer durur (pil/CPU dostu).
  useFocusEffect(
    React.useCallback(() => {
      loadHomeCompassTask();
      const interval = setInterval(loadHomeCompassTask, 60000);
      return () => clearInterval(interval);
    }, [loadHomeCompassTask])
  );

  const homeSpinCompass = () => {
    if (homeIsSpinning) return;
    if (homeCompassTask && !homeTaskCompleted) {
      Alert.alert('🧭 Şu Anki Hedefin', 'Yeni bir hedef için önce mevcut hedefini tamamla!', [{ text: 'Tamam' }]);
      return;
    }
    if (homeCompassTask && homeTaskCompleted) {
      Alert.alert('⏳ Dinlenme Süresi', `Yeni pusula için ${homeCooldown} daha beklemelisin.`, [{ text: 'Tamam' }]);
      return;
    }
    setHomeIsSpinning(true);
    compassAnim.setValue(0);
    Animated.timing(compassAnim, { toValue: 1, duration: 2000, useNativeDriver: true }).start(async () => {
      const task = HOME_COMPASS_TASKS[Math.floor(Math.random() * HOME_COMPASS_TASKS.length)];
      setHomeCompassTask(task);
      setHomeIsSpinning(false);
      setHomeTaskCompleted(false);
      await AsyncStorage.setItem('@kervan_compass_task', JSON.stringify(task));
      await AsyncStorage.setItem('@kervan_compass_time', Date.now().toString());
      await AsyncStorage.setItem('@kervan_compass_completed', 'false');
      await AsyncStorage.setItem('@kervan_compass_points_earned', 'false');
      await AsyncStorage.setItem('@kervan_compass_start_points', (profile?.points || 0).toString());
      loadHomeCompassTask();
    });
  };
  const handleDoTask = (taskId: string) => {
    switch (taskId) {
      case 'h1': // Tartışmaya Katıl
      case 'h3': // Topluluk Desteği
        router.push('/(app)/soz-sende');
        break;
      case 'h2': // Bilgi Avcısı
      case 'h5': // Günün Sözünü Oku
      case 'h7': // Gündem Yorumcusu
      case 'h8': // Hap Bilgi Okuyucusu
        router.push('/(app)/explore');
        break;
      case 'h4': // Profilini Güçlendir
      case 'h6': // Yeni Bağlantı Kur
        router.push('/(app)/profile');
        break;
      default:
        router.push('/(app)');
    }
  };

  const homeCompleteTask = async () => {
    if (homeTaskCompleted) return;
    if (!homeCompassTask) return;

    let verified = false;
    try {
      const now = new Date();
      const periodStart = new Date(now);
      if (now.getHours() < 12) {
        periodStart.setHours(0, 0, 0, 0);
      } else {
        periodStart.setHours(12, 0, 0, 0);
      }
      
      // Clock drift and strict timing issues are avoided by using the start of the current 12-hour period
      // (with a 5-minute grace window).
      const thresholdTime = periodStart.getTime() - (5 * 60 * 1000);
      const thresholdISO = new Date(thresholdTime).toISOString();

      switch (homeCompassTask.id) {
        case 'h1': { // Tartışmaya Katıl
          const lastCommentTimeStr = await AsyncStorage.getItem('@kervan_last_comment_time');
          const lastCommentTime = lastCommentTimeStr ? parseInt(lastCommentTimeStr, 10) : 0;
          verified = lastCommentTime >= thresholdTime;
          
          if (!verified && profile?.id) {
            const { data } = await supabase
              .from('question_comments')
              .select('id')
              .eq('user_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length > 0) verified = true;
          }
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'En az bir tartışma sorusuna yorum yazmalısın. Şimdi "Söz Sende" sayfasına giderek fikrini paylaşmak ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/soz-sende') }
              ]
            );
            return;
          }
          break;
        }
        case 'h2': { // Bilgi Avcısı
          const lastFactReadStr = await AsyncStorage.getItem('@kervan_last_fact_read');
          const lastFactRead = lastFactReadStr ? parseInt(lastFactReadStr, 10) : 0;
          verified = lastFactRead >= thresholdTime;
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Bugünün hap bilgilerinden en az birini okumalısın. Keşfet sayfasına gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/explore') }
              ]
            );
            return;
          }
          break;
        }
        case 'h3': { // Topluluk Desteği
          const lastLikeTimeStr = await AsyncStorage.getItem('@kervan_last_like_time');
          const lastLikeTime = lastLikeTimeStr ? parseInt(lastLikeTimeStr, 10) : 0;
          verified = lastLikeTime >= thresholdTime;
          
          if (!verified && profile?.id) {
            const { data } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('user_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length >= 1) verified = true;
          }
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Söz Sende panelinde yorumları beğenerek topluluğa destek olmalısın. Şimdi sayfaya gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/soz-sende') }
              ]
            );
            return;
          }
          break;
        }
        case 'h4': { // Profilini Güçlendir
          const lastProfileViewStr = await AsyncStorage.getItem('@kervan_last_profile_view');
          const lastProfileView = lastProfileViewStr ? parseInt(lastProfileViewStr, 10) : 0;
          verified = lastProfileView >= thresholdTime;
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Profiline gidip rozetlerini ve istatistiklerini kontrol etmelisin. Profil sayfana gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/profile') }
              ]
            );
            return;
          }
          break;
        }
        case 'h5': { // Günün Sözünü Oku
          const lastQuoteReadStr = await AsyncStorage.getItem('@kervan_last_quote_read');
          const lastQuoteRead = lastQuoteReadStr ? parseInt(lastQuoteReadStr, 10) : 0;
          verified = lastQuoteRead >= thresholdTime;
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Keşfet ekranındaki "Günün Sözü" hikayesini açıp okumalısın. Keşfet sayfasına gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/explore') }
              ]
            );
            return;
          }
          break;
        }
        case 'h6': { // Yeni Bağlantı Kur
          const lastFollowStr = await AsyncStorage.getItem('@kervan_last_follow');
          const lastFollow = lastFollowStr ? parseInt(lastFollowStr, 10) : 0;
          verified = lastFollow >= thresholdTime;
          
          if (!verified && profile?.id) {
            const { data } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length > 0) verified = true;
          }
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Profil sekmesine gidip bir kullanıcıyı takip etmelisin. Profil sayfasına gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/profile') }
              ]
            );
            return;
          }
          break;
        }
        case 'h7': { // Gündem Yorumcusu
          const lastCommentTimeStr = await AsyncStorage.getItem('@kervan_last_comment_time');
          const lastCommentTime = lastCommentTimeStr ? parseInt(lastCommentTimeStr, 10) : 0;
          verified = lastCommentTime >= thresholdTime;
          
          if (!verified && profile?.id) {
            const { data } = await supabase
              .from('question_comments')
              .select('id')
              .eq('user_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length > 0) verified = true;
          }
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Keşfet ekranındaki Gündem konularından birine yorum bırakmalısın. Keşfet sayfasına gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/explore') }
              ]
            );
            return;
          }
          break;
        }
        case 'h8': { // Hap Bilgi Okuyucusu
          const lastFactReadStr = await AsyncStorage.getItem('@kervan_last_fact_read');
          const lastFactRead = lastFactReadStr ? parseInt(lastFactReadStr, 10) : 0;
          verified = lastFactRead >= thresholdTime;
          if (!verified) {
            Alert.alert(
              'Görevin Tamamlanmadı 🧭',
              'Bugünün hap bilgilerini okumalısın. Keşfet sayfasına gitmek ister misin?',
              [
                { text: 'İptal', style: 'cancel' },
                { text: 'Görevi Yap', onPress: () => router.push('/(app)/explore') }
              ]
            );
            return;
          }
          break;
        }
        default:
          verified = true;
      }
    } catch (e) {
      console.log('Verification error', e);
      verified = true;
    }

    setHomeTaskCompleted(true);
    setEarnedCompassPoints(true);
    await AsyncStorage.setItem('@kervan_compass_completed', 'true');
    await AsyncStorage.setItem('@kervan_compass_points_earned', 'true');
    loadHomeCompassTask();

    if (profile?.id) {
      try {
        // Puan SUNUCU tarafında, günde bir kez verilir (güvenlik: istemci
        // 'points' sütununu doğrudan değiştiremez — bkz. security_fixes.sql).
        const { data, error: rpcError } = await supabase.rpc('claim_compass_reward');

        if (!rpcError && data) {
          const result = data as { success: boolean; already_claimed?: boolean; points: number };
          // Sunucudan dönen güncel puanı store'a yansıt.
          useAuthStore.setState({
            profile: { ...profile, points: result.points },
          });
          await fetchProfile(profile.id);

          if (result.already_claimed) {
            Alert.alert('Görev Tamamlandı 🧭', 'Bugünün pusula ödülünü zaten almıştın. Yarın tekrar bekleriz!');
            return;
          }
        }
      } catch (e) {
        console.log('Puan güncelleme hatası', e);
      }
    }
    Alert.alert('Tebrikler 🎉', 'Görevini başarıyla tamamladın ve 25 puan kazandın!');
  };

  const homeSpinRotation = compassAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1080deg'] });

  const isFriday = new Date().getDay() === 5;

  function formatEventDate(dateStr: string) {
    const date = new Date(dateStr);
    const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${date.getDate()} ${months[date.getMonth()]} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  const userInitial = profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'K';

  // Epoch-gün indeksi: notificationService.ts ile aynı mantık — her gün farklı söz
  const epochDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  const dailyWisdom = HOME_WISDOM_POOL[epochDay % HOME_WISDOM_POOL.length];

  const historicalEvents = HISTORICAL_EVENTS_POOL[new Date().getDate() % 3];

  // Dinamik Tarih Mantığı
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonthName = today.toLocaleString('tr-TR', { month: 'long' }).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
        }
      >
        
        {/* Header Section */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.headerLeft} 
            onPress={() => router.push('/(app)/profile')}
            activeOpacity={0.7}
          >
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>Merhaba,</Text>
              <Text style={styles.userName}>{profile?.full_name || 'Kullanıcı'}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.rankingHeaderButton} 
              onPress={() => setShowTour(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="information-circle-outline" size={22} color={themeColors.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rankingHeaderButton} 
              onPress={() => setShowRanking(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="trophy-outline" size={20} color={themeColors.primary} />
            </TouchableOpacity>
            <NotificationBell />
          </View>
        </View>

        {/* Premium Hero Section */}
        <ImageBackground 
          source={require('../../assets/images/hero_bg.png')} 
          style={styles.heroCard}
          imageStyle={{ borderRadius: BorderRadius.xl }}
        >
          <LinearGradient
            colors={['rgba(15, 25, 35, 0.7)', 'rgba(15, 25, 35, 0.3)']}
            style={styles.heroOverlay}
          />
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={12} color={themeColors.primary} />
              <Text style={styles.heroBadgeText}>KERVAN ÖZEL</Text>
            </View>
            <Text style={styles.heroSubtitle}>Topluluğun bir parçası ol, yeni anılar biriktir ve geleceği birlikte inşa edelim.</Text>
            
            <View style={styles.heroActionRow}>
              <TouchableOpacity 
                style={styles.heroMainAction}
                onPress={() => router.push('/(app)/events')}
              >
                <Text style={styles.heroMainActionText}>Etkinlikleri İncele</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.heroSecondaryAction}
                onPress={() => router.push('/(app)/soz-sende')}
              >
                <Text style={styles.heroSecondaryActionText}>Yorumları Gör</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* Haftanın Sorusu (Söz Sende) - Hero'nun hemen altına */}
        <QuestionOfTheWeek
          questions={activeQuestions}
          styles={styles}
          themeColors={themeColors}
          onPressQuestion={(qid) => router.push(`/(app)/soz-sende/${qid}`)}
        />

        {/* Kervan Pusulası - Premium Kart */}
        <View style={[styles.homeCompassCard, styles.premiumShadow]}>
          <LinearGradient
            colors={[themeColors.surface, themeColors.surfaceLight]}
            style={styles.homeCompassContent}
          >
            <View style={styles.homeCompassGlow} />

            {/* Badge + Cooldown */}
            <View style={styles.homeCompassHeader}>
              <View style={styles.compassPremiumBadge}>
                <Ionicons name="compass" size={14} color={themeColors.surface} />
                <Text style={styles.compassPremiumBadgeText}>GÜNLÜK PUSULA</Text>
              </View>
              {homeCompassTask && homeCooldown && (
                <View style={styles.cooldownPill}>
                  <Ionicons name="time-outline" size={12} color={themeColors.textSecondary} />
                  <Text style={styles.cooldownPillText}>{homeCooldown}</Text>
                </View>
              )}
            </View>

            {!homeCompassTask ? (
              /* Henüz çevrilmemiş */
              <View style={styles.homeCompassSpinArea}>
                <Animated.View style={[styles.compassBigIcon, { transform: [{ rotate: homeSpinRotation }] }]}>
                  <Ionicons name="compass-outline" size={48} color={themeColors.primary} />
                </Animated.View>
                <View style={styles.homeCompassSpinTextWrap}>
                  <Text style={styles.homeCompassMainTitle}>Bugün Nereye?</Text>
                  <Text style={[styles.homeCompassDesc, { color: themeColors.textSecondary }]}>
                    Pusulayı çevir, bugünün özel hedefini keşfet ve 25 puan kazan!
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.homeSpinBtn}
                  onPress={homeSpinCompass}
                  disabled={homeIsSpinning}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[themeColors.primary, themeColors.primary + 'E6']}
                    style={styles.homeSpinBtnInner}
                  >
                    <Ionicons name="navigate-circle" size={18} color="#fff" />
                    <Text style={styles.homeSpinBtnText}>{homeIsSpinning ? 'Belirleniyor...' : 'Pusulayı Çevir'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Hedef var */
              <View style={styles.homeCompassTaskArea}>
                {/* Üst: İkon + Başlık */}
                <View style={styles.homeCompassTaskHeader}>
                  <View style={[styles.homeCompassTaskIconBig, { backgroundColor: themeColors.primary + '15', borderColor: themeColors.primary + '30' }]}>
                    <Ionicons name={homeCompassTask.icon as any} size={24} color={themeColors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.homeCompassTaskCategory, { color: themeColors.primary }]}>BUGÜNKÜ HEDEFİN</Text>
                    <Text style={[styles.homeCompassTaskTitle, { color: themeColors.textPrimary }]}>{homeCompassTask.title}</Text>
                  </View>
                </View>

                {/* Açıklama */}
                <Text style={[styles.homeCompassTaskDesc, { color: themeColors.textSecondary }]}>{homeCompassTask.desc}</Text>

                {/* İlerleme göstergesi */}
                <View style={[styles.compassProgressBar, { backgroundColor: themeColors.border }]}>
                  <View style={[styles.compassProgressFill, { width: homeTaskCompleted ? '100%' : '8%', backgroundColor: themeColors.primary }]} />
                </View>

                {/* Alt butonlar */}
                {!homeTaskCompleted ? (
                  <View style={styles.homeCompassTaskActions}>
                    <TouchableOpacity
                      style={[styles.homeTaskActionBtn, { backgroundColor: themeColors.primary }]}
                      onPress={() => handleDoTask(homeCompassTask.id)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="arrow-forward-circle" size={16} color="#fff" />
                      <Text style={styles.homeTaskActionBtnText}>Görevi Yap</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.homeTaskActionBtn, styles.homeTaskVerifyBtn, { borderColor: themeColors.primary + '50' }]}
                      onPress={homeCompleteTask}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="checkmark-circle-outline" size={16} color={themeColors.primary} />
                      <Text style={[styles.homeTaskActionBtnText, { color: themeColors.primary }]}>Kontrol Et</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Hedef başarıyla tamamlandı - Basit ve şık bir onay mesajı */
                  <View style={styles.homeCompletedState}>
                    <Ionicons name="checkmark-done-circle" size={20} color={themeColors.success} />
                    <Text style={[styles.homeCompletedText, { color: themeColors.textPrimary }]}>Hedefini başarıyla tamamladın! (+25 Puan)</Text>
                  </View>
                )}
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Cuma Mesajı (Sadece Cuma Günü) */}
        {isFriday && (
          <View style={[styles.fridayCard, styles.premiumShadow]}>
            <View style={styles.fridayGlow} />
            <View style={styles.fridayContent}>
              <View style={styles.fridayHeader}>
                <View style={styles.fridayBadge}>
                  <Ionicons name="leaf" size={12} color={themeColors.surface} />
                  <Text style={styles.fridayBadgeText}>Cumanız Mübarek Olsun</Text>
                </View>
                <Ionicons name="moon" size={20} color={themeColors.primary} opacity={0.6} />
              </View>
              <Text style={styles.fridayMessage}>
                "Hayırlı Cumalar! Bu mübarek günde kalbinizden huzur, dilinizden dua eksik olmasın. Kervan yolculuğumuzda hep birlikte nice güzel günlere."
              </Text>
              <View style={styles.fridayFooter}>
                <Text style={styles.fridaySignature}>— Kervan Ailesi</Text>
              </View>
            </View>
          </View>
        )}

        {/* Yatay Etkinlik Vitrini */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Yaklaşan Etkinlikler</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/events')}>
            <Text style={styles.seeAllText}>Tümü</Text>
          </TouchableOpacity>
        </View>
        
        {isUpcomingLoading ? (
          <View style={styles.horizontalLoading}>
            <ActivityIndicator size="small" color={themeColors.primary} />
          </View>
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {upcomingEvents.map(ev => (
              <TouchableOpacity 
                key={ev.id} 
                style={[styles.horizontalCard, { borderColor: (themeColors.categories[ev.category as keyof typeof themeColors.categories] || themeColors.border) + '40' }]}
                activeOpacity={0.9}
                onPress={() => router.push(`/(app)/events/${ev.id}`)}
              >
                <View style={[styles.horizontalCardGlow, { backgroundColor: (themeColors.categories[ev.category as keyof typeof themeColors.categories] || themeColors.primary) + '25' }]} />
                <View style={styles.horizontalCardContent}>
                  <View style={styles.horizontalCardTop}>
                    <View style={[styles.hBadge, { backgroundColor: (themeColors.categories[ev.category as keyof typeof themeColors.categories] || themeColors.primary) + '15' }]}>
                      <Ionicons name="calendar-outline" size={12} color={themeColors.categories[ev.category as keyof typeof themeColors.categories] || themeColors.primary} />
                      <Text style={[styles.hBadgeText, { color: themeColors.categories[ev.category as keyof typeof themeColors.categories] || themeColors.primary }]}>{formatEventDate(ev.event_date!)}</Text>
                    </View>
                  </View>
                  <Text style={styles.hTitle} numberOfLines={2}>{ev.title}</Text>
                  
                  {ev.location && (
                    <View style={styles.hMetaRow}>
                      <Ionicons name="location" size={14} color={themeColors.textSecondary} />
                      <Text style={styles.hMetaText} numberOfLines={1}>{ev.location}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>Şu an yaklaşan etkinlik yok.</Text>
        )}

        {/* Sıradaki Etkinliğim */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sıradaki Etkinliğin</Text>
        </View>
        {isNextLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={themeColors.primary} />
          </View>
        ) : nextEvent ? (
          <TouchableOpacity 
            style={[styles.eventCard, styles.premiumShadow, { borderColor: (themeColors.categories[nextEvent.category as keyof typeof themeColors.categories] || themeColors.border) + '40', borderWidth: 1.5 }]}
            onPress={() => router.push(`/(app)/events/${nextEvent.id}`)}
            activeOpacity={0.85}
          >
            <View style={[styles.eventCardGlow, { backgroundColor: (themeColors.categories[nextEvent.category as keyof typeof themeColors.categories] || themeColors.primary) + '20' }]} />
            <View style={styles.eventCardHeader}>
              <View style={[styles.badge, { backgroundColor: (themeColors.categories[nextEvent.category as keyof typeof themeColors.categories] || themeColors.primary) + '15' }]}>
                <Ionicons name="flash" size={12} color={themeColors.categories[nextEvent.category as keyof typeof themeColors.categories] || themeColors.primary} />
                <Text style={[styles.badgeText, { color: themeColors.categories[nextEvent.category as keyof typeof themeColors.categories] || themeColors.primary }]}>Yaklaşan</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={themeColors.textMuted} />
            </View>
            <Text style={styles.eventTitle}>{nextEvent.title}</Text>
            <View style={styles.eventMeta}>
              <Ionicons name="time-outline" size={16} color={themeColors.textSecondary} />
              <Text style={styles.eventMetaText}>
                {nextEvent.event_date ? formatEventDate(nextEvent.event_date) : 'Tarih belirtilmedi'}
              </Text>
            </View>
            {nextEvent.location && (
              <View style={styles.eventMeta}>
                <Ionicons name="location-outline" size={16} color={themeColors.textSecondary} />
                <Text style={styles.eventMetaText}>{nextEvent.location}</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyEventCard}>
            <Ionicons name="calendar-clear-outline" size={32} color={themeColors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={styles.emptyEventText}>Kayıtlı olduğun yaklaşan bir etkinlik yok.</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/events')}>
              <Text style={styles.emptyEventLink}>Etkinliklere göz at</Text>
            </TouchableOpacity>
          </View>
        )}


      </ScrollView>

      {/* Ranking Modal */}
      <Modal
        visible={showRanking}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRanking(false)}
      >
        <View style={styles.rankingModalOverlay}>
          <View style={styles.rankingModalContent}>
            <View style={styles.rankingModalHeader}>
              <View>
                <Text style={styles.rankingModalTitle}>Kervan Sıralaması</Text>
                <Text style={styles.rankingModalSubtitle}>En yüksek puanlı ilk 10 yolcu</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRanking(false)} style={styles.rankingCloseBtn}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isRankingLoading ? (
              <View style={styles.rankingLoading}>
                <ActivityIndicator color={themeColors.primary} size="large" />
              </View>
            ) : (
              <FlatList
                data={topUsers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.rankingList}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                  const isTop3 = index < 3;
                  const rankIcon = index === 0 ? 'trophy' : index === 1 ? 'medal' : index === 2 ? 'ribbon' : null;
                  const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : themeColors.textMuted;
                  const isMe = item.id === profile?.id;

                  return (
                    <TouchableOpacity
                      style={[styles.rankingItem, isMe && styles.rankingItemMe]}
                      activeOpacity={isMe ? 1 : 0.7}
                      onPress={() => {
                        if (!isMe) {
                          setShowRanking(false);
                          router.push(`/(app)/profile/${item.id}`);
                        }
                      }}
                    >
                      <View style={styles.rankNumberContainer}>
                        {rankIcon ? (
                          <Ionicons name={rankIcon as any} size={22} color={rankColor} />
                        ) : (
                          <Text style={styles.rankNumberText}>{index + 1}</Text>
                        )}
                      </View>

                      <View style={styles.rankingUserInfo}>
                        <Text style={styles.rankingUserHandle} numberOfLines={1}>
                          @{item.username || 'yolcu'} {isMe && '(Sen)'}
                        </Text>
                      </View>

                      <View style={styles.rankingPointsContainer}>
                        <Text style={styles.rankingPointsValue}>{item.points || 0}</Text>
                        <Text style={styles.rankingPointsLabel}>Puan</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        </View>
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
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing['2xl'] + 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rankingHeaderButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: themeColors.primary + '30',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: themeColors.primary + '50',
  },
  avatarText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  greetingText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
  },
  heroCard: {
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
    minHeight: 160,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: themeColors.primary + '40',
  },
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: themeColors.primary,
    letterSpacing: 1,
  },
  heroContent: {
    padding: Spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: '#fff',
    opacity: 0.9,
    marginBottom: Spacing.lg,
    lineHeight: 20,
    maxWidth: '90%',
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  heroButtonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: themeColors.primary,
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroMainAction: {
    backgroundColor: themeColors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.lg,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  heroMainActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: Typography.fontSize.md,
  },
  heroSecondaryAction: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heroSecondaryActionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: Typography.fontSize.md,
  },
  heroCircleAction: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  // Hızlı Erişim: Etkinlikler
  heroQuickAccess: {
    marginTop: Spacing.lg,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickAccessGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: themeColors.primary + '20',
  },
  quickAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    position: 'relative',
    zIndex: 1,
  },
  quickAccessIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  quickAccessBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: themeColors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  quickAccessBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  quickAccessText: {
    flex: 1,
  },
  quickAccessLabel: {
    color: themeColors.textPrimary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    marginBottom: 2,
  },
  quickAccessSubtext: {
    color: themeColors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '500',
  },
  historySection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  calendarBox: {
    width: 42,
    height: 42,
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonth: {
    fontSize: 7,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  calendarDay: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
    marginTop: -1,
  },
  historyHeaderText: {
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },

  // Home Compass Card Styles - PREMIUM
  homeCompassCard: {
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  homeCompassContent: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.primary + '30',
    borderRadius: BorderRadius.xl,
  },
  homeCompassGlow: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: themeColors.primary + '15',
    zIndex: 0,
  },
  homeCompassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    position: 'relative',
    zIndex: 2,
  },
  compassPremiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: themeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  compassPremiumBadgeText: {
    color: themeColors.surface,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  cooldownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: themeColors.surfaceLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  cooldownPillText: {
    color: themeColors.textSecondary,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  homeCompassSpinArea: {
    alignItems: 'center',
    gap: 12,
    position: 'relative',
    zIndex: 2,
  },
  compassBigIcon: {
    marginVertical: Spacing.xs,
  },
  homeCompassSpinTextWrap: {
    alignItems: 'center',
    gap: 6,
  },
  homeCompassMainTitle: {
    color: themeColors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  homeCompassDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: Spacing.sm,
  },
  homeSpinBtn: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  homeSpinBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.lg,
  },
  homeSpinBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Typography.fontSize.md,
  },
  homeCompassTaskArea: {
    gap: Spacing.md,
    position: 'relative',
    zIndex: 2,
  },
  homeCompassTaskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  homeCompassTaskIconBig: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    flexShrink: 0,
  },
  homeCompassTaskCategory: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  homeCompassTaskTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  homeCompassTaskDesc: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  compassProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  compassProgressFill: {
    height: 4,
    borderRadius: 2,
  },
  homeCompassTaskActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  homeTaskActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  homeTaskActionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  homeTaskVerifyBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  homeCompletedState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  homeCompletedText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },


  wisdomCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: themeColors.border,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  wisdomQuoteIcon: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  wisdomText: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textPrimary,
    lineHeight: 26,
    fontWeight: '600',
    fontStyle: 'italic',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  wisdomFooter: {
    alignItems: 'center',
  },
  wisdomDivider: {
    width: 40,
    height: 3,
    backgroundColor: themeColors.primary + '40',
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  wisdomAuthor: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Friday Card Styles
  fridayCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: '#2ecc7130',
    overflow: 'hidden',
    position: 'relative',
    padding: Spacing.lg,
  },
  fridayGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#2ecc7110',
    zIndex: 0,
  },
  fridayContent: {
    position: 'relative',
    zIndex: 2,
  },
  fridayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  fridayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2ecc71',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  fridayBadgeText: {
    color: themeColors.surface,
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  fridayMessage: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textPrimary,
    lineHeight: 24,
    fontStyle: 'italic',
    fontFamily: 'serif',
    marginBottom: Spacing.md,
  },
  fridayFooter: {
    alignItems: 'flex-end',
  },
  fridaySignature: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.primary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  questionOfTheWeekCard: {
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    position: 'relative',
    overflow: 'hidden',
  },
  qowContent: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.primary + '30',
    borderRadius: BorderRadius.xl,
  },
  qowGlow: {
    position: 'absolute',
    right: -30,
    bottom: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: themeColors.primary + '15',
    zIndex: 0,
  },
  qowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
    zIndex: 2,
  },
  qowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: themeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  qowBadgeText: {
    color: themeColors.surface,
    fontSize: Typography.fontSize.xs,
    fontWeight: '800',
  },
  qowTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginBottom: Spacing.xs,
    lineHeight: 24,
    position: 'relative',
    zIndex: 2,
  },
  qowSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    position: 'relative',
    zIndex: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '900',
    color: themeColors.textPrimary,
    letterSpacing: -0.5,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: themeColors.primary,
    marginBottom: 2,
  },
  horizontalScrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.md, // For shadow visibility
  },
  horizontalLoading: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  horizontalCard: {
    width: 240,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  horizontalCardGlow: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.primary + '10',
  },
  horizontalCardContent: {
    position: 'relative',
    zIndex: 2,
  },
  horizontalCardTop: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: Spacing.sm,
  },
  hBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  hBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    color: themeColors.primary,
  },
  hTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  hMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hMetaText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    flex: 1,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
  },
  premiumShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  eventCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  eventCardGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    zIndex: 0,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    position: 'relative',
    zIndex: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  eventTitle: {
    fontSize: Typography.fontSize.lg,
    color: themeColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 6,
  },
  eventMetaText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
  },
  emptyEventCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
    borderStyle: 'dashed',
    marginHorizontal: Spacing.lg,
  },
  emptyEventText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptyEventLink: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textMuted,
    paddingHorizontal: Spacing.lg,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  actionCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  actionCardContent: {
    padding: Spacing.md,
    flex: 1,
    borderWidth: 1,
    borderColor: themeColors.border,
    borderRadius: BorderRadius.lg,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionCardTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 4,
  },
  actionCardDesc: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textSecondary,
    lineHeight: 16,
  },
  // Intro Styles
  introOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  introContainer: {
    width: SCREEN_WIDTH * 0.9,
    height: 450,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  introSlide: {
    width: SCREEN_WIDTH * 0.9,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  introTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  introDesc: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  introFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  dotContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.border,
  },
  activeDot: {
    width: 24,
    backgroundColor: themeColors.primary,
  },
  introStartBtn: {
    backgroundColor: themeColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    width: '100%',
    alignItems: 'center',
  },
  introStartBtnText: {
    color: themeColors.surface,
    fontWeight: '800',
    fontSize: Typography.fontSize.md,
  },
  swipeText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.textMuted,
    fontWeight: '600',
  },
  introClose: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    padding: 8,
  },
  qowPagination: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  qowDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: themeColors.primary + '30',
  },
  qowDotActive: {
    width: 12,
    backgroundColor: themeColors.primary,
  },
  // Ranking Modal Styles
  rankingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  rankingModalContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: BorderRadius.xl * 1.5,
    borderTopRightRadius: BorderRadius.xl * 1.5,
    height: '80%',
    paddingTop: Spacing.xl,
  },
  rankingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  rankingModalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: themeColors.textPrimary,
    letterSpacing: -0.5,
  },
  rankingModalSubtitle: {
    fontSize: 14,
    color: themeColors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  rankingCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  rankingLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankingList: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    padding: 16,
    borderRadius: BorderRadius.lg,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  rankingItemMe: {
    borderColor: themeColors.primary,
    backgroundColor: themeColors.primary + '10',
    borderWidth: 2,
  },
  rankNumberContainer: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankNumberText: {
    fontSize: 18,
    fontWeight: '800',
    color: themeColors.textMuted,
  },
  rankingUserAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: themeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankingAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  rankingUserInfo: {
    flex: 1,
  },
  rankingUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  rankingUserHandle: {
    fontSize: 13,
    color: themeColors.textSecondary,
    marginTop: 2,
  },
  rankingPointsContainer: {
    alignItems: 'flex-end',
  },
  rankingPointsValue: {
    fontSize: 18,
    fontWeight: '900',
    color: themeColors.primary,
  },
  rankingPointsLabel: {
    fontSize: 10,
    color: themeColors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
