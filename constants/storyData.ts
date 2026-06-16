// Story verileri — explore/index.tsx'ten constants'a taşındı
// Tarihi olaylar, dini bayramlar, arka plan görseller, günlük söz havuzu

export interface HistoricalEvent {
  event: string;
  detail: string;
  image: string;
}

export interface DailyQuote {
  text: string;
  author: string;
}

// --- Tarihi Olaylar (ay-gün formatı, her yıl aynı) ---
export const HISTORICAL_EVENTS: Record<string, HistoricalEvent> = {
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

// --- Dini Bayramlar & Kandiller (yıl-ay-gün formatı) ---
export const RELIGIOUS_HOLIDAYS: Record<string, HistoricalEvent> = {
  // === 2026 ===
  '2026-3-20': { event: 'Ramazan Bayramı 1. Gün', detail: 'Mübarek Ramazan Bayramı\'nın ilk günü. Bir aylık oruç ibadetinin ardından kavuşulan bu bayramda sevinç ve şükür duyguları dorukta olur.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-3-21': { event: 'Ramazan Bayramı 2. Gün', detail: 'Ramazan Bayramı\'nın ikinci günü. Sevdiklerinizle vakit geçirmenin, hayırlı kapılar çalmanın ve gönülleri feth etmenin günü.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-3-22': { event: 'Ramazan Bayramı 3. Gün', detail: 'Ramazan Bayramı\'nın üçüncü ve son günü. Bayramın son gününde dualarımız ve minnettarlığımız katlanarak devam eder.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-5-27': { event: 'Kurban Bayramı 1. Gün', detail: 'Mübarek Kurban Bayramı\'nın ilk günü. Hz. İbrahim\'in teslimiyetini hatırlatan bu bayram, paylaşmanın ve fedakârlığın simgesidir.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-5-28': { event: 'Kurban Bayramı 2. Gün', detail: 'Kurban Bayramı\'nın ikinci günü. Kesilen kurbanların etleri fakir ve muhtaçlarla paylaşılır; dayanışmanın en güzel örneği yaşanır.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-5-29': { event: 'Kurban Bayramı 3. Gün', detail: 'Kurban Bayramı\'nın üçüncü günü. Bayram ziyaretleri sürer, akraba ve komşulara hediyeler götürülür.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-5-30': { event: 'Kurban Bayramı 4. Gün', detail: 'Kurban Bayramı\'nın son günü. Dört günlük bu mübarek bayramı tamamlarken yapılan dualar kabul olsun.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2026-1-22': { event: 'Regaib Kandili', detail: 'Recep ayının ilk Cuma gecesi idrak edilen Regaib Kandili; Hz. Muhammed\'in (s.a.v.) anne rahmine düşüşünü kutsar. Müminler bu geceyi ibadet ve dua ile geçirir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  '2026-2-27': { event: 'Miraç Kandili', detail: 'Hz. Muhammed\'in (s.a.v.) Mekke\'den Kudüs\'e ve oradan yedi kat göğe yükselişinin anıldığı mübarek gece. Namaz ibadetinin farz kılındığı bu gece dua ile ihya edilir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  '2026-3-14': { event: 'Berat Kandili', detail: 'Şaban ayının 15. gecesi idrak edilen Berat Kandili; gelecek yıla dair ilahi kararların belirlendiğine inanılan, af ve bağışlanmanın gecesidir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  '2026-3-17': { event: 'Kadir Gecesi', detail: 'Bin aydan hayırlı olan Kadir Gecesi, Ramazan\'ın 27. gecesinde Kur\'an-ı Kerim\'in indirilişinin başladığı mübarek gecedir. Bu gece yapılan ibadetler kat kat değerlidir.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  '2026-9-15': { event: 'Mevlid Kandili', detail: 'Hz. Muhammed Mustafa\'nın (s.a.v.) doğumunun kutlandığı mübarek Mevlid Kandili. Salat-ü selamlar ve dualarla idrak edilen bu gece İslam dünyasında coşkuyla yaşanır.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  '2026-12-31': { event: 'Aşure Günü', detail: 'Muharrem ayının 10. günü olan Aşure Günü; Müslümanlar için pek çok önemli olayın yaşandığı, oruç tutulup aşure pişirilen mübarek bir gündür.', image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=800&auto=format&fit=crop' },
  // === 2027 ===
  '2027-3-10': { event: 'Ramazan Bayramı 1. Gün', detail: 'Mübarek Ramazan Bayramı\'nın ilk günü. Bir aylık oruç ibadetinin ardından kavuşulan bu bayramda sevinç ve şükür duyguları dorukta olur.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2027-3-11': { event: 'Ramazan Bayramı 2. Gün', detail: 'Ramazan Bayramı\'nın ikinci günü. Sevdiklerinizle vakit geçirmenin ve gönülleri fethetmenin günü.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2027-3-12': { event: 'Ramazan Bayramı 3. Gün', detail: 'Ramazan Bayramı\'nın son günü. Bayramı şükranla tamamlıyoruz.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2027-5-17': { event: 'Kurban Bayramı 1. Gün', detail: 'Mübarek Kurban Bayramı\'nın ilk günü. Paylaşmanın ve fedakârlığın simgesi olan bu mübarek bayramı tebrik ederiz.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2027-5-18': { event: 'Kurban Bayramı 2. Gün', detail: 'Kurban Bayramı\'nın ikinci günü. Kurbanların etleri muhtaçlarla paylaşılır; dayanışma doruk noktasına ulaşır.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2027-5-19': { event: 'Kurban Bayramı 3. Gün', detail: 'Kurban Bayramı\'nın üçüncü günü. Bayram ziyaretleri devam eder.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
  '2027-5-20': { event: 'Kurban Bayramı 4. Gün', detail: 'Kurban Bayramı\'nın son günü. Bu mübarek bayram hayırlara vesile olsun.', image: 'https://images.unsplash.com/photo-1532339142463-fd0a8979791a?q=80&w=800&auto=format&fit=crop' },
};

// --- Doğa Arka Planları ---
export const NATURE_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472214222541-d510753a4707?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800&auto=format&fit=crop'
];

// --- Söz Arka Planları ---
export const QUOTE_BACKGROUNDS = [
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1511300636408-a63a89df3482?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1431440869543-efaf3388c585?q=80&w=800&auto=format&fit=crop',
];

// --- Günlük Söz Havuzu (Explore — Azim, Motivasyon, İnanç) ---
export const EXPLORE_QUOTE_POOL: DailyQuote[] = [
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

/** Bugünün tarihi olayı ya da dini bayramı döndürür */
export function getTodaySpecialDay(): HistoricalEvent | null {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  const ymdKey = `${year}-${month}-${day}`;
  const mdKey = `${month}-${day}`;
  return RELIGIOUS_HOLIDAYS[ymdKey] || HISTORICAL_EVENTS[mdKey] || null;
}

/** Yılın gün indeksini döndürür (1-366) */
export function getDayOfYear(): number {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/** Günün sözünü döndürür */
export function getDailyQuote(): DailyQuote {
  const dayOfYear = getDayOfYear();
  return EXPLORE_QUOTE_POOL[dayOfYear % EXPLORE_QUOTE_POOL.length];
}

/** Günün arka plan görselini döndürür */
export function getDailyNatureBg(): string {
  const dayOfYear = getDayOfYear();
  return NATURE_BACKGROUNDS[dayOfYear % NATURE_BACKGROUNDS.length];
}

/** Günün söz arka planını döndürür */
export function getDailyQuoteBg(): string {
  const dayOfYear = getDayOfYear();
  return QUOTE_BACKGROUNDS[dayOfYear % QUOTE_BACKGROUNDS.length];
}
