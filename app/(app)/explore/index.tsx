import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Platform,
  FlatList,
  Modal,
  StatusBar,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { QUICK_FACTS } from '@/constants/facts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- DATA ---

const STORY_DURATION = 15000; // 15 seconds

// PERFORMANS: Statik görev havuzu — render gövdesinden modül seviyesine taşındı
// (her render'da yeniden oluşturulmasın).
const IN_APP_TASKS = [
  { id: '1', title: 'Tartışmaya Katıl', desc: 'Söz Sende paneline git ve aktif bir soruya yorum yaz.', icon: 'chatbubbles' },
  { id: '2', title: 'Bilgi Avcısı', desc: 'Keşfet\'teki günün hap bilgilerinden birine tıkla ve sonuna kadar oku.', icon: 'book' },
  { id: '3', title: 'Topluluk Desteği', desc: 'Söz Sende panelinde hoşuna giden 3 farklı yoruma beğeni bırak.', icon: 'heart' },
  { id: '4', title: 'Profilini Güçlendir', desc: 'Profiline git, rozetlerini ve istatistiklerini kontrol et.', icon: 'person' },
  { id: '5', title: 'Günün Sözünü Oku', desc: 'Keşfet ekranındaki "Günün Sözü" yuvarlağına tıkla ve günün ilhamını al.', icon: 'book-outline' },
  { id: '6', title: 'Yeni Bağlantı Kur', desc: 'Profil sekmesine git ve tanıdığın birinin profilini ziyaret edip takip et.', icon: 'people' },
  { id: '7', title: 'Gündem Yorumcusu', desc: 'Keşfet\'teki Gündem bölümünde aktif bir konuya yorum bırak.', icon: 'trending-up' },
  { id: '8', title: 'Hap Bilgi Okuyucusu', desc: 'Bugünün iki hap bilgisini de oku ve yeni bir şeyler öğren.', icon: 'bulb' },
];

// Modül seviyesinde isimli fonksiyon → hem ekranda hem de prefetch (AppLayout)
// tarafında AYNI fonksiyon kullanılır (key/şema drift'i olmaz).
export async function fetchDailyFacts() {
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data, error } = await supabase
    .from('daily_facts')
    .select('facts')
    .eq('fact_date', todayStr)
    .maybeSingle();

  if (error) {
    console.error('Supabase daily_facts fetch error:', error);
    return null;
  }
  if (!data?.facts) {
    console.warn('Supabase daily_facts: No facts found for today:', todayStr);
    return null;
  }

  return (data.facts as any[]).map((f: any, idx: number) => ({
    id: String(f.id || idx + 1),
    title: f.title,
    desc: f.desc || f.description,
    category: f.category,
    image: f.image || f.image_url,
    color: f.color,
  }));
}

// STORIES_DATA is now dynamically built inside the component as storiesData

// QUICK_FACTS is now imported from constants/facts.ts

// TRENDS are now dynamic based on weekly_questions

// --- MAIN COMPONENT ---

export default function ExploreScreen() {
  const themeColors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const [activeStoryGroup, setActiveStoryGroup] = useState<any>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedFact, setSelectedFact] = useState<any>(null);
  const [showAllFacts, setShowAllFacts] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  // Quiz state
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizRevealed, setQuizRevealed] = useState(false);

  // ─── Supabase'den Günlük Hap Bilgileri ───────────────────────────────────
  const { data: supabaseDailyFacts, isLoading: isFactsLoading, refetch: refetchFacts } = useQuery({
    queryKey: ['daily-facts', new Date().toISOString().split('T')[0]],
    queryFn: fetchDailyFacts,
    staleTime: 1000 * 60 * 30, // 30 dakika cache
    retry: 1,
  });

  // Günlük Karışan (Shuffled) Hap Bilgiler Mantığı — Supabase yoksa fallback
  const dailyFacts = React.useMemo(() => {
    // Supabase'den veri geldiyse onu kullan
    if (supabaseDailyFacts && supabaseDailyFacts.length > 0) {
      return supabaseDailyFacts;
    }

    // Fallback: local data'yı günlük shuffle ile göster
    const today = new Date();
    const dayIndex = today.getDate() + (today.getMonth() * 31) + today.getFullYear();
    
    const shuffled = [...QUICK_FACTS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const seed = (dayIndex * (i + 1)) % (i + 1);
      const temp = shuffled[i];
      shuffled[i] = shuffled[seed];
      shuffled[seed] = temp;
    }
    return shuffled;
  }, [supabaseDailyFacts]);


  // Dinamik Hikayeler (Stories) Sistemi
  const storiesData = React.useMemo(() => {
    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const dateKey = `${month}-${day}`;
    // Tarih + Dini Gün Sistemi
    // Tarihi olaylar: 'ay-gun' formatı (her yıl aynı tarih)
    // Dini bayramlar: 'yil-ay-gun' formatı (hicri takvime göre her yıl farklı)

    const historicalEvents: Record<string, { event: string; detail: string; image: string }> = {
      '5-29': {
        event: 'İstanbul\'un Fethi (1453)',
        detail: 'Fatih Sultan Mehmet komutasındaki Osmanlı ordusu Bizans surlarını aşarak İstanbul\'u fethetti ve yeni bir çağ başlattı.',
        image: 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=800&auto=format&fit=crop'
      },
      '3-18': {
        event: 'Çanakkale Zaferi (1915)',
        detail: 'Çanakkale Deniz Savaşları\'nda kahraman ordumuz, İtilaf donanmasını mağlup ederek tarihe "Çanakkale Geçilmez" yazdı.',
        image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=800&auto=format&fit=crop'
      },
      '8-26': {
        event: 'Malazgirt Zaferi (1071)',
        detail: 'Sultan Alparslan liderliğindeki Selçuklu ordusu, Bizans ordusunu yenilgiye uğratarak Anadolu\'nun kapılarını Türklere ebediyen açtı.',
        image: 'https://images.unsplash.com/photo-1510952267577-fc96d5ca660a?q=80&w=800&auto=format&fit=crop'
      },
      '12-17': {
        event: 'Şeb-i Arüs – Hz. Mevlânâ (1273)',
        detail: 'Hz. Mevlânâ Celâleddîn-i Rûmî\'nin vefat gecesi; sevgilisine (Allah\'a) kavuştuğu "düğün gecesi" olarak saygıyla anılır.',
        image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?q=80&w=800&auto=format&fit=crop'
      },
      '7-9': {
        event: 'Osmanlı\'nın İlk Başkenti Bursa\'nın Fethi (1326)',
        detail: 'Orhan Gazi komutasındaki Osmanlı kuvvetleri Bursa\'yı fethederek şehri Osmanlı Devleti\'nin ilk başkenti yaptı.',
        image: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?q=80&w=800&auto=format&fit=crop'
      },
      '9-12': {
        event: 'Viyana Kuşatmasının Kaldırılması (1683)',
        detail: 'Osmanlı ordusu Viyana önünde durduruldu. Bu tarih, Osmanlı Batı ilerleyişinin dönüm noktası olarak tarihe geçti.',
        image: 'https://images.unsplash.com/photo-1467377791767-c929b5dc9a23?q=80&w=800&auto=format&fit=crop'
      },
      '4-9': {
        event: 'Edirne\'nin Osmanlı Başkenti Olması (1365)',
        detail: 'Edirne, Osmanlı Devleti\'nin ikinci başkenti oldu ve İstanbul\'un fethine kadar bu konumunu korudu.',
        image: 'https://images.unsplash.com/photo-1567359781514-3b964e2b04d6?q=80&w=800&auto=format&fit=crop'
      },
      '6-28': {
        event: 'Kosova Savaşı\'nın Yıl Dönümü (1389)',
        detail: 'Sultan I. Murat komutasındaki Osmanlı ordusu Kosova Ovası\'nda Haçlı ittifakını büyük bir zaferle mağlup etti.',
        image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop'
      },
    };

    // Dini Bayramlar ve Kandiller – Yıl bazlı kesin tarihler
    // (Hicri takvime göre her yıl değişir, güncel yıl eklenmeli)
    const religiousHolidays: Record<string, { event: string; detail: string; image: string }> = {
      // === 2026 ===
      // Ramazan Bayramı 2026
      '2026-3-20': { event: 'Ramazan Bayramı 1. Gün', detail: 'Mübarek Ramazan Bayramı\'nın ilk günü. Bir aylık oruç ibadetinin ardından kavuşulan bu bayramda sevinç ve şükür duyguları dorukta olur.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2026-3-21': { event: 'Ramazan Bayramı 2. Gün', detail: 'Ramazan Bayramı\'nın ikinci günü. Sevdiklerinizle vakit geçirmenin, hayırlı kapılar çalmanın ve gönülleri feth etmenin günü.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2026-3-22': { event: 'Ramazan Bayramı 3. Gün', detail: 'Ramazan Bayramı\'nın üçüncü ve son günü. Bayramın son gününde dualarımız ve minnettarlığımız katlanarak devam eder.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      // Kurban Bayramı 2026
      '2026-5-27': { event: 'Kurban Bayramı 1. Gün', detail: 'Mübarek Kurban Bayramı\'nın ilk günü. Hz. İbrahim\'in teslimiyetini hatırlatan bu bayram, paylaşmanın ve fedakârlığın simgesidir.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2026-5-28': { event: 'Kurban Bayramı 2. Gün', detail: 'Kurban Bayramı\'nın ikinci günü. Kesilen kurbanların etleri fakir ve muhtaçlarla paylaşılır; dayanışmanın en güzel örneği yaşanır.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2026-5-29': { event: 'Kurban Bayramı 3. Gün', detail: 'Kurban Bayramı\'nın üçüncü günü. Bayram ziyaretleri sürer, akraba ve komşulara hediyeler götürülür.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2026-5-30': { event: 'Kurban Bayramı 4. Gün', detail: 'Kurban Bayramı\'nın son günü. Dört günlük bu mübarek bayramı tamamlarken yapılan dualar kabul olsun.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      // Kandiller 2026
      '2026-1-22': { event: 'Regaib Kandili', detail: 'Recep ayının ilk Cuma gecesi idrak edilen Regaib Kandili; Hz. Muhammed\'in (s.a.v.) anne rahmine düşüşünü kutsar. Müminler bu geceyi ibadet ve dua ile geçirir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
      '2026-2-27': { event: 'Miraç Kandili', detail: 'Hz. Muhammed\'in (s.a.v.) Mekke\'den Kudüs\'e ve oradan yedi kat göğe yükselişinin anıldığı mübarek gece. Namaz ibadetinin farz kılındığı bu gece dua ile ihya edilir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
      '2026-3-14': { event: 'Berat Kandili', detail: 'Şaban ayının 15. gecesi idrak edilen Berat Kandili; gelecek yıla dair ilahi kararların belirlendiğine inanılan, af ve bağışlanmanın gecesidir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
      '2026-3-17': { event: 'Kadir Gecesi', detail: 'Bin aydan hayırlı olan Kadir Gecesi, Ramazan\'ın 27. gecesinde Kur\'an-ı Kerim\'in indirilişinin başladığı mübarek gecedir. Bu gece yapılan ibadetler kat kat değerlidir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
      '2026-9-15': { event: 'Mevlid Kandili', detail: 'Hz. Muhammed Mustafa\'nın (s.a.v.) doğumunun kutlandığı mübarek Mevlid Kandili. Salat-ü selamlar ve dualarla idrak edilen bu gece İslam dünyasında coşkuyla yaşanır.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
      '2026-12-31': { event: 'Aşure Günü', detail: 'Muharrem ayının 10. günü olan Aşure Günü; Müslümanlar için pek çok önemli olayın yaşandığı, oruç tutulup aşure pişirilen mübarek bir gündür.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },

      // === 2027 ===
      // Ramazan Bayramı 2027 (~10 Mart)
      '2027-3-10': { event: 'Ramazan Bayramı 1. Gün', detail: 'Mübarek Ramazan Bayramı\'nın ilk günü. Bir aylık oruç ibadetinin ardından kavuşulan bu bayramda sevinç ve şükür duyguları dorukta olur.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2027-3-11': { event: 'Ramazan Bayramı 2. Gün', detail: 'Ramazan Bayramı\'nın ikinci günü. Sevdiklerinizle vakit geçirmenin ve gönülleri fethetmenin günü.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2027-3-12': { event: 'Ramazan Bayramı 3. Gün', detail: 'Ramazan Bayramı\'nın son günü. Bayramı şükranla tamamlıyoruz.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      // Kurban Bayramı 2027 (~17 Mayıs)
      '2027-5-17': { event: 'Kurban Bayramı 1. Gün', detail: 'Mübarek Kurban Bayramı\'nın ilk günü. Paylaşmanın ve fedakârlığın simgesi olan bu mübarek bayramı tebrik ederiz.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2027-5-18': { event: 'Kurban Bayramı 2. Gün', detail: 'Kurban Bayramı\'nın ikinci günü. Kurbanların etleri muhtaçlarla paylaşılır; dayanışma doruk noktasına ulaşır.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2027-5-19': { event: 'Kurban Bayramı 3. Gün', detail: 'Kurban Bayramı\'nın üçüncü günü. Bayram ziyaretleri devam eder.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
      '2027-5-20': { event: 'Kurban Bayramı 4. Gün', detail: 'Kurban Bayramı\'nın son günü. Bu mübarek bayram hayırlara vesile olsun.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
    };

    // Bugünün tarihini birleştir – önce dini bayram, sonra tarihi olay
    const ymdKey = `${year}-${month}-${day}`;
    const mdKey = `${month}-${day}`;

    // 5-29 (İstanbul Fethi) Kurban Bayramına denk geliyorsa dini bayram öncelikli
    const importantDay = religiousHolidays[ymdKey] || historicalEvents[mdKey];

// Estetik Doğa Arka Planları (Önemli olmayan günlerde gösterilmek üzere)
    const natureBackgrounds = [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', // Mountain
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop', // Forest path
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop', // Misty mountains
      'https://images.unsplash.com/photo-1472214222541-d510753a4707?q=80&w=800&auto=format&fit=crop', // Green valley
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop', // Hills
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop', // Forest trees
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop', // Sea sunset
      'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800&auto=format&fit=crop', // Beach sunrise
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop', // Mountains reflection
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop'  // Valley river
    ];

    // Azim, motivasyon ve inanç temalı — yıl boyunca her gün farklı söz
    const quotePool = [
      // --- AZİM ---
      { text: 'Düşsen de kalk. Her yeniden kalkış, bir zafer başlangıcıdır.', author: 'Kervan' },
      { text: 'Zorluklar, başarının değerini artıran süslerdir.', author: 'Mimar Sinan' },
      { text: 'Sabır ağacının meyvesi tatlıdır.', author: 'Türk Atasözü' },
      { text: 'Büyük işler, büyük azimle başlar.', author: 'Hz. Ali' },
      { text: 'Vazgeçme. Henüz zamanın var.', author: 'Kervan' },
      { text: 'Damlaya damlaya göl olur; adıma adıma dağ aşılır.', author: 'Türk Atasözü' },
      { text: 'Zor günler seni kırmak için değil, şekillendirmek için gelir.', author: 'Anonim' },
      { text: 'Hiçbir engel azimli bir ruhun önünde duramaz.', author: 'Ömer Seyfettin' },
      { text: 'Yenilgi yok; ya kazanırsın ya da öğrenirsin.', author: 'İbn Haldun' },
      { text: 'Güneş her sabah yeniden doğar; sen de her gün yeniden başlayabilirsin.', author: 'Kervan' },
      { text: 'Bilmek yetmez, uygulamak gerekir. İstemek yetmez, yapmak gerekir.', author: 'Goethe' },
      { text: 'Başarı, cesareti hiç bitmeyen insanın yoludur.', author: 'Churchill' },
      { text: 'Adım atmadan yol bitmez.', author: 'Mevlânâ' },
      { text: 'Sabır; acıyı taşıma gücü değil, gecenin bitip gündüzün geleceğini bilme erdemidir.', author: 'Anonim' },
      { text: 'Her dağın ardında bir vadi vardır; yürümeye devam et.', author: 'Kervan' },
      { text: 'Bugün başlamak, yarın başlamaktan daha değerlidir.', author: 'Konfüçyüs' },
      { text: 'Yol uzun olsa da her adım hedefe götürür.', author: 'Şark Atasözü' },
      { text: 'Gelecek, dünün hazırlığıyla kurulur.', author: 'Kervan' },
      { text: 'Eğer yükselemiyorsan, merdiven inşa et.', author: 'Anonim' },
      { text: 'En büyük zafer, pes etmemektir.', author: 'Kervan' },
      // --- MOTİVASYON ---
      { text: 'Dün akıllıydım, dünyayı değiştirmek istedim. Bugün bilgeyim, kendimi değiştiriyorum.', author: 'Mevlânâ' },
      { text: 'Umut, uyanık insanların rüyasıdır.', author: 'Aristoteles' },
      { text: 'Güzel gören güzel düşünür. Güzel düşünen hayatından lezzet alır.', author: 'Bediüzzaman' },
      { text: 'Hayat bir kervandır; durmaksızın yürür.', author: 'Şark Atasözü' },
      { text: 'Her arayan bulamaz ama bulanlar ancak arayanlardır.', author: 'Bayezid-i Bistami' },
      { text: 'Küçük adımlar büyük yolculukları doğurur.', author: 'Lao Tzu' },
      { text: 'Karanlığa küfredeceğine, bir mum da sen yak.', author: 'Konfüçyüs' },
      { text: 'Başarının sırrı, başlamaktır.', author: 'Mark Twain' },
      { text: 'En uzun yolculuk tek bir adımla başlar.', author: 'Lao Tzu' },
      { text: 'Rüyaların büyüklüğü kadar yaşa.', author: 'Kervan' },
      { text: 'Zirveye giden yol, hep engebeli olur.', author: 'Anonim' },
      { text: 'Hayaller gerçeğin taslağıdır.', author: 'Ralph Waldo Emerson' },
      { text: 'Bugün yaptıkların, yarının seni belirler.', author: 'Anonim' },
      { text: 'Güçlü olmanın yolu, güçlü görünmekten değil güçlü olmaktan geçer.', author: 'Hz. Ömer' },
      { text: 'Her sabah yeni bir sayfa; onu güzelce yaz.', author: 'Kervan' },
      { text: 'İnsan, niyetine göre değer kazanır.', author: 'Hz. Muhammed (s.a.v.)' },
      { text: 'Kök ne kadar derinse, ağaç o kadar yüksek büyür.', author: 'Anonim' },
      { text: 'Kendini düzeltmekten aciz olan, başkasını düzeltemez.', author: 'Hz. Ömer' },
      { text: 'Soru sormayan öğrenemez.', author: 'Şeyh Edebali' },
      { text: 'Her gece biter; sabah gelir. Her sıkıntı geçer; güneş açar.', author: 'Anonim' },
      // --- İNANÇ ---
      { text: 'Allah bir kapı kapatırsa, başka bir kapı açar.', author: 'Hz. Ali' },
      { text: 'Tevekkül, çalışmayı bırakmak değil; sonucu Allah\'a bırakmaktır.', author: 'İmam Gazali' },
      { text: 'Sabır ve şükür; kalbin iki kanadıdır.', author: 'İbn Kayyım' },
      { text: 'Kalp temiz olursa, dilden güzel sözler çıkar.', author: 'Hz. Mevlana' },
      { text: 'Bilgiyle dirilenler ölmez.', author: 'Hz. Ali' },
      { text: 'Kendini bilen, Rabbini bilir.', author: 'Hz. Muhammed (s.a.v.)' },
      { text: 'En faydalı bilgi, insanı iyiliğe ve adalete götüren bilgidir.', author: 'İmam Gazali' },
      { text: 'Faydasız ilim, harcanmayan hazine gibidir.', author: 'Hz. Muhammed (s.a.v.)' },
      { text: 'Dua, kalbin Allah\'a uzanan eller açık halidir.', author: 'Anonim' },
      { text: 'Güzel ahlak, imandan bir parçadır.', author: 'Hz. Muhammed (s.a.v.)' },
      { text: 'Rıza; en büyük zenginliktir.', author: 'Hz. Muhammed (s.a.v.)' },
      { text: 'Zorlukla birlikte kolaylık da vardır; şüphesiz güçlükle birlikte bir kolaylık vardır.', author: "Kur'an-ı Kerim (İnşirah 5-6)" },
      { text: 'Şüphesiz Allah sabredenlerle beraberdir.', author: "Kur'an-ı Kerim (Bakara 153)" },
      { text: 'Gerçek zenginlik, bilgi ve ahlak zenginliğidir.', author: 'Farabi' },
      { text: 'Kalp; Allah\'ın evi. Onu temiz tut.', author: 'Mevlânâ' },
      { text: 'Dünya geçicidir, güzel işler kalıcıdır.', author: 'Hz. Ali' },
      { text: 'Her güneş batışında bir şükür, her güneş doğuşunda bir dua.', author: 'Kervan' },
      { text: 'İman, en güçlü kaledir.', author: 'Bediüzzaman' },
      { text: 'Adalet mülkün temelidir.', author: 'Hz. Ömer' },
      { text: 'Yüce Allah\'a güvenen, asla şaşırmaz.', author: 'Kervan' },
      // --- EKSTRA ---
      { text: 'Büyük işler, büyük azimle ve büyük niyetle başlar.', author: 'Şeyh Edebali' },
      { text: 'Hedefe odaklanırsan, engeller küçülür.', author: 'Anonim' },
      { text: 'Fırtınalar geçer; güçlü ağaçlar kök salar.', author: 'Anonim' },
      { text: 'Çalışmak ibadettir; azim ise ibadetin kalbidir.', author: 'Kervan' },
      { text: 'Kendin ol; diğer roller zaten dolu.', author: 'Oscar Wilde' },
      { text: 'Yarın değil, bugün. Sonra değil, şimdi.', author: 'Kervan' },
    ];

    // İnsan görüntüsü içermeyen doğa ve soyut arka planlar — "Günün Sözü" için
    const quoteBackgrounds = [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop', // Dağ zirvesi
      'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=800&auto=format&fit=crop', // Göl yansıması
      'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop', // Gündoğumu
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop', // Gece şehri
      'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=800&auto=format&fit=crop', // Kuş uçuşu
      'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop', // Orman sabahı
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop', // Dağ panorama
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop', // Yıldızlı gece
      'https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=800&auto=format&fit=crop', // Gün batımı deniz
      'https://images.unsplash.com/photo-1431440869543-efaf3388c585?q=80&w=800&auto=format&fit=crop', // Çorak yol
    ];

    // Yılın kaçıncı günü olduğunu hesapla (1-366) — her gün farklı söz için
    const startOfYear = new Date(year, 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay); // 1-366

    const natureBg = natureBackgrounds[dayOfYear % natureBackgrounds.length];
    const todayQuote = quotePool[dayOfYear % quotePool.length];

    // Hap bilgilerden o güne özel 2 farklı bilgi seç — dayOfYear ile her gün değişir
    // Supabase'den veri geldiyse onu, yoksa lokal QUICK_FACTS'i kullan
    const factPool = (dailyFacts && dailyFacts.length >= 2) ? dailyFacts : QUICK_FACTS;
    const poolSize = factPool.length;

    // İki farklı indeks — aralarında en az 3 fark olsun ki art arda aynı gelmesin
    const idx1 = dayOfYear % poolSize;
    const idx2 = (dayOfYear + Math.floor(poolSize / 2) + 1) % poolSize;

    const fact1 = factPool[idx1];
    const fact2 = factPool[idx2 === idx1 ? (idx1 + 1) % poolSize : idx2];

    const historySlides = [
      {
        id: 'h1',
        title: 'Tarihte Bugün',
        type: 'calendar',
        date: today.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }),
        dayName: today.toLocaleDateString('tr-TR', { weekday: 'long' }),
        event: importantDay ? importantDay.event : null,
        detail: importantDay ? importantDay.detail : null,
        image: importantDay ? importantDay.image : natureBg,
      }
    ];

    // Önemli bir günse ikinci detay slaytını ekle
    if (importantDay) {
      historySlides.push({
        id: 'h2',
        title: 'Günün Mirası',
        type: 'history_fact',
        event: importantDay.event,
        detail: importantDay.detail,
        image: importantDay.image,
      });
    }

    return [
      {
        id: 'history',
        title: 'Bugün',
        icon: 'calendar-outline',
        color: '#FF6B6B',
        slides: historySlides
      },
      {
        id: 'fact',
        title: 'Hap Bilgi',
        icon: 'bulb-outline',
        color: '#4D96FF',
        slides: [
          {
            id: 'f1',
            type: 'hap_bilgi',
            title: fact1.title,
            detail: fact1.desc,
            image: fact1.image,
            category: fact1.category,
            categoryColor: fact1.color,
          },
          {
            id: 'f2',
            type: 'hap_bilgi',
            title: fact2.title,
            detail: fact2.desc,
            image: fact2.image,
            category: fact2.category,
            categoryColor: fact2.color,
          }
        ]
      },
      {
        id: 'quote',
        title: 'Günün Sözü',
        icon: 'book-outline',
        color: '#A78BFA',
        slides: [
          {
            id: 'q1',
            type: 'daily_quote',
            title: 'Günün İlhamı',
            quoteText: todayQuote.text,
            quoteAuthor: todayQuote.author || 'Anonim',
            detail: `"${todayQuote.text}"\n\n— ${todayQuote.author || 'Anonim'}`,
            image: quoteBackgrounds[dayOfYear % quoteBackgrounds.length],
          }
        ]
      },
      {
        id: 'quiz',
        title: 'Bilgelik Testi',
        icon: 'help-circle-outline',
        color: '#10B981',
        slides: (() => {
          // 100 soruluk geniş havuz — yaklaşık 3 ayda bir tekrar
          const quizPool = [
            // --- OSMANLI & TÜRK TARİHİ ---
            { q: 'İstanbul hangi yılda fethedildi?', options: ['1389', '1453', '1526', '1683'], correct: 1, explanation: 'Fatih Sultan Mehmet, İstanbul\'u 29 Mayıs 1453\'te fethetti. Bu tarih Ortaçağ\'ın sonu ve Yeniçağ\'ın başlangıcı olarak kabul edilir.' },
            { q: 'Osmanlı Devleti\'nin kurucusu kimdir?', options: ['Orhan Gazi', 'Osman Gazi', 'Murat I', 'Yıldırım Bayezid'], correct: 1, explanation: 'Osmanlı Devleti\'ni Osman Gazi kurmuştur. 1299 yılında bağımsızlığını ilan eden devlet 1922\'ye kadar sürdü.' },
            { q: 'Malazgirt Savaşı hangi yılda yapıldı?', options: ['1048', '1071', '1096', '1176'], correct: 1, explanation: 'Malazgirt Savaşı 26 Ağustos 1071\'de Sultan Alparslan ile Bizans İmparatoru Romanos arasında yapıldı. Bu zafer Anadolu\'nun Türklere kapısını açtı.' },
            { q: 'Çanakkale Zaferi hangi yılda kazanıldı?', options: ['1912', '1915', '1919', '1922'], correct: 1, explanation: 'Çanakkale Deniz Zaferi 18 Mart 1915\'te kazanıldı. Bu tarih her yıl "Çanakkale Zaferi ve Şehitler Günü" olarak anılır.' },
            { q: 'Osmanlı\'nın ilk başkenti neresidir?', options: ['Bursa', 'Edirne', 'İstanbul', 'Söğüt'], correct: 0, explanation: 'Bursa, 1326\'da Orhan Gazi tarafından fethedilerek Osmanlı\'nın ilk büyük başkenti oldu. Daha önce geçici başkent Söğüt\'tü.' },
            { q: 'Selçuklu Devleti\'ni kim kurdu?', options: ['Tuğrul Bey', 'Alparslan', 'Sencer', 'Melikşah'], correct: 0, explanation: 'Büyük Selçuklu Devleti, Tuğrul Bey tarafından 1037\'de kuruldu. 1055\'te Bağdat\'a girerek Abbasi halifesini himayesine aldı.' },
            { q: 'Mimar Sinan\'ın kendi şaheseri olarak gösterdiği eser hangisidir?', options: ['Süleymaniye Camii', 'Selimiye Camii', 'Şehzade Camii', 'Sultanahmet Camii'], correct: 1, explanation: 'Mimar Sinan, Edirne\'deki Selimiye Camii\'ni kendi ustalık eseri olarak belirtmiştir. Süleymaniye Camii ise çıraklık eseridir.' },
            { q: 'Türkiye Cumhuriyeti hangi yılda ilan edildi?', options: ['1920', '1921', '1922', '1923'], correct: 3, explanation: 'Türkiye Cumhuriyeti 29 Ekim 1923\'te ilan edildi. Mustafa Kemal Atatürk ilk cumhurbaşkanı oldu.' },
            { q: 'Osmanlı\'da divan şiirinin en büyük şairi kimdir?', options: ['Fuzuli', 'Baki', 'Nedim', 'Şeyh Galip'], correct: 0, explanation: 'Fuzuli (1483-1556), hem Türkçe hem Arapça hem de Farsça divan şiiriyle tanınan Osmanlı\'nın en büyük lirik şairlerinden biridir.' },
            { q: 'Viyana Kuşatması kaç kez yapılmıştır?', options: ['1', '2', '3', '4'], correct: 1, explanation: 'Osmanlılar Viyana\'yı iki kez kuşattı: 1529\'da Kanuni Sultan Süleyman döneminde ve 1683\'te IV. Mehmed döneminde. Her ikisinde de şehir alınamadı.' },
            { q: 'Atatürk\'ün soyadı hangi yılda verildi?', options: ['1932', '1934', '1936', '1938'], correct: 1, explanation: '1934\'te çıkarılan Soyadı Kanunu ile Türk Büyük Millet Meclisi, Mustafa Kemal\'e "Atatürk" soyadını verdi.' },
            { q: 'Kurtuluş Savaşı hangi antlaşmayla sona erdi?', options: ['Sevr', 'Mondros', 'Lozan', 'Mudanya'], correct: 2, explanation: 'Kurtuluş Savaşı, 24 Temmuz 1923\'te imzalanan Lozan Antlaşması ile sona erdi ve Türkiye\'nin bağımsızlığı uluslararası alanda tanındı.' },

            // --- İSLAM & KUR'AN BİLGİSİ ---
            { q: 'Kur\'an-ı Kerim kaç sureden oluşur?', options: ['99', '110', '114', '120'], correct: 2, explanation: 'Kur\'an-ı Kerim 114 sureden ve 6236 ayetten oluşmaktadır. En uzun sure Bakara, en kısa sure Kevser suresidir.' },
            { q: 'Hz. Muhammed (s.a.v.) hangi şehirde doğdu?', options: ['Medine', 'Kudüs', 'Mekke', 'Taif'], correct: 2, explanation: 'Hz. Muhammed (s.a.v.) 571 yılında Mekke\'de doğdu. Bu yıl "Fil Yılı" olarak da bilinir.' },
            { q: 'Hicret hangi yılda gerçekleşti?', options: ['610', '615', '622', '632'], correct: 2, explanation: 'Hz. Muhammed (s.a.v.) ve ashabı 622 yılında Mekke\'den Medine\'ye hicret etti. İslam takvimi bu olaydan başlatılır.' },
            { q: 'İslam\'ın şartları kaçtır?', options: ['3', '4', '5', '6'], correct: 2, explanation: 'İslam\'ın beş şartı: Kelime-i Şehadet, Namaz, Oruç, Zekât ve Hac\'dır. Bu beş temel ibadet "Erkan-ı İslam" olarak adlandırılır.' },
            { q: 'Kadir Gecesi Ramazan\'ın kaçıncı gecesidir?', options: ['15. gece', '21. gece', '27. gece', '29. gece'], correct: 2, explanation: 'Kadir Gecesi, Ramazan\'ın 27. gecesi olarak yaygın şekilde kabul edilir. Kur\'an bu geceyi "bin aydan hayırlı" olarak nitelendirir.' },
            { q: 'Ramazan kaç gün sürer?', options: ['28', '29 veya 30', '31', '33'], correct: 1, explanation: 'Ramazan ayı, hicri takvimde 29 veya 30 gün sürer. Hilalin görülmesine göre bu süre belirlenir.' },
            { q: 'Mescid-i Haram hangi şehirdedir?', options: ['Medine', 'Kudüs', 'Mekke', 'Taif'], correct: 2, explanation: 'Mescid-i Haram, Mekke\'de bulunmakta ve içinde Kâbe\'yi barındırmaktadır. Müslümanların kıblegahı olan bu mescit dünyanın en büyük camisidir.' },
            { q: 'Hz. İbrahim\'in doğduğu yer neresidir?', options: ['Mekke', 'Kudüs', 'Ur (Irak)', 'Medine'], correct: 2, explanation: 'Hz. İbrahim, günümüz Irak sınırları içindeki Ur şehrinde doğmuştur. Nemrud\'un zulmünden kaçarak Harran\'a, oradan da Filistin\'e göç etmiştir.' },
            { q: 'İslam\'da namaz kaç vakit farzdır?', options: ['3', '4', '5', '6'], correct: 2, explanation: 'Günde beş vakit namaz: Sabah, Öğle, İkindi, Akşam ve Yatsı. Bu farzı Miraç gecesinde Hz. Peygamber almıştır.' },
            { q: 'Kur\'an-ı Kerim\'in en uzun suresi hangisidir?', options: ['Al-i İmran', 'Bakara', 'Nisa', 'Maide'], correct: 1, explanation: 'Bakara Suresi, 286 ayetle Kur\'an\'ın en uzun suresidir. "Baqara" Arapçada inek demektir ve bu adını içindeki inek kıssasından alır.' },
            { q: 'Dört Büyük Halifenin ilki kimdir?', options: ['Hz. Ömer', 'Hz. Osman', 'Hz. Ebubekir', 'Hz. Ali'], correct: 2, explanation: 'Hz. Ebubekir, Hz. Muhammed\'in vefatının ardından İslam\'ın ilk halifesi seçildi. Hilafeti 632-634 yılları arasında sürdü.' },
            { q: 'İslam\'da farz orucu hangi ay tutulur?', options: ['Muharrem', 'Recep', 'Şaban', 'Ramazan'], correct: 3, explanation: 'Ramazan ayında oruç tutmak İslam\'ın beş şartından biridir. Hicri takvimin dokuzuncu ayında tutulur.' },
            { q: 'Hz. Peygamber\'e ilk vahiy nerede geldi?', options: ['Mescid-i Haram\'da', 'Hira Mağarası\'nda', 'Medine\'de', 'Taif\'te'], correct: 1, explanation: 'İlk vahiy Hira Mağarası\'nda geldi. Hz. Peygamber orada tefekkür ederken Cebrail ona "Oku!" diyerek Alak Suresi\'nin ilk ayetlerini getirdi.' },
            { q: 'Kıble önce nereye doğruydu?', options: ['Mekke\'ye', 'Medine\'ye', 'Kudüs\'e', 'Taif\'e'], correct: 2, explanation: 'İlk kıble Kudüs\'teydi (Mescid-i Aksa). Hicretin 2. yılında kıble, Allah\'ın emriyle Mekke\'deki Kâbe\'ye döndürüldü.' },
            { q: 'İslam\'da abdest kaç farzdan oluşur?', options: ['3', '4', '6', '7'], correct: 1, explanation: 'Abdestin dört farzı: Yüzü yıkamak, elleri dirseklerle birlikte yıkamak, başın dörtte birini meshetmek ve ayakları topuklarla birlikte yıkamak.' },

            // --- İSLAM ALİMLERİ & MUTASAVVIFLAR ---
            { q: 'İmam Gazali\'nin en meşhur eseri hangisidir?', options: ['Mesnevi', 'İhya-u Ulumiddin', 'Fususül-Hikem', 'Mukaddime'], correct: 1, explanation: 'İhya-u Ulumiddin (Din İlimlerinin Yeniden Canlandırılması), İmam Gazali\'nin en önemli eseridir. Asırlardır okunmaya devam etmektedir.' },
            { q: 'Hz. Mevlana\'nın eseri Mesnevi kaç ciltten oluşur?', options: ['3', '5', '6', '7'], correct: 2, explanation: 'Mevlana Celaleddin-i Rumi\'nin Mesnevi\'si 6 ciltten ve yaklaşık 25.000 beyitten oluşmaktadır. Farsça yazılmıştır.' },
            { q: 'İbn-i Battuta hangi ülkelidir?', options: ['Mısırlı', 'Faslı', 'İranlı', 'Türk'], correct: 1, explanation: 'İbn-i Battuta (1304-1368), Fas\'ın Tanca şehrinde doğmuş büyük İslam seyyahıdır. 29 yılda 120.000 km\'yi aşkın mesafe kat etti.' },
            { q: 'İbn-i Sina hangi alanda öncüdür?', options: ['Matematik', 'Tıp & Felsefe', 'Astronomi', 'Kimya'], correct: 1, explanation: 'İbn-i Sina (980-1037), "Tıbbın Kanunu" adlı eseriyle hem İslam dünyasına hem de Avrupa\'ya yüzyıllarca rehberlik etmiştir.' },
            { q: 'Farabi\'nin lakabı nedir?', options: ['Üstad-ı Evvel', 'Muallim-i Sani', 'Hüccetü\'l-İslam', 'Şeyhu\'r-Reis'], correct: 1, explanation: 'Farabi "Muallim-i Sani" (İkinci Öğretmen) lakabıyla anılır. Birinci öğretmen ise Aristoteles\'tir. Mantık ve müzik alanlarında devrimci çalışmalar yapmıştır.' },
            { q: 'Bediüzzaman Said Nursi\'nin temel eseri hangisidir?', options: ['Risale-i Nur', 'Mesnevi', 'Fütuhat', 'İhya'], correct: 0, explanation: 'Bediüzzaman Said Nursi\'nin Risale-i Nur Külliyatı, modern çağda İslam\'ın imani meselelerini akli delillerle ele alan temel bir eserdir.' },
            { q: 'İmam-ı Azam Ebu Hanife\'nin kurduğu mezhep hangisidir?', options: ['Maliki', 'Şafii', 'Hanbeli', 'Hanefi'], correct: 3, explanation: 'Ebu Hanife\'nin kurduğu Hanefi mezhebi, Türkiye dahil pek çok ülkede en yaygın fıkıh mezhebidir. Ebu Hanife 699-767 yılları arasında yaşadı.' },
            { q: 'Hallac-ı Mansur "Enel Hak" derken ne kastetmiştir?', options: ['Ben Allah\'ım', 'Bende Hak tecelli etti', 'Ben haklıyım', 'Sadece şiir söyledi'], correct: 1, explanation: 'Hallac-ı Mansur\'un "Enel Hak" (Ben Hak\'ım) sözü vahdet-i vücud anlayışında ilahi aşkın zirvesini ifade eder; "Allah bende tecelli etti" anlamındadır.' },

            // --- PEYGAMBERLER ---
            { q: 'Hz. Nuh\'un gemisi hangi dağa oturdu?', options: ['Ağrı Dağı', 'Cudi Dağı', 'Sinai Dağı', 'Zeytin Dağı'], correct: 1, explanation: 'Kur\'an\'a göre Hz. Nuh\'un gemisi Cudi Dağı\'na oturmuştur. Bu dağ günümüzde Türkiye\'nin Şırnak ilinde yer almaktadır.' },
            { q: 'Kur\'an\'da adı en çok geçen peygamber kimdir?', options: ['Hz. Muhammed', 'Hz. İsa', 'Hz. Musa', 'Hz. İbrahim'], correct: 2, explanation: 'Hz. Musa\'nın adı Kur\'an\'da 136 kez geçmektedir. Hz. Muhammed\'in adı ise 4 kez doğrudan geçer.' },
            { q: 'Hz. Yusuf hangi ülkede kral olmuştur?', options: ['Arabistan', 'Irak', 'Mısır', 'Filistin'], correct: 2, explanation: 'Hz. Yusuf, kardeşleri tarafından kuyuya atıldıktan sonra Mısır\'a götürülmüş ve orada Firavun\'un yanında yönetici konumuna yükselmiştir.' },
            { q: 'Hz. Süleyman hangi hayvana rüzgarı binmek için kullanmıştır?', options: ['At', 'Uçan halı', 'Rüzgar kendisi', 'Kartal'], correct: 2, explanation: 'Kur\'an\'a göre Allah, Hz. Süleyman\'a rüzgarı boyun eğdirmiştir; "sabah gidişi bir ay, akşam dönüşü bir ay mesafeyi kapsıyordu." (Sebe 12)' },
            { q: 'Hz. İsa\'nın annesi kimdir?', options: ['Hz. Meryem', 'Hz. Hacer', 'Hz. Asiye', 'Hz. Fatıma'], correct: 0, explanation: 'Hz. İsa, Kur\'an\'da "İsa bin Meryem" olarak adlandırılır. Annesi Hz. Meryem\'dir. Kur\'an\'da Meryem adına ayrı bir sure bulunmaktadır.' },
            { q: 'Kur\'an\'da adı geçen tek kadın kimdir?', options: ['Hz. Fatıma', 'Hz. Hatice', 'Hz. Meryem', 'Hz. Aişe'], correct: 2, explanation: 'Hz. Meryem, Kur\'an\'da adı doğrudan geçen tek kadındır. Kur\'an\'da ona ayrılan "Meryem" suresi 19. suredir.' },

            // --- TÜRK KÜLTÜRÜ & COĞRAFYASİ ---
            { q: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'İzmir', 'Bursa', 'Ankara'], correct: 3, explanation: 'Ankara, 13 Ekim 1923\'te Türkiye Cumhuriyeti\'nin başkenti ilan edildi.' },
            { q: 'Türk alfabesi kaç harften oluşur?', options: ['26', '28', '29', '33'], correct: 2, explanation: 'Türk alfabesi 29 harften oluşmaktadır. 1928 yılında harf inkılabıyla Latin alfabesine geçildi.' },
            { q: 'Türkiye\'nin en uzun nehri hangisidir?', options: ['Dicle', 'Fırat', 'Kızılırmak', 'Yeşilırmak'], correct: 2, explanation: 'Kızılırmak, 1355 km ile Türkiye\'nin en uzun nehridir. Anadolu\'nun ortasından kıvrılarak Karadeniz\'e dökülür.' },
            { q: 'Türk kahvesi UNESCO tarafından ne zaman kültürel miras ilan edildi?', options: ['2008', '2013', '2015', '2019'], correct: 1, explanation: 'Türk kahvesi kültürü ve geleneği, 2013 yılında UNESCO İnsanlığın Somut Olmayan Kültürel Mirası Listesi\'ne alındı.' },
            { q: 'Göktürk Kağanlığı ne zaman kuruldu?', options: ['552', '630', '744', '840'], correct: 0, explanation: 'Birinci Göktürk Kağanlığı 552 yılında Bumin Kağan tarafından kuruldu. Türklerin ilk büyük devletlerinden biri olarak tarihte önemli bir yer tutar.' },
            { q: 'Türk kimdir? Sorusunu kim sormuştur?', options: ['Atatürk', 'Mehmet Akif', 'Ziya Gökalp', 'Namık Kemal'], correct: 2, explanation: 'Ziya Gökalp, Türk milletçiliğinin düşünce babası kabul edilir. "Türk kimdir?" sorusunu sistematik biçimde ele alan ilk sosyologdur.' },

            // --- BİLİM & TEKNOLOJİ ---
            { q: 'Dünyanın güneş etrafında dönme süresi kaç gündür?', options: ['354', '360', '365.25', '370'], correct: 2, explanation: 'Dünya, güneş etrafındaki tam bir turunu yaklaşık 365.25 günde tamamlar. Bu nedenle her 4 yılda bir "artık yıl" eklenir.' },
            { q: 'Su molekülünün kimyasal formülü nedir?', options: ['HO', 'H2O', 'H2O2', 'HO2'], correct: 1, explanation: 'Su, iki hidrojen ve bir oksijen atomundan oluşur: H₂O. Hayatın temel maddesidir ve Dünya\'nın yüzeyinin %71\'ini kaplar.' },
            { q: 'İnsan vücudunda kaç kemik bulunur?', options: ['176', '206', '248', '300'], correct: 1, explanation: 'Yetişkin insan iskeleti 206 kemikten oluşur. Bebeklerde bu sayı 270-300 civarındayken yaşla birlikte kemikler birleşerek azalır.' },
            { q: 'Güneş sistemimizin en büyük gezegeni hangisidir?', options: ['Satürn', 'Neptün', 'Jüpiter', 'Uranüs'], correct: 2, explanation: 'Jüpiter, güneş sisteminin en büyük gezegenidir. Kütlesi Dünya\'nın 318 katıdır. Büyük Kırmızı Leke adı verilen fırtınasıyla tanınır.' },
            { q: 'Işık hızı yaklaşık kaç km/sn\'dir?', options: ['100.000', '200.000', '300.000', '400.000'], correct: 2, explanation: 'Işık, saniyede yaklaşık 299.792 km yol alır. Bu hız fiziğin temel sabitlerinden biri olup hiçbir madde bu hıza ulaşamaz.' },
            { q: 'DNA\'nın açılımı nedir?', options: ['Deoksiribonükleik Asit', 'Dinükleik Asit', 'Difosforik Asit', 'Diribonükleik Asit'], correct: 0, explanation: 'DNA (Deoksiribonükleik Asit), canlıların genetik bilgisini taşıyan moleküldür. İnsan DNA\'sı yaklaşık 3 milyar baz çiftinden oluşur.' },
            { q: 'Periyodik tabloda kaç element bulunur?', options: ['92', '108', '118', '128'], correct: 2, explanation: 'Güncel periyodik tabloda 118 element bulunmaktadır. Bunların 94\'ü doğada oluşur, geri kalanları laboratuvarda sentezlenmiştir.' },
            { q: 'Newton\'un yer çekimi yasasını keşfetmesine ne ilham verdi?', options: ['Elma düşmesi', 'Ay tutulması', 'Yıldız gözlemi', 'Su dalgaları'], correct: 0, explanation: 'Newton\'un elma ağacının altında otururken düşen bir elmayı görmesi yer çekimi düşüncesine ilham verdiği söylenir. Bu olay Cambridge\'de yaşandı.' },

            // --- DÜNYA TARİHİ ---
            { q: 'Büyük İskender hangi ülkeden çıkmıştır?', options: ['Yunanistan', 'Makedonya', 'Roma', 'Pers'], correct: 1, explanation: 'Büyük İskender (M.Ö. 356-323), Makedonya Krallığı\'ndan çıkmış ve Anadolu\'dan Hindistan\'a kadar geniş bir coğrafyayı fetheden büyük komutandır.' },
            { q: 'Fransız Devrimi hangi yılda başladı?', options: ['1776', '1789', '1799', '1815'], correct: 1, explanation: 'Fransız Devrimi 1789\'da Bastille Hapishanesi\'nin basılmasıyla sembolik olarak başladı. "Özgürlük, Eşitlik, Kardeşlik" sloganı dünyayı değiştirdi.' },
            { q: 'Çin Seddi hangi amaçla inşa edilmiştir?', options: ['Kanallar için', 'Yollar için', 'Kuzeyden gelen saldırılara karşı', 'Sınır belirtmek için'], correct: 2, explanation: 'Çin Seddi, başta Moğol ve Türk akınları olmak üzere kuzeyden gelen saldırıları önlemek amacıyla M.Ö. 7. yüzyıldan itibaren inşa edilmiştir.' },
            { q: 'Mona Lisa\'yı kim yazmıştır?', options: ['Michelangelo', 'Rafael', 'Leonardo da Vinci', 'Botticelli'], correct: 2, explanation: 'Mona Lisa, Leonardo da Vinci tarafından 1503-1519 yılları arasında yapılmıştır. Şu anda Paris\'teki Louvre Müzesi\'nde sergilenmektedir.' },
            { q: 'İlk Olimpiyat Oyunları nerede düzenlendi?', options: ['Roma', 'Atina', 'Sparta', 'Olimpia'], correct: 3, explanation: 'İlk antik Olimpiyat Oyunları M.Ö. 776\'da Yunanistan\'ın Olimpia şehrinde düzenlendi. Modern olimpiyatlar ise 1896\'da Atina\'da yeniden başladı.' },
            { q: 'Pekin hangi ülkenin başkentidir?', options: ['Japonya', 'Kore', 'Çin', 'Vietnam'], correct: 2, explanation: 'Pekin (Beijing), Çin Halk Cumhuriyeti\'nin başkentidir. Yaklaşık 22 milyon nüfusuyla dünyanın en kalabalık şehirlerinden biridir.' },
            { q: 'Rönesans hangi ülkede başladı?', options: ['Fransa', 'İspanya', 'İtalya', 'Almanya'], correct: 2, explanation: 'Rönesans (Yeniden Doğuş), 14. yüzyılda İtalya\'nın Floransa şehrinde başladı. Sanat, mimari, bilim ve felsefeyi derinden dönüştürdü.' },
            { q: 'Amerika\'yı Avrupalılar adına kim keşfetti?', options: ['Magellan', 'Vasco da Gama', 'Kristof Kolomb', 'Amerigo Vespucci'], correct: 2, explanation: 'Kristof Kolomb, 1492\'de İspanya adına Amerika\'ya ulaştı. Ancak kıtanın ismi, coğrafyayı belgelemesiyle ünlü Amerigo Vespucci\'den gelir.' },

            // --- COĞRAFYA ---
            { q: 'Dünyanın en uzun nehri hangisidir?', options: ['Amazon', 'Nil', 'Yangtze', 'Mississippi'], correct: 1, explanation: 'Nil Nehri, yaklaşık 6.650 km uzunluğuyla dünyanın en uzun nehridir. Etiyopya\'dan başlayıp Mısır üzerinden Akdeniz\'e dökülür.' },
            { q: 'Dünyanın en yüksek dağı hangisidir?', options: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'], correct: 2, explanation: 'Everest Dağı, 8.849 metre yüksekliğiyle dünyanın en yüksek zirvesidir. Nepal ile Tibet sınırında yer alır.' },
            { q: 'Okyanusların en derin noktası neresidir?', options: ['Bermuda Üçgeni', 'Mariana Çukuru', 'Puerto Rico Çukuru', 'Java Çukuru'], correct: 1, explanation: 'Büyük Okyanus\'taki Mariana Çukuru\'nun en derin noktası "Challenger Deep" yaklaşık 11.000 metre derinliktedir.' },
            { q: 'Avrupa\'nın en uzun nehri hangisidir?', options: ['Ren', 'Tuna', 'Volga', 'Elbe'], correct: 2, explanation: 'Volga Nehri, yaklaşık 3.530 km uzunluğuyla Avrupa\'nın en uzun nehridir. Rusya\'dan geçerek Hazar Denizi\'ne dökülür.' },
            { q: 'Türkiye kaç komşu ülkeyle sınır paylaşır?', options: ['6', '7', '8', '9'], correct: 2, explanation: 'Türkiye 8 ülkeyle sınır paylaşır: Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Azerbaycan (Nahçıvan), İran, Irak ve Suriye.' },

            // --- SANAT & EDEBİYAT ---
            { q: 'Türk edebiyatının ilk romanı hangisidir?', options: ['İntibah', 'Taaşşuk-ı Talat ve Fitnat', 'Araba Sevdası', 'Zehra'], correct: 1, explanation: 'Şemseddin Sami\'nin yazdığı Taaşşuk-ı Talat ve Fitnat (1872), Türk edebiyatının genellikle ilk romanı olarak kabul edilir.' },
            { q: 'Mehmet Akif Ersoy\'un en ünlü şiiri hangisidir?', options: ['Çanakkale Şehitlerine', 'Seyfi Baba', 'İstiklal Marşı', 'Fatih Kürsüsünde'], correct: 2, explanation: 'Mehmet Akif Ersoy, 1921\'de yazdığı İstiklal Marşı ile ölümsüzleşmiştir. Şiiri bugün Türkiye\'nin ulusal marşı olarak okunmaktadır.' },
            { q: 'Dede Korkut hangi dönemde yaşamıştır?', options: ['Göktürk', 'Uygur', 'Oğuz Türkleri', 'Osmanlı'], correct: 2, explanation: 'Dede Korkut, Oğuz Türkleri dönemine ait destansi hikâyelerin anlatıcısı-kahramanıdır. Kitab-ı Dede Korkut, Türk edebiyatının temel eserleri arasındadır.' },
            { q: 'Şekspir hangi ülkede yaşamıştır?', options: ['Fransa', 'Almanya', 'İngiltere', 'İspanya'], correct: 2, explanation: 'William Shakespeare (1564-1616), İngiltere\'nin Stratford-upon-Avon şehrinde doğmuş ve Londra\'da yaşamıştır. Hamlet, Othello ve Romeo & Juliet başlıca eserleridir.' },

            // --- FELSEFE ---
            { q: 'Sokrates\'in en ünlü sözü hangisidir?', options: ['"Düşünüyorum, öyleyse varım"', '"Kendini bil"', '"Güzellik gözlemcinin gözündedir"', '"İnsan ölçütü her şeyin"'], correct: 1, explanation: '"Kendini Bil" (Gnothi Seauton) Sokrates\'in en temel öğretisidir. Delfi Tapınağı\'nın girişine de yazılıydı.' },
            { q: '"Cogito ergo sum" (Düşünüyorum, öyleyse varım) kimin sözüdür?', options: ['Kant', 'Platon', 'Descartes', 'Hegel'], correct: 2, explanation: 'René Descartes\'ın bu meşhur sözü, felsefe tarihinin dönüm noktasını oluşturur. Her şeyden şüphe etse de, şüphe eden bir "ben"in var olduğundan emin olduğunu ifade eder.' },
            { q: 'Aristoteles kimin öğrencisidir?', options: ['Sokrates', 'Platon', 'Tales', 'Epikür'], correct: 1, explanation: 'Aristoteles, Platon\'un Akademisi\'nde eğitim gördü. Platon da Sokrates\'in öğrencisiydi. Bu üçlü Antik Yunan felsefesinin temelini attı.' },

            // --- SPOR ---
            { q: 'FIFA Dünya Kupası kaç yılda bir düzenlenir?', options: ['2', '3', '4', '5'], correct: 2, explanation: 'FIFA Dünya Kupası, 1930\'dan beri her 4 yılda bir düzenlenmektedir. Savaş yılları olan 1942 ve 1946\'da düzenlenemedi.' },
            { q: 'Türkiye\'nin en köklü futbol kulübü hangisidir?', options: ['Beşiktaş', 'Fenerbahçe', 'Galatasaray', 'Trabzonspor'], correct: 0, explanation: 'Beşiktaş JK, 1903 yılında kurularak Türkiye\'nin en eski spor kulübü unvanını taşır.' },
            { q: 'Olimpiyat oyunlarında ne kadar yüzmek 100 metre olarak geçer?', options: ['25m havuzda 4 tur', '50m havuzda 2 tur', '50m havuzda 1 tur', '25m havuzda 2 tur'], correct: 1, explanation: 'Olimpiyat yüzme müsabakaları 50 metre uzunluğundaki havuzlarda yapılır. 100 metre için 2 tur yüzülür.' },

            // --- GENEL KÜLTÜR ---
            { q: 'Dünya\'nın en kalabalık ülkesi hangisidir?', options: ['Hindistan', 'Çin', 'ABD', 'Endonezya'], correct: 0, explanation: '2023 itibarıyla Hindistan, yaklaşık 1.43 milyar nüfusuyla Çin\'i geçerek dünyanın en kalabalık ülkesi oldu.' },
            { q: 'Nobel Ödülü kaç farklı alanda verilir?', options: ['4', '5', '6', '7'], correct: 2, explanation: 'Nobel Ödülleri 6 alanda verilmektedir: Fizik, Kimya, Tıp, Edebiyat, Barış ve Ekonomi (1969\'dan itibaren). Alfred Nobel\'in vasiyetiyle kurulmuştur.' },
            { q: 'İnternetin mucidi kimdir?', options: ['Bill Gates', 'Steve Jobs', 'Tim Berners-Lee', 'Alan Turing'], correct: 2, explanation: 'Tim Berners-Lee, 1989\'da World Wide Web\'i icat etti. İnternetin temelini oluşturan bu sistem, bilgiye erişimi tamamen dönüştürdü.' },
            { q: 'Hangisi bir programlama dili değildir?', options: ['Python', 'Java', 'HTML', 'Kotlin'], correct: 2, explanation: 'HTML (HyperText Markup Language) bir programlama dili değil, işaretleme dilidir. Web sayfalarının yapısını tanımlamak için kullanılır.' },
            { q: 'Bal arısı bir çifte dönüşüm için kaç çiçeği ziyaret eder?', options: ['100-200', '500-1000', '2.000.000', '50.000'], correct: 2, explanation: 'Bir kilo bal için arıların yaklaşık 2 milyon çiçeği ziyaret etmesi gerekir. Bir işçi arı ömrü boyunca yalnızca 1/12 çay kaşığı bal üretir.' },
            { q: 'Japon "origami" ne demektir?', options: ['Kağıt katlama sanatı', 'Fırça resmi', 'Çiçek düzenleme', 'Mürekkep boyama'], correct: 0, explanation: 'Origami, Japonca "kağıt katlamak" anlamına gelir (ori=katlamak, kami=kağıt). 17. yüzyılda Japonya\'da gelişen ve dünyaya yayılan bir sanattır.' },

            // --- EK İSLAM TARİHİ ---
            { q: 'Abbasi Halifeliği\'nin merkezi neresidir?', options: ['Şam', 'Bağdat', 'Kahire', 'Kurtuba'], correct: 1, explanation: 'Abbasi Halifeliği\'nin başkenti Bağdat\'tır. Harun Reşid döneminde Bağdat, dünyanın en büyük ve en gelişmiş şehri haline geldi.' },
            { q: 'Haçlı Seferleri kaç yıl sürmüştür?', options: ['50 yıl', '100 yıl', '200 yıl', 'Yaklaşık 200 yıl'], correct: 3, explanation: 'Haçlı Seferleri, 1096\'dan 1291\'e kadar yaklaşık 200 yıl sürmüştür. Bu süreçte 8 büyük sefer düzenlenmiştir.' },
            { q: 'Selahaddin Eyyubi Kudüs\'ü hangi yılda Haçlılardan geri aldı?', options: ['1147', '1187', '1212', '1248'], correct: 1, explanation: 'Selahaddin Eyyubi (Saladin), 1187\'de Hittin Savaşı\'nda Haçlıları mağlup ettikten sonra Kudüs\'ü 88 yıllık Haçlı işgalinden kurtardı.' },
            { q: 'Endülüs Emevi Halifeliği hangi şehirde kurulmuştu?', options: ['Granada', 'Sevilla', 'Kurtuba', 'Toledo'], correct: 2, explanation: 'Endülüs Emevi Halifeliği\'nin merkezi Kurtuba (Córdoba) şehriydi. 10. yüzyılda Kurtuba, Avrupa\'nın en büyük ve en gelişmiş şehriydi.' },
          ];


          const today = new Date();
          const startOfYear = new Date(today.getFullYear(), 0, 0);
          const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
          const todayQ = quizPool[dayOfYear % quizPool.length];

          return [{
            id: 'quiz1',
            type: 'quiz',
            question: todayQ.q,
            options: todayQ.options,
            correctIndex: todayQ.correct,
            explanation: todayQ.explanation,
            image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800&auto=format&fit=crop',
          }];
        })(),
      }
    ];
  }, [dailyFacts]);


  // Kervan Pusulası States
  const compassAnim = useRef(new Animated.Value(0)).current;
  const [dailyTask, setDailyTask] = useState<any>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [cooldownTime, setCooldownTime] = useState<string | null>(null);

  const COOLDOWN_HOURS = 12;

  const loadDailyTask = async () => {
    try {
      const savedTaskStr = await AsyncStorage.getItem('@kervan_compass_task');
      const timestampStr = await AsyncStorage.getItem('@kervan_compass_time');
      const completedStr = await AsyncStorage.getItem('@kervan_compass_completed');
      
      if (savedTaskStr && timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const now = Date.now();
        const diffHours = (now - timestamp) / (1000 * 60 * 60);

        if (diffHours < COOLDOWN_HOURS) {
          setDailyTask(JSON.parse(savedTaskStr));
          setIsTaskCompleted(completedStr === 'true');
          
          const remainingMs = (COOLDOWN_HOURS * 60 * 60 * 1000) - (now - timestamp);
          const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
          const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setCooldownTime(`${remainingHours}s ${remainingMins}d`);
        } else {
          // Sure doldu, pusulayi sifirla
          await AsyncStorage.multiRemove(['@kervan_compass_task', '@kervan_compass_time', '@kervan_compass_completed']);
          setDailyTask(null);
          setIsTaskCompleted(false);
          setCooldownTime(null);
        }
      }
    } catch (e) {
      console.log('Task load error', e);
    }
  };

  // PERFORMANS (Faz 4): useIsFocused yerine useFocusEffect. useIsFocused odak
  // değişiminde bu 1700+ satırlık ekranı tamamen yeniden render edip sekme geçişini
  // kekeletiyordu. useFocusEffect render tetiklemeden odak/blur'da çalışır.
  useFocusEffect(
    React.useCallback(() => {
      loadDailyTask();
      const interval = setInterval(() => {
        loadDailyTask();
      }, 60000); // Her dakika sureyi guncelle
      AsyncStorage.setItem('@kervan_last_explore_view', Date.now().toString()).catch(() => {});
      return () => clearInterval(interval);
    }, [])
  );

  const spinCompass = () => {
    if (isSpinning) return;

    if (dailyTask && !isTaskCompleted) {
      Alert.alert('Hedef Devam Ediyor', 'Lütfen yeni bir hedef için önce şu anki hedefimizi gerçekleştirelim.');
      return;
    } else if (dailyTask && isTaskCompleted) {
      Alert.alert('Dinlenme Süresi', `Yeni pusula için dinlenme süresini beklemen gerekiyor. Kalan süre: ${cooldownTime}`);
      return;
    }

    setIsSpinning(true);
    compassAnim.setValue(0);
    
    Animated.timing(compassAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(async () => {
      const randomTask = IN_APP_TASKS[Math.floor(Math.random() * IN_APP_TASKS.length)];
      setDailyTask(randomTask);
      setIsSpinning(false);
      setIsTaskCompleted(false);
      
      await AsyncStorage.setItem('@kervan_compass_task', JSON.stringify(randomTask));
      await AsyncStorage.setItem('@kervan_compass_time', Date.now().toString());
      await AsyncStorage.setItem('@kervan_compass_completed', 'false');
      
      loadDailyTask();
    });
  };

  const completeCompassTask = async () => {
    if (isTaskCompleted) return;
    setIsTaskCompleted(true);
    await AsyncStorage.setItem('@kervan_compass_completed', 'true');
    loadDailyTask();
    Alert.alert('Tebrikler! 🎉', 'Hedefine ulaştın ve 25 Puan kazandın. Pusulayı tekrar çevirmek için dinlenme süresinin dolmasını bekle.');
  };

  const spinRotation = compassAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'], // 3 full spins
  });

  const { data: trendQuestions, isLoading: isTrendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['trend-questions-explore'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('weekly_questions')
        .select(`
          id, 
          title, 
          question_comments!left(id)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      const generateHashtag = (title: string) => {
        const stopWords = ['mi', 'mı', 'mu', 'mü', 'nedir', 'nelerdir', 'hakkında', 'ne', 'düşünüyorsunuz', 'gibi', 'ile', 've', 'veya', 'için', 'bir', 'bu', 'şu', 'o', 'nasıl', 'neden', 'niçin', 'kim', 'hangisi', 'mısınız', 'misiniz', 'musunuz', 'müsünüz', 'daha', 'çok', 'en'];
        const cleanTitle = title.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, '');
        const words = cleanTitle.split(/\s+/).filter(w => w.length > 2);
        const filteredWords = words.filter(w => !stopWords.includes(w.toLowerCase()));
        
        // Use up to 3 keywords
        const keywords = filteredWords.slice(0, 3);
        
        if (keywords.length === 0) {
           // Fallback if all words are stop words
           return `#${title.replace(/\s+/g, '').slice(0, 15)}`;
        }
        
        return `#${keywords.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')}`;
      };

      return data.map(q => ({
        id: q.id,
        hashtag: generateHashtag(q.title),
        posts: q.question_comments ? q.question_comments.length : 0
      }));
    }
  });
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchFacts(), refetchTrends()]);
    } catch (e) {
      console.error('Explore refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  // Header Animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Story Progress Logic
  useEffect(() => {
    if (activeStoryGroup) {
      startProgress();
    } else {
      progressAnim.setValue(0);
      setCurrentSlideIndex(0);
    }
  }, [activeStoryGroup, currentSlideIndex]);

  useEffect(() => {
    if (isPaused) {
      progressAnim.stopAnimation();
    } else if (activeStoryGroup) {
      const currentVal = (progressAnim as any)._value || 0;
      const remainingTime = STORY_DURATION * (1 - currentVal);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingTime,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) nextSlide();
      });
    }
  }, [isPaused]);

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) nextSlide();
    });
  };

  const nextSlide = () => {
    if (!activeStoryGroup) return;
    if (currentSlideIndex < activeStoryGroup.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    } else {
      // Go to next story group automatically
      const currentIndex = storiesData.findIndex(g => g.id === activeStoryGroup.id);
      if (currentIndex < storiesData.length - 1) {
        setActiveStoryGroup(storiesData[currentIndex + 1]);
        setCurrentSlideIndex(0);
      } else {
        closeStory();
      }
    }
  };

  const prevSlide = () => {
    if (!activeStoryGroup) return;
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    } else {
      // Go to previous story group
      const currentIndex = storiesData.findIndex(g => g.id === activeStoryGroup.id);
      if (currentIndex > 0) {
        const prevGroup = storiesData[currentIndex - 1];
        setActiveStoryGroup(prevGroup);
        setCurrentSlideIndex(prevGroup.slides.length - 1);
      }
    }
  };

  const closeStory = () => {
    setActiveStoryGroup(null);
    setCurrentSlideIndex(0);
    progressAnim.setValue(0);
    setIsPaused(false);
  };

  const handleStoryPress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < SCREEN_WIDTH / 3) {
      prevSlide();
    } else {
      nextSlide();
    }
  };

  const renderStoryItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.storyItem} 
      onPress={() => {
        setActiveStoryGroup(item);
        setQuizAnswer(null);
        setQuizRevealed(false);
        if (item.id === 'quote') {
          AsyncStorage.setItem('@kervan_last_quote_read', Date.now().toString()).catch(() => {});
        }
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[item.color, '#fff']}
        style={styles.storyCircleGradient}
      >
        <View style={styles.storyCircleInner}>
          <Ionicons name={item.icon as any} size={28} color={item.color} />
        </View>
      </LinearGradient>
      <Text style={styles.storyText} numberOfLines={1}>{item.title}</Text>
    </TouchableOpacity>
  );

  const currentSlide = activeStoryGroup?.slides[currentSlideIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle={themeColors.background === '#0F1923' ? 'light-content' : 'dark-content'} />
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Keşfet</Text>
            <Text style={styles.headerSubtitle}>Sana özel içerikler ve gündem</Text>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.primary]} />
        }
      >
        {/* Stories Section */}
        <View style={styles.storiesContainer}>
          <FlatList
            data={storiesData}
            renderItem={renderStoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
        </View>

        {/* Gündem Section - Moved directly under Stories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gündem</Text>
          </View>
          <View style={styles.trendsContainer}>
            {isTrendsLoading ? (
               <View style={{ padding: 20, alignItems: 'center' }}>
                 <ActivityIndicator color={themeColors.primary} />
               </View>
            ) : trendQuestions && trendQuestions.length > 0 ? (
              trendQuestions.map((trend, index) => (
                <TouchableOpacity 
                  key={trend.id} 
                  style={styles.trendItem}
                  onPress={() => router.push(`/(app)/soz-sende/${trend.id}`)}
                >
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendRank}>{index + 1} · Gündem</Text>
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

        {/* Hap Bilgiler Section - Moved under Gündem */}
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
              <Text style={{ color: themeColors.textMuted, marginTop: 8, fontSize: 12 }}>
                Günün bilgileri yükleniyor...
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.factsList}>
              {dailyFacts.map((fact) => (
                <TouchableOpacity 
                  key={fact.id} 
                  style={styles.factCard} 
                  activeOpacity={0.9}
                  onPress={() => {
                    setSelectedFact(fact);
                    AsyncStorage.setItem('@kervan_last_fact_read', Date.now().toString()).catch(() => {});
                  }}
                >
                  <Image source={{ uri: fact.image }} style={styles.factImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.factOverlay}
                  >
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
      </ScrollView>

      {/* --- STORY VIEWER MODAL --- */}
      <Modal
        visible={!!activeStoryGroup}
        transparent
        animationType="fade"
        onRequestClose={closeStory}
      >
        <View style={styles.storyModalContainer}>
          <Pressable 
            style={styles.storyPressArea}
            onPress={handleStoryPress}
            onLongPress={() => setIsPaused(true)}
            onPressOut={() => setIsPaused(false)}
          >
            {/* Background Image */}
            {currentSlide?.image && (
              <Image source={{ uri: currentSlide.image }} style={styles.storyBgImage} />
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.9)']}
              style={styles.storyOverlay}
            />

            {/* Top UI */}
            <View style={[styles.storyTopUI, { paddingTop: insets.top + 12 }]}>
              <View style={styles.progressContainer}>
                {activeStoryGroup?.slides.map((_: any, i: number) => (
                  <View key={i} style={styles.progressBarBg}>
                    <Animated.View 
                      style={[
                        styles.progressBarFill, 
                        { 
                          width: i < currentSlideIndex ? '100%' : i === currentSlideIndex ? progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%']
                          }) : '0%' 
                        }
                      ]}
                    />
                  </View>
                ))}
              </View>
              <View style={styles.storyHeaderInfo}>
                <View style={styles.storyAuthor}>
                  <View style={[styles.storyAuthorIcon, { backgroundColor: activeStoryGroup?.color }]}>
                    <Ionicons name={activeStoryGroup?.icon as any} size={16} color="#fff" />
                  </View>
                  <Text style={styles.storyAuthorName}>{activeStoryGroup?.title}</Text>
                </View>
                <TouchableOpacity onPress={closeStory}>
                  <Ionicons name="close" size={28} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

                               {/* Content Body */}
            <View style={styles.storyBody}>
              {currentSlide?.type === 'calendar' ? (
                <View style={styles.calendarSlide}>
                  {/* Premium Tarih Kutusu - Glassmorphism */}
                  <View style={styles.calendarGlassCard}>
                    <Text style={styles.calDayName}>{currentSlide.dayName?.toUpperCase()}</Text>
                    <Text style={styles.calDayNumber}>
                      {currentSlide.date?.split(' ')[0]}
                    </Text>
                    <Text style={styles.calMonthYear}>
                      {currentSlide.date?.split(' ').slice(1).join(' ')}
                    </Text>
                    <View style={styles.calDivider} />
                    <Text style={styles.calDateLabel}>Tarihte Bugun</Text>
                  </View>

                  {/* Onemli Gun Bilgisi */}
                  {currentSlide.event && (
                    <View style={styles.calEventCard}>
                      <View style={styles.calEventBadge}>
                        <Text style={styles.calEventBadgeText}>★ ONEMLI GUN</Text>
                      </View>
                      <Text style={styles.calEventTitle}>{currentSlide.event}</Text>
                      <Text style={styles.calEventDetail}>{currentSlide.detail}</Text>
                    </View>
                  )}
                </View>
              ) : currentSlide?.type === 'daily_quote' ? (
                <View style={styles.quoteSlide}>
                  {/* Dekoratif tırnak işareti */}
                  <Text style={styles.quoteDecorMark}>"</Text>
                  {/* Glassmorphism kart */}
                  <View style={styles.quoteGlassCard}>
                    <Text style={styles.quoteText}>{currentSlide.quoteText}</Text>
                    <View style={styles.quoteDivider} />
                    <View style={styles.quoteAuthorRow}>
                      <View style={styles.quoteAuthorDot} />
                      <Text style={styles.quoteAuthor}>{currentSlide.quoteAuthor}</Text>
                    </View>
                  </View>
                  {/* Alt etiket */}
                  <View style={styles.quoteBadge}>
                    <Ionicons name="book-outline" size={12} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.quoteBadgeText}>GÜNÜN İLHAMI</Text>
                  </View>
                </View>
              ) : currentSlide?.type === 'hap_bilgi' ? (
                <View style={styles.hapBilgiSlide}>
                  {/* Kategori Badge */}
                  <View style={[styles.hapBilgiCategoryBadge, { backgroundColor: currentSlide.categoryColor || '#4D96FF' }]}>
                    <Ionicons name="bulb-outline" size={12} color="#fff" />
                    <Text style={styles.hapBilgiCategoryText}>{currentSlide.category?.toUpperCase()}</Text>
                  </View>
                  {/* Glassmorphism Kart */}
                  <View style={styles.hapBilgiGlassCard}>
                    <Text style={styles.hapBilgiTitle}>{currentSlide.title}</Text>
                    <View style={styles.hapBilgiDivider} />
                    <Text style={styles.hapBilgiDetail}>{currentSlide.detail}</Text>
                  </View>
                </View>
              ) : currentSlide?.type === 'quiz' ? (
                <View style={styles.quizSlide}>
                  {/* Soru */}
                  <View style={styles.quizBadge}>
                    <Ionicons name="help-circle-outline" size={14} color="#10B981" />
                    <Text style={styles.quizBadgeText}>GÜNLÜK BİLGELİK TESTİ</Text>
                  </View>
                  <View style={styles.quizQuestionCard}>
                    <Text style={styles.quizQuestionText}>{currentSlide.question}</Text>
                  </View>
                  {/* Seçenekler */}
                  <View style={styles.quizOptions}>
                    {currentSlide.options.map((opt: string, idx: number) => {
                      const isSelected = quizAnswer === idx;
                      const isCorrect = idx === currentSlide.correctIndex;
                      let bgColor = 'rgba(255,255,255,0.12)';
                      let borderColor = 'rgba(255,255,255,0.25)';
                      let textColor = '#fff';
                      if (quizRevealed) {
                        if (isCorrect) { bgColor = 'rgba(16,185,129,0.35)'; borderColor = '#10B981'; }
                        else if (isSelected) { bgColor = 'rgba(239,68,68,0.35)'; borderColor = '#EF4444'; }
                      } else if (isSelected) {
                        bgColor = 'rgba(255,255,255,0.25)'; borderColor = '#fff';
                      }
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={[styles.quizOption, { backgroundColor: bgColor, borderColor }]}
                          onPress={() => {
                            if (!quizRevealed) {
                              setQuizAnswer(idx);
                              setQuizRevealed(true);
                            }
                          }}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.quizOptionLabel, { color: textColor }]}>
                            {String.fromCharCode(65 + idx)})
                          </Text>
                          <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                          {quizRevealed && isCorrect && (
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                          )}
                          {quizRevealed && isSelected && !isCorrect && (
                            <Ionicons name="close-circle" size={18} color="#EF4444" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  {/* Açıklama */}
                  {quizRevealed && (
                    <View style={styles.quizExplanation}>
                      <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
                      <Text style={styles.quizExplanationText}>{currentSlide.explanation}</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.textSlide}>
                  <Text style={styles.slideTitle}>{currentSlide?.title || activeStoryGroup?.title}</Text>
                  <Text style={styles.slideDetail}>{currentSlide?.detail}</Text>
                </View>
              )}

            </View>


          </Pressable>
        </View>
      </Modal>

      {/* Hap Bilgi Detail Modal (Remains similar but styled) */}
      <Modal
        visible={!!selectedFact}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedFact(null)}
      >
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
                style={[styles.factModalAction, { backgroundColor: selectedFact?.color || themeColors.primary }]}
                onPress={() => setSelectedFact(null)}
              >
                <Text style={styles.factModalActionText}>Okudum</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* All Facts Modal */}
      <Modal
        visible={showAllFacts}
        animationType="slide"
        onRequestClose={() => setShowAllFacts(false)}
      >
        <SafeAreaView style={styles.allFactsContainer}>
          <View style={styles.allFactsHeader}>
            <TouchableOpacity onPress={() => setShowAllFacts(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={28} color={themeColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.allFactsTitle}>Tüm Bilgiler</Text>
          </View>
          
          <FlatList
            data={dailyFacts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.allFactsList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.allFactItem}
                onPress={() => {
                  setShowAllFacts(false);
                  setSelectedFact(item);
                }}
              >
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
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: themeColors.background,
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: themeColors.textPrimary, letterSpacing: -0.5 },
  headerSubtitle: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, marginTop: 2 },
  searchBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: themeColors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border,
  },
  storiesContainer: { paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: themeColors.border + '30' },
  storiesList: { paddingHorizontal: Spacing.lg, gap: 15 },
  storyItem: { alignItems: 'center', width: 75 },
  storyCircleGradient: { width: 68, height: 68, borderRadius: 34, padding: 3, alignItems: 'center', justifyContent: 'center' },
  storyCircleInner: {
    width: 62, height: 62, borderRadius: 31, backgroundColor: themeColors.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: themeColors.background,
  },
  storyText: { fontSize: 11, fontWeight: '700', color: themeColors.textPrimary, marginTop: 6, textAlign: 'center' },
  section: { marginTop: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: themeColors.textPrimary },
  sectionSubtitle: { fontSize: 12, color: themeColors.textSecondary, marginTop: 2 },
  seeAll: { fontSize: 14, fontWeight: '700', color: themeColors.primary, marginTop: 4 },
  factsList: { paddingHorizontal: Spacing.lg, gap: 15 },
  factCard: {
    width: 300, height: 200, borderRadius: BorderRadius.xl, overflow: 'hidden',
    backgroundColor: themeColors.surface, elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12,
  },
  factImage: { width: '100%', height: '100%', position: 'absolute' },
  factOverlay: { ...StyleSheet.absoluteFillObject, padding: Spacing.lg, justifyContent: 'flex-end' },
  factBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 10,
  },
  factBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  factTitle: {
    color: '#fff', fontSize: 20, fontWeight: '900', marginBottom: 6,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  factDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
  trendsContainer: {
    paddingHorizontal: Spacing.lg, backgroundColor: themeColors.surface, borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg, borderWidth: 1, borderColor: themeColors.border,
  },
  trendItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: themeColors.border + '50',
  },
  trendInfo: { flex: 1 },
  trendRank: { fontSize: 11, color: themeColors.textMuted, fontWeight: '600' },
  trendHashtag: { fontSize: 17, fontWeight: '900', color: themeColors.textPrimary, marginVertical: 2 },
  trendPosts: { fontSize: 12, color: themeColors.textSecondary },

  // Story Viewer Styles
  storyModalContainer: { flex: 1, backgroundColor: '#000' },
  storyPressArea: { flex: 1 },
  storyBgImage: { ...StyleSheet.absoluteFillObject, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  storyOverlay: { ...StyleSheet.absoluteFillObject },
  storyTopUI: { paddingHorizontal: 15, paddingTop: 10 },
  progressContainer: { flexDirection: 'row', gap: 5, height: 2, marginBottom: 15 },
  progressBarBg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff' },
  storyHeaderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storyAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyAuthorIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  storyAuthorName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  storyBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  calendarSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  calendarGlassCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 36,
    width: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  calDayName: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 4,
    marginBottom: 6,
  },
  calDayNumber: {
    fontSize: 88,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 90,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
    letterSpacing: -4,
  },
  calMonthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  calDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 1,
    marginVertical: 14,
  },
  calDateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  calEventCard: {
    marginTop: 24,
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  calEventBadge: {
    backgroundColor: 'rgba(255,200,50,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,50,0.5)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  calEventBadgeText: {
    color: '#FFD700',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
  },
  calEventTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    lineHeight: 24,
  },
  calEventDetail: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '400',
  },
  textSlide: { alignItems: 'center' },
  slideTitle: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  slideDetail: { color: 'rgba(255,255,255,0.95)', fontSize: 20, textAlign: 'center', lineHeight: 32 },

  // Hap Bilgi Story Slide Styles
  hapBilgiSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 8 },
  hapBilgiCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  hapBilgiCategoryText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  hapBilgiGlassCard: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 26,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 14,
  },
  hapBilgiTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 0.2,
  },
  hapBilgiDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 16,
    width: '35%',
    alignSelf: 'center',
  },
  hapBilgiDetail: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '400',
  },

  // Günün Sözü — Premium Quote Slide Styles
  quoteSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 8 },
  quoteDecorMark: {
    fontSize: 120,
    color: 'rgba(255,255,255,0.18)',
    lineHeight: 100,
    fontWeight: '900',
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginBottom: -20,
  },
  quoteGlassCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 28,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 14,
  },
  quoteText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  quoteDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginVertical: 20,
    width: '40%',
    alignSelf: 'center',
  },
  quoteAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  quoteAuthorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  quoteAuthor: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  quoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    backgroundColor: 'rgba(167,139,250,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.5)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quoteBadgeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },

  storyFooter: { 
    flexDirection: 'row', alignItems: 'center', gap: 15, paddingHorizontal: 20, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20, paddingTop: 20 
  },
  storyInputPlaceholder: { 
    flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)', 
    justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)' 
  },
  storyInputText: { color: '#fff', fontSize: 14 },
  storyActionBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  // Quiz Slide Styles
  quizSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 6 },
  quizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.5)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 18,
  },
  quizBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },
  quizQuestionCard: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 22,
    width: '100%',
    marginBottom: 18,
  },
  quizQuestionText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  quizOptions: { width: '100%', gap: 10, marginBottom: 16 },
  quizOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  quizOptionLabel: {
    fontSize: 14,
    fontWeight: '900',
    width: 22,
    opacity: 0.7,
  },
  quizOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
  },
  quizExplanation: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 14,
    padding: 14,
    width: '100%',
  },
  quizExplanationText: {
    flex: 1,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },



  // Fact Modal Styles
  factModalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  factModalContent: { height: '80%', backgroundColor: themeColors.background, borderTopLeftRadius: 40, borderTopRightRadius: 40, overflow: 'hidden' },
  factModalImage: { width: '100%', height: 350 },
  factModalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, height: 350 },
  factModalClose: { position: 'absolute', top: 20, right: 20, zIndex: 20 },
  factModalBody: { flex: 1, padding: 30, marginTop: -100 },
  factModalTitle: { fontSize: 32, fontWeight: '900', color: themeColors.textPrimary, marginBottom: 15 },
  factModalDesc: { fontSize: 18, color: themeColors.textSecondary, lineHeight: 28, marginBottom: 30 },
  factModalAction: { paddingVertical: 16, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' },
  factModalActionText: { color: '#fff', fontSize: 18, fontWeight: '900' },
  
  // All Facts Styles
  allFactsContainer: { flex: 1, backgroundColor: themeColors.background },
  allFactsHeader: { 
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, 
    paddingVertical: Spacing.md, gap: 15, borderBottomWidth: 1, borderBottomColor: themeColors.border + '50' 
  },
  backBtn: { padding: 5 },
  allFactsTitle: { fontSize: 22, fontWeight: '900', color: themeColors.textPrimary },
  allFactsList: { padding: Spacing.lg, gap: 20 },
  allFactItem: { 
    flexDirection: 'row', backgroundColor: themeColors.surface, borderRadius: BorderRadius.xl, 
    overflow: 'hidden', height: 110, borderWidth: 1, borderColor: themeColors.border 
  },
  allFactImage: { width: 100, height: '100%' },
  allFactContent: { flex: 1, padding: 12, justifyContent: 'center' },
  allFactTitleText: { fontSize: 16, fontWeight: '800', color: themeColors.textPrimary, marginBottom: 4 },
  allFactDescText: { fontSize: 12, color: themeColors.textSecondary, lineHeight: 16 },
  
  // Compass Styles
  compassSection: { marginTop: Spacing.xl },
  compassTip: { fontSize: 12, color: themeColors.primary, fontWeight: '700' },
  compassCard: { 
    marginHorizontal: Spacing.lg, backgroundColor: themeColors.surface, borderRadius: 25, 
    padding: 25, borderWidth: 1, borderColor: themeColors.border, overflow: 'hidden',
    shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5
  },
  compassLayout: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  compassWheel: { width: 100, height: 100, alignItems: 'center', justifyContent: 'center' },
  taskContent: { flex: 1 },
  spinPrompt: { gap: 8 },
  spinTitle: { fontSize: 18, fontWeight: '900', color: themeColors.textPrimary },
  spinDesc: { fontSize: 13, color: themeColors.textSecondary, lineHeight: 18 },
  spinBtn: { 
    backgroundColor: themeColors.primary, paddingVertical: 10, paddingHorizontal: 15, 
    borderRadius: 12, alignSelf: 'flex-start', marginTop: 10 
  },
  spinBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  activeTask: { alignItems: 'flex-start', gap: 8 },
  taskIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: themeColors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  taskTitle: { fontSize: 20, fontWeight: '900', color: themeColors.textPrimary },
  taskDesc: { fontSize: 14, color: themeColors.textSecondary, lineHeight: 20 },
  completedBtn: { 
    backgroundColor: themeColors.success, paddingVertical: 10, paddingHorizontal: 20, 
    borderRadius: 12, marginTop: 10 
  },
  completedBtnText: { color: '#fff', fontWeight: '800' },
});
