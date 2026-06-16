// Ana sayfa verileri — (app)/index.tsx'ten constants'a taşındı
// Pusula görevleri, günlük hikmet havuzu, tarihte bugün bölümü

export interface CompassTask {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
}

export interface WisdomQuote {
  text: string;
  author: string;
}

export interface HistoryEvent {
  title: string;
  detail: string;
}

// Ana sayfa Pusula görev havuzu
export const HOME_COMPASS_TASKS: CompassTask[] = [
  { id: 'h1', title: 'Tartışmaya Katıl', desc: 'Söz Sende paneline git ve aktif bir soruya yorum yaz.', icon: 'chatbubbles', color: '#8A2BE2' },
  { id: 'h2', title: 'Bilgi Avcısı', desc: 'Keşfet\'teki günün hap bilgilerinden birine tıkla ve sonuna kadar oku.', icon: 'book', color: '#4D96FF' },
  { id: 'h3', title: 'Topluluk Desteği', desc: 'Söz Sende panelinde hoşuna giden 3 farklı yoruma beğeni bırak.', icon: 'heart', color: '#FF6B6B' },
  { id: 'h4', title: 'Profilini Güçlendir', desc: 'Profiline git, rozetlerini ve istatistiklerini kontrol et.', icon: 'person', color: '#E0144C' },
  { id: 'h5', title: 'Günün Sözünü Oku', desc: 'Keşfet ekranındaki "Günün Sözü" yuvarlağına tıkla ve günün ilhamını al.', icon: 'book-outline', color: '#A78BFA' },
  { id: 'h6', title: 'Yeni Bağlantı Kur', desc: 'Profil sekmesine git ve tanıdığın birinin profilini ziyaret edip takip et.', icon: 'people', color: '#00C9A7' },
  { id: 'h7', title: 'Gündem Yorumcusu', desc: 'Keşfet\'teki Gündem bölümünde aktif bir konuya yorum bırak.', icon: 'trending-up', color: '#1A5D1A' },
  { id: 'h8', title: 'Hap Bilgi Okuyucusu', desc: 'Bugünün iki hap bilgisini de oku ve yeni bir şeyler öğren.', icon: 'bulb', color: '#610C9F' },
];

// Ana sayfa Günlük Hikmet havuzu
export const HOME_WISDOM_POOL: WisdomQuote[] = [
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

// Ana sayfa "Tarihte Bugün" havuzu (döngüsel, günlük bazda değişir)
export const HOME_HISTORICAL_EVENTS_POOL: HistoryEvent[][] = [
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

/** Günün hikmet sözünü döndürür (epoch gün bazlı) */
export function getHomeWisdom(): WisdomQuote {
  const epochDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return HOME_WISDOM_POOL[epochDay % HOME_WISDOM_POOL.length];
}

/** Bugünün tarihte bugün olaylarını döndürür */
export function getHomeHistoricalEvents(): HistoryEvent[] {
  return HOME_HISTORICAL_EVENTS_POOL[new Date().getDate() % 3];
}
