import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  InteractionManager,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { QUICK_FACTS } from '@/constants/facts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import {
  EXPLORE_QUOTE_POOL,
  NATURE_BACKGROUNDS,
  QUOTE_BACKGROUNDS,
  getDayOfYear,
  getTodaySpecialDay,
} from '@/constants/storyData';
import { getDailyQuiz } from '@/constants/quizData';
import ExploreHeader from './_components/ExploreHeader';
import StoryModal from './_components/StoryModal';
import CategoryBar from './_components/CategoryBar';
import FactCardList, { FactItem } from './_components/FactCardList';

// ─── Modül-level sabitler (mount'ta hesaplanmaz) ────────────────────────────
const _DAY_OF_YEAR = getDayOfYear();
const _SPECIAL_DAY = getTodaySpecialDay();
const _DAILY_QUIZ = getDailyQuiz();
const _NATURE_BG = NATURE_BACKGROUNDS[_DAY_OF_YEAR % NATURE_BACKGROUNDS.length];
const _TODAY_QUOTE = EXPLORE_QUOTE_POOL[_DAY_OF_YEAR % EXPLORE_QUOTE_POOL.length];
const _QUOTE_BG = QUOTE_BACKGROUNDS[_DAY_OF_YEAR % QUOTE_BACKGROUNDS.length];

// ─── Supabase Hap Bilgileri ──────────────────────────────────────────────────
export async function fetchDailyFacts(): Promise<FactItem[] | null> {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_facts')
    .select('facts')
    .eq('fact_date', todayStr)
    .maybeSingle();
  if (error || !data?.facts) return null;
  return (data.facts as any[]).map((f: any, idx: number) => ({
    id: String(f.id || idx + 1),
    title: f.title,
    desc: f.desc || f.description,
    category: f.category,
    image: f.image || f.image_url,
    color: f.color,
  }));
}

// ─── Ana Bileşen ─────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  // Tab geçiş animasyonu bitmeden query başlatma
  const [dataEnabled, setDataEnabled] = useState(false);
  React.useEffect(() => {
    const t = InteractionManager.runAfterInteractions(() => setDataEnabled(true));
    return () => t.cancel();
  }, []);

  // Story state
  const [activeStoryGroup, setActiveStoryGroup] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  // Kategori state
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');

  // Kategori geçiş animasyonu
  const cardAnim = useRef(new Animated.Value(1)).current;

  // Puan sistemi
  const [factPointsEarned, setFactPointsEarned] = useState<Record<string, boolean>>({});
  const { profile, fetchProfile } = useAuthStore();
  const todayKey = new Date().toISOString().split('T')[0];

  // ─── Veri Çekme ─────────────────────────────────────────────────────────
  const {
    data: supabaseDailyFacts,
    isLoading: isFactsQueryLoading,
    refetch: refetchFacts,
  } = useQuery({
    queryKey: ['daily-facts', todayKey],
    queryFn: fetchDailyFacts,
    staleTime: 1000 * 60 * 30,
    retry: 1,
    enabled: dataEnabled,
  });
  const isFactsLoading = !dataEnabled || isFactsQueryLoading;

  // Günlük hap bilgiler (supabase öncelikli, yoksa local fallback)
  const dailyFacts = React.useMemo<FactItem[]>(() => {
    if (supabaseDailyFacts && supabaseDailyFacts.length > 0) return supabaseDailyFacts;
    const today = new Date();
    const dayIndex = today.getDate() + today.getMonth() * 31 + today.getFullYear();
    const shuffled = [...QUICK_FACTS] as FactItem[];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const seed = (dayIndex * (i + 1)) % (i + 1);
      const temp = shuffled[i]; shuffled[i] = shuffled[seed]; shuffled[seed] = temp;
    }
    return shuffled;
  }, [supabaseDailyFacts]);

  // ─── Kategoriler (dinamik) ───────────────────────────────────────────────
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    dailyFacts.forEach((f) => { if (f.category) cats.add(f.category); });
    return ['Tümü', ...Array.from(cats)];
  }, [dailyFacts]);

  // Seçili kategoriye göre filtrelenmiş liste
  const filteredFacts = React.useMemo(() => {
    if (selectedCategory === 'Tümü') return dailyFacts;
    return dailyFacts.filter((f) => f.category === selectedCategory);
  }, [dailyFacts, selectedCategory]);

  // ─── Puan Yükleme ───────────────────────────────────────────────────────
  const loadFactPoints = useCallback(async (facts: FactItem[]) => {
    const entries: Record<string, boolean> = {};
    await Promise.all(
      facts.map(async (f) => {
        const key = `@kervan_fact_reward_${todayKey}_${f.id}`;
        const val = await AsyncStorage.getItem(key);
        entries[f.id] = val === 'true';
      })
    );
    setFactPointsEarned(entries);
  }, [todayKey]);

  React.useEffect(() => {
    if (dailyFacts.length > 0) loadFactPoints(dailyFacts);
  }, [dailyFacts, loadFactPoints]);

  // ─── Kategori Değiştir ──────────────────────────────────────────────────
  const handleCategorySelect = useCallback((cat: string) => {
    if (cat === selectedCategory) return;
    // Fade out + slide left
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(() => {
      setSelectedCategory(cat);
      // Fade in + slide from right
      Animated.timing(cardAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }).start();
    });
  }, [selectedCategory, cardAnim]);

  // ─── Okudum Aksiyonu ────────────────────────────────────────────────────
  const handleOkudum = useCallback(async (fact: FactItem) => {
    if (!profile?.id) return;
    const storageKey = `@kervan_fact_reward_${todayKey}_${fact.id}`;
    const alreadyLocal = await AsyncStorage.getItem(storageKey);
    if (alreadyLocal === 'true') return;
    try {
      const { data, error } = await supabase.rpc('claim_fact_reward', {
        fact_id: String(fact.id),
      });
      if (error) throw error;
      const result = data as { success: boolean; already_claimed?: boolean; points: number };
      if (result.success) {
        await AsyncStorage.setItem(storageKey, 'true');
        setFactPointsEarned((prev) => ({ ...prev, [fact.id]: true }));
        useAuthStore.setState({ profile: { ...profile, points: result.points } });
        await fetchProfile(profile.id);
      }
    } catch {
      // Sessiz hata
    }
  }, [profile, todayKey, fetchProfile]);

  // ─── Story Verileri ─────────────────────────────────────────────────────
  const storiesData = React.useMemo(() => {
    const today = new Date();
    const factPool = dailyFacts.length >= 2 ? dailyFacts : QUICK_FACTS as FactItem[];
    const poolSize = factPool.length;
    const idx1 = _DAY_OF_YEAR % poolSize;
    const idx2 = (_DAY_OF_YEAR + Math.floor(poolSize / 2) + 1) % poolSize;
    const fact1 = factPool[idx1];
    const fact2 = factPool[idx2 === idx1 ? (idx1 + 1) % poolSize : idx2];

    const historySlides: any[] = [{
      id: 'h1', type: 'calendar',
      date: today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
      dayName: today.toLocaleDateString('tr-TR', { weekday: 'long' }),
      event: _SPECIAL_DAY ? _SPECIAL_DAY.event : null,
      detail: _SPECIAL_DAY ? _SPECIAL_DAY.detail : null,
      image: _SPECIAL_DAY ? _SPECIAL_DAY.image : _NATURE_BG,
    }];
    if (_SPECIAL_DAY) {
      historySlides.push({
        id: 'h2', title: 'Günün Mirası', type: 'history_fact',
        event: _SPECIAL_DAY.event, detail: _SPECIAL_DAY.detail, image: _SPECIAL_DAY.image,
      });
    }

    return [
      { id: 'history', title: 'Bugün', icon: 'calendar-outline', color: '#FF6B6B', slides: historySlides },
      {
        id: 'fact', title: 'Hap Bilgi', icon: 'bulb-outline', color: '#4D96FF',
        slides: [
          { id: 'f1', type: 'hap_bilgi', title: fact1.title, detail: fact1.desc, image: fact1.image, category: fact1.category, categoryColor: fact1.color },
          { id: 'f2', type: 'hap_bilgi', title: fact2.title, detail: fact2.desc, image: fact2.image, category: fact2.category, categoryColor: fact2.color },
        ],
      },
      {
        id: 'quote', title: 'Günün Sözü', icon: 'book-outline', color: '#A78BFA',
        slides: [{ id: 'q1', type: 'daily_quote', quoteText: _TODAY_QUOTE.text, quoteAuthor: _TODAY_QUOTE.author, image: _QUOTE_BG }],
      },
      {
        id: 'quiz', title: 'Bilgelik Testi', icon: 'help-circle-outline', color: '#10B981',
        slides: [{
          id: 'quiz1', type: 'quiz',
          question: _DAILY_QUIZ.q, options: _DAILY_QUIZ.options,
          correctIndex: _DAILY_QUIZ.correct, explanation: _DAILY_QUIZ.explanation,
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
        }],
      },
    ];
  }, [dailyFacts]);

  const closeStory = useCallback(() => {
    setActiveStoryGroup(null);
    setCurrentSlideIndex(0);
    setQuizAnswer(null);
    setQuizRevealed(false);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container]} edges={['top']}>
      <ExploreHeader />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFactsLoading}
            onRefresh={refetchFacts}
            tintColor={themeColors.primary}
          />
        }
      >
        {/* ── Story Daireleri ─────────────────────────────────────────── */}
        <View style={styles.storiesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          >
            {storiesData.map((group: any) => (
              <TouchableOpacity
                key={group.id}
                style={styles.storyItem}
                onPress={() => {
                  setActiveStoryGroup(group);
                  setCurrentSlideIndex(0);
                  setQuizAnswer(null);
                  setQuizRevealed(false);
                }}
                activeOpacity={0.88}
              >
                <LinearGradient
                  colors={[group.color, group.color + 'AA']}
                  style={styles.storyCircleGradient}
                >
                  <View style={[styles.storyCircleInner, { backgroundColor: themeColors.background }]}>
                    <Ionicons name={group.icon as any} size={26} color={group.color} />
                  </View>
                </LinearGradient>
                <Text style={[styles.storyText, { color: themeColors.textPrimary }]} numberOfLines={1}>
                  {group.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Bölüm Başlığı ───────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: themeColors.textPrimary }]}>
              Günün Hap Bilgileri
            </Text>
            {supabaseDailyFacts && supabaseDailyFacts.length > 0 && (
              <Text style={[styles.sectionSubtitle, { color: themeColors.primary }]}>
                ✨ {supabaseDailyFacts.length} bilgi · Her gün güncellenir
              </Text>
            )}
          </View>
          {/* Kazanılan puan sayacı */}
          <View style={[styles.pointBadge, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Ionicons name="star" size={13} color={themeColors.primary} />
            <Text style={[styles.pointText, { color: themeColors.primary }]}>
              {Object.values(factPointsEarned).filter(Boolean).length * 2} puan
            </Text>
          </View>
        </View>

        {/* ── Kategori Çubuğu ─────────────────────────────────────────── */}
        <CategoryBar
          categories={categories}
          selected={selectedCategory}
          onSelect={handleCategorySelect}
        />

        {/* ── Kart Listesi ────────────────────────────────────────────── */}
        <FactCardList
          facts={filteredFacts}
          isLoading={isFactsLoading}
          pointsEarned={factPointsEarned}
          onOkudum={handleOkudum}
          animValue={cardAnim}
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Story Modal (değişmeden korunur) ────────────────────────── */}
      <StoryModal
        storiesData={storiesData}
        activeStoryGroup={activeStoryGroup}
        currentSlideIndex={currentSlideIndex}
        onClose={closeStory}
        onSetActiveGroup={setActiveStoryGroup}
        onSetSlideIndex={setCurrentSlideIndex}
        quizAnswer={quizAnswer}
        quizRevealed={quizRevealed}
        onSetQuizAnswer={setQuizAnswer}
        onSetQuizRevealed={setQuizRevealed}
      />
    </SafeAreaView>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const createStyles = (themeColors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: themeColors.background },
    scrollContent: { paddingBottom: 20 },

    // Story daireleri
    storiesContainer: {
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border + '30',
    },
    storiesList: { paddingHorizontal: Spacing.lg, gap: 14 },
    storyItem: { alignItems: 'center', width: 72 },
    storyCircleGradient: {
      width: 66,
      height: 66,
      borderRadius: 33,
      padding: 3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyCircleInner: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    storyText: {
      fontSize: 11,
      fontWeight: '700',
      marginTop: 6,
      textAlign: 'center',
    },

    // Bölüm başlığı
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.lg,
      marginTop: Spacing.xl,
      marginBottom: 2,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '900',
    },
    sectionSubtitle: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 3,
    },
    pointBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    pointText: {
      fontSize: 13,
      fontWeight: '800',
    },
  });
