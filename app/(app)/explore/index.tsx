import React, { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  InteractionManager,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { useFocusTimer, createProfilerHandler } from '@/lib/debugPerf';
import { QUICK_FACTS } from '@/constants/facts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/stores/authStore';
import {
  EXPLORE_QUOTE_POOL,
  NATURE_BACKGROUNDS,
  QUOTE_BACKGROUNDS,
  HISTORICAL_EVENTS,
  RELIGIOUS_HOLIDAYS,
  getDayOfYear,
  getTodaySpecialDay,
} from '@/constants/storyData';
import { QUIZ_POOL, getDailyQuiz } from '@/constants/quizData';
import ExploreHeader from './_components/ExploreHeader';
import StoryModal from './_components/StoryModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Günlük sabit değerler — modül yüklendiğinde bir kez hesaplanır, mount'ta tekrar hesaplanmaz
const _DAY_OF_YEAR = getDayOfYear();
const _SPECIAL_DAY = getTodaySpecialDay();
const _DAILY_QUIZ = getDailyQuiz();
const _NATURE_BG = NATURE_BACKGROUNDS[_DAY_OF_YEAR % NATURE_BACKGROUNDS.length];
const _TODAY_QUOTE = EXPLORE_QUOTE_POOL[_DAY_OF_YEAR % EXPLORE_QUOTE_POOL.length];
const _QUOTE_BG = QUOTE_BACKGROUNDS[_DAY_OF_YEAR % QUOTE_BACKGROUNDS.length];

// Supabase'den günlük hap bilgileri çek
export async function fetchDailyFacts() {
  const todayStr = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_facts')
    .select('facts')
    .eq('fact_date', todayStr)
    .maybeSingle();
  if (error) { console.error('daily_facts fetch error:', error); return null; }
  if (!data?.facts) { console.warn('No daily facts for today:', todayStr); return null; }
  return (data.facts as any[]).map((f: any, idx: number) => ({
    id: String(f.id || idx + 1),
    title: f.title,
    desc: f.desc || f.description,
    category: f.category,
    image: f.image || f.image_url,
    color: f.color,
  }));
}

// ─── Ana Bileşen ────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  useFocusTimer('ExploreScreen');
  const exploreProfilerHandler = React.useMemo(() => createProfilerHandler('ExploreScreen'), []);

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

  // Hap bilgi modal state
  const [selectedFact, setSelectedFact] = useState<any>(null);
  const [showAllFacts, setShowAllFacts] = useState(false);

  // Puan sistemi: fact_id → boolean (bugün puan kazanıldı mı?)
  const [factPointsEarned, setFactPointsEarned] = useState<Record<string, boolean>>({});
  const { profile, fetchProfile } = useAuthStore();

  const todayKey = new Date().toISOString().split('T')[0];

  // Bugün hangi fact'lerden puan kazanıldığını AsyncStorage'dan yükle
  const loadFactPoints = React.useCallback(async (facts: any[]) => {
    const entries: Record<string, boolean> = {};
    await Promise.all(
      facts.map(async (f: any) => {
        const key = `@kervan_fact_reward_${todayKey}_${f.id}`;
        const val = await AsyncStorage.getItem(key);
        entries[f.id] = val === 'true';
      })
    );
    setFactPointsEarned(entries);
  }, [todayKey]);

  // "Okudum" butonuna basınca 2 puan kazan
  const handleOkudum = async (fact: any) => {
    // UI'yi kapat
    setSelectedFact(null);

    if (!profile?.id) return;

    const storageKey = `@kervan_fact_reward_${todayKey}_${fact.id}`;
    const alreadyLocal = await AsyncStorage.getItem(storageKey);
    if (alreadyLocal === 'true') {
      // Zaten kazanıldı, sadece kapat
      return;
    }

    try {
      const { data, error } = await supabase.rpc('claim_fact_reward', { fact_id: String(fact.id) });
      if (error) throw error;
      const result = data as { success: boolean; already_claimed?: boolean; points: number };
      if (result.success) {
        await AsyncStorage.setItem(storageKey, 'true');
        setFactPointsEarned(prev => ({ ...prev, [fact.id]: true }));
        useAuthStore.setState({ profile: { ...profile, points: result.points } });
        await fetchProfile(profile.id);
      }
    } catch (e) {
      console.log('claim_fact_reward error:', e);
    }
  };


  // Supabase hap bilgileri — animasyon sonrasına ertelendi
  const { data: supabaseDailyFacts, isLoading: isFactsQueryLoading, refetch: refetchFacts } = useQuery({
    queryKey: ['daily-facts', new Date().toISOString().split('T')[0]],
    queryFn: fetchDailyFacts,
    staleTime: 1000 * 60 * 30,
    retry: 1,
    enabled: dataEnabled,
  });
  const isFactsLoading = !dataEnabled || isFactsQueryLoading;

  // Gündem/trendler — animasyon sonrasına ertelendi
  const { data: trendQuestions, isLoading: isTrendsQueryLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['trend-questions-explore'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_questions')
        .select('id, title, question_comments!left(id)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      const generateHashtag = (title: string) => {
        const stopWords = ['mi', 'mı', 'mu', 'mü', 'nedir', 'nelerdir', 'hakkında', 'ne', 'düşünüyorsunuz', 'gibi', 'ile', 've', 'veya', 'için', 'bir', 'bu', 'şu', 'o', 'nasıl', 'neden', 'kim', 'hangisi', 'daha', 'çok', 'en'];
        const words = title.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, '').split(/\s+/).filter(w => w.length > 2);
        const keywords = words.filter(w => !stopWords.includes(w.toLowerCase())).slice(0, 3);
        if (!keywords.length) return `#${title.replace(/\s+/g, '').slice(0, 15)}`;
        return `#${keywords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')}`;
      };
      return (data || []).map((q: any, idx: number) => ({
        id: q.id,
        rank: idx + 1,
        hashtag: generateHashtag(q.title),
        title: q.title,
        posts: `${(q.question_comments?.length || 0)} yorum`,
      }));
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
    enabled: dataEnabled,
  });
  const isTrendsLoading = !dataEnabled || isTrendsQueryLoading;

  // Günlük hap bilgiler (supabase öncelikli, yoksa local fallback)
  const dailyFacts = React.useMemo(() => {
    if (supabaseDailyFacts && supabaseDailyFacts.length > 0) return supabaseDailyFacts;
    const today = new Date();
    const dayIndex = today.getDate() + (today.getMonth() * 31) + today.getFullYear();
    const shuffled = [...QUICK_FACTS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const seed = (dayIndex * (i + 1)) % (i + 1);
      const temp = shuffled[i]; shuffled[i] = shuffled[seed]; shuffled[seed] = temp;
    }
    return shuffled;
  }, [supabaseDailyFacts]);

  // Yeni bilgiler yüklenince puan durumunu sıfırla/yükle
  React.useEffect(() => {
    if (dailyFacts && dailyFacts.length > 0) {
      loadFactPoints(dailyFacts);
    }
  }, [dailyFacts, loadFactPoints]);

  // Story gruplarını oluştur — modül-level sabitler kullanılır, mount'ta hesaplanmaz
  const storiesData = React.useMemo(() => {
    const today = new Date();
    const factPool = (dailyFacts && dailyFacts.length >= 2) ? dailyFacts : QUICK_FACTS;
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
      historySlides.push({ id: 'h2', title: 'Günün Mirası', type: 'history_fact', event: _SPECIAL_DAY.event, detail: _SPECIAL_DAY.detail, image: _SPECIAL_DAY.image });
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
          question: _DAILY_QUIZ.q, options: _DAILY_QUIZ.options, correctIndex: _DAILY_QUIZ.correct, explanation: _DAILY_QUIZ.explanation,
          image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
        }],
      },
    ];
  }, [dailyFacts]);

  const closeStory = () => {
    setActiveStoryGroup(null);
    setCurrentSlideIndex(0);
    setQuizAnswer(null);
    setQuizRevealed(false);
  };

  return (
    <React.Profiler id="ExploreScreen" onRender={exploreProfilerHandler}>
    <SafeAreaView style={[styles.container]} edges={['top']}>
      {/* Header → anında render, veri bağımlılığı yok */}
      <ExploreHeader scrollY={scrollY} />

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={isFactsLoading} onRefresh={refetchFacts} tintColor={themeColors.primary} />}
      >
        {/* Hikaye Daireleri */}
        <View style={styles.storiesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesList}>
            {storiesData.map((group: any) => (
              <TouchableOpacity
                key={group.id}
                style={styles.storyItem}
                onPress={() => { setActiveStoryGroup(group); setCurrentSlideIndex(0); setQuizAnswer(null); setQuizRevealed(false); }}
                activeOpacity={0.9}
              >
                <LinearGradient colors={[group.color, group.color + 'AA']} style={styles.storyCircleGradient}>
                  <View style={styles.storyCircleInner}>
                    <Ionicons name={group.icon as any} size={28} color={group.color} />
                  </View>
                </LinearGradient>
                <Text style={styles.storyText} numberOfLines={1}>{group.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Gündem / Trendler */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Gündem</Text>
              <Text style={styles.sectionSubtitle}>En çok tartışılan konular</Text>
            </View>
            <TouchableOpacity onPress={() => refetchTrends()}>
              <Text style={styles.seeAll}>Yenile</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.trendsContainer}>
            {isTrendsLoading ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color={themeColors.primary} size="small" />
              </View>
            ) : (trendQuestions && trendQuestions.length > 0) ? (
              trendQuestions.map((trend: any) => (
                <TouchableOpacity
                  key={trend.id}
                  style={styles.trendItem}
                  onPress={() => router.push(`/(app)/soz-sende/${trend.id}` as any)}
                  activeOpacity={0.7}
                >
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendRank}>#{trend.rank} · Gündem</Text>
                    <Text style={styles.trendHashtag}>{trend.hashtag}</Text>
                    <Text style={styles.trendPosts}>{trend.posts} paylaşım</Text>
                  </View>
                  <Ionicons name="trending-up" size={20} color={themeColors.primary} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: themeColors.textMuted }}>Şu an aktif gündem bulunmuyor.</Text>
              </View>
            )}
          </View>
        </View>

        {/* Günün Hap Bilgileri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Günün Hap Bilgileri</Text>
              {supabaseDailyFacts && supabaseDailyFacts.length > 0 && (
                <Text style={[styles.sectionSubtitle, { color: themeColors.primary, fontSize: 11 }]}>
                  ✨ Bugüne özel {supabaseDailyFacts.length} bilgi · Her gün 17:00'da yenilenir
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setShowAllFacts(true)}>
              <Text style={styles.seeAll}>Tümü</Text>
            </TouchableOpacity>
          </View>
          {isFactsLoading ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <ActivityIndicator color={themeColors.primary} size="small" />
              <Text style={{ color: themeColors.textMuted, marginTop: 8, fontSize: 12 }}>Günün bilgileri yükleniyor...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.factsList}>
              {dailyFacts.map((fact: any) => (
                <TouchableOpacity
                  key={fact.id}
                  style={styles.factCard}
                  activeOpacity={0.9}
                  onPress={() => { setSelectedFact(fact); AsyncStorage.setItem('@kervan_last_fact_read', Date.now().toString()).catch(() => {}); }}
                >
                  <Image source={{ uri: fact.image }} style={styles.factImage} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.factOverlay}>
                    <View style={[styles.factBadge, { backgroundColor: fact.color || themeColors.primary }]}>
                      <Text style={styles.factBadgeText}>{fact.category}</Text>
                    </View>
                    <Text style={styles.factTitle}>{fact.title}</Text>
                    <Text style={styles.factDesc} numberOfLines={2}>{fact.desc}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Story Modal (ayrı bileşen) */}
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

      {/* Hap Bilgi Detail Modal */}
      <Modal visible={!!selectedFact} transparent animationType="slide" onRequestClose={() => setSelectedFact(null)}>
        <View style={styles.factModalContainer}>
          <View style={styles.factModalContent}>
            <Image source={{ uri: selectedFact?.image }} style={styles.factModalImage} />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={styles.factModalOverlay} />
            <TouchableOpacity style={styles.factModalClose} onPress={() => setSelectedFact(null)}>
              <Ionicons name="close-circle" size={36} color="#fff" />
            </TouchableOpacity>
            <View style={styles.factModalBody}>
              <View style={[styles.factBadge, { backgroundColor: selectedFact?.color || themeColors.primary }]}>
                <Text style={styles.factBadgeText}>{selectedFact?.category}</Text>
              </View>
              <Text style={styles.factModalTitle}>{selectedFact?.title}</Text>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.factModalDesc}>{selectedFact?.desc}</Text>
              </ScrollView>
              <TouchableOpacity
                style={[
                  styles.factModalAction,
                  { backgroundColor: factPointsEarned[selectedFact?.id] ? '#22c55e' : (selectedFact?.color || themeColors.primary), marginTop: 'auto' },
                ]}
                onPress={() => handleOkudum(selectedFact)}
              >
                <Ionicons
                  name={factPointsEarned[selectedFact?.id] ? 'checkmark-done-circle' : 'book-outline'}
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.factModalActionText}>
                  {factPointsEarned[selectedFact?.id] ? 'Okundu ✓' : 'Okudum (+2 Puan)'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* All Facts Modal */}
      <Modal visible={showAllFacts} animationType="slide" onRequestClose={() => setShowAllFacts(false)}>
        <SafeAreaView style={styles.allFactsContainer}>
          <View style={styles.allFactsHeader}>
            <TouchableOpacity onPress={() => setShowAllFacts(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={28} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.allFactsTitle}>Tüm Bilgiler</Text>
          </View>
          <FlatList
            data={dailyFacts}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.allFactsList}
            renderItem={({ item }: any) => (
              <TouchableOpacity style={styles.allFactItem} onPress={() => { setShowAllFacts(false); setSelectedFact(item); }}>
                <Image source={{ uri: item.image }} style={styles.allFactImage} />
                <View style={styles.allFactContent}>
                  <View style={[styles.factBadge, { backgroundColor: item.color }]}>
                    <Text style={styles.factBadgeText}>{item.category}</Text>
                  </View>
                  <Text style={styles.allFactTitleText}>{item.title}</Text>
                  <Text style={styles.allFactDescText} numberOfLines={2}>{item.desc}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
    </React.Profiler>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollContent: { paddingBottom: 20 },
  storiesContainer: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: themeColors.border + '30' },
  storiesList: { paddingHorizontal: Spacing.lg, gap: 15 },
  storyItem: { alignItems: 'center', width: 75 },
  storyCircleGradient: { width: 68, height: 68, borderRadius: 34, padding: 3, alignItems: 'center', justifyContent: 'center' },
  storyCircleInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: themeColors.background },
  storyText: { fontSize: 11, fontWeight: '700', color: themeColors.textPrimary, marginTop: 6, textAlign: 'center' },
  section: { marginTop: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: themeColors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: themeColors.textSecondary, marginTop: 2 },
  seeAll: { fontSize: 14, fontWeight: '700', color: themeColors.primary, marginTop: 4 },
  factsList: { paddingHorizontal: Spacing.lg, gap: 15 },
  factCard: { width: 300, height: 200, borderRadius: BorderRadius.xl, overflow: 'hidden', backgroundColor: themeColors.surface, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
  factImage: { width: '100%', height: '100%', position: 'absolute' },
  factOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.lg, justifyContent: 'flex-end' },
  factBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10 },
  factBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  factTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  factDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
  trendsContainer: { paddingHorizontal: Spacing.lg, backgroundColor: themeColors.surface, borderRadius: BorderRadius.xl, marginHorizontal: Spacing.lg, borderWidth: 1, borderColor: themeColors.border },
  trendItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: themeColors.border + '50' },
  trendInfo: { flex: 1 },
  trendRank: { fontSize: 11, color: themeColors.textMuted, fontWeight: '600' },
  trendHashtag: { fontSize: 17, fontWeight: '900', color: themeColors.textPrimary, marginVertical: 2 },
  trendPosts: { fontSize: 12, color: themeColors.textSecondary },
// Fact Modal
  factModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  factModalContent: { height: '80%', backgroundColor: themeColors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' },
  factModalImage: { width: '100%', height: 350 },
  factModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  factModalClose: { position: 'absolute', top: 20, right: 20, zIndex: 20 },
  factModalBody: { flex: 1, padding: 30, marginTop: -100 },
  factModalTitle: { fontSize: 32, fontWeight: '900', color: themeColors.textPrimary, marginBottom: 15 },
  factModalDesc: { fontSize: 18, color: themeColors.textSecondary, lineHeight: 28, marginBottom: 20 },
  factModalAction: { paddingVertical: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  factModalActionText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  // All Facts
  allFactsContainer: { flex: 1, backgroundColor: themeColors.background },
  allFactsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: 15, borderBottomWidth: 1, borderBottomColor: themeColors.border + '50' },
  backBtn: { padding: 5 },
  allFactsTitle: { fontSize: 22, fontWeight: '900', color: themeColors.textPrimary },
  allFactsList: { padding: Spacing.lg, gap: 20 },
  allFactItem: { flexDirection: 'row', backgroundColor: themeColors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', height: 110, borderWidth: 1, borderColor: themeColors.border },
  allFactImage: { width: 100, height: '100%' },
  allFactContent: { flex: 1, padding: 12, justifyContent: 'center' },
  allFactTitleText: { fontSize: 16, fontWeight: '800', color: themeColors.textPrimary, marginBottom: 4 },
  allFactDescText: { fontSize: 12, color: themeColors.textSecondary, lineHeight: 16 },
});
