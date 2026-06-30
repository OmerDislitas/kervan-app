import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '@/stores/settingsStore';

/** Expo Go'da mı çalışıyor? (SDK 53+ Android push desteği kaldırıldı) */
const IS_EXPO_GO = Constants.appOwnership === 'expo';

const NOTIF_STORAGE_KEY = '@fikirforum_notifications';
const NOTIF_SCHEDULED_TODAY_KEY = '@fikirforum_notif_scheduled_date';

/** Bildirimi doğrudan panel geçmişine kaydet */
async function saveToPanelHistory(id: string, title: string, body: string, type: string, eventId?: string) {
  try {
    const json = await AsyncStorage.getItem(NOTIF_STORAGE_KEY);
    const existing = json ? JSON.parse(json) : [];
    if (existing.some((n: any) => n.id === id)) return; // duplicate yok
    const updated = [
      { id, title, body, date: new Date().toISOString(), read: false, type, eventId },
      ...existing,
    ].slice(0, 30);
    await AsyncStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

// Bildirim gösterim davranışı
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Bildirim iznini iste. Fiziksel cihaz gerektirir.
 */
export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'FikirForum Bildirimleri',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#E8A838',
    });
  }

  return true;
}

/**
 * Push token alıp Supabase profiles tablosuna kaydet.
 * Expo Go / development build'de projectId olmadığında sessizce atlanır.
 */
export async function registerPushToken(userId: string): Promise<void> {
  // Expo Go'da SDK 53+ Android push notification desteği kaldırıldı — sessizce atla
  if (IS_EXPO_GO) {
    return;
  }

  try {
    if (!Device.isDevice) return;

    let token: string | null = null;

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      token = tokenData.data;
    } catch {
      return;
    }

    if (!token) return;

    const { error } = await supabase
      .from('profiles')
      .update({ push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('[Notifications] Push token kaydedilemedi:', error.message);
    }
  } catch (err) {
    console.error('[Notifications] registerPushToken hatası:', err);
  }
}

/** Tüm zamanlanmış bildirimleri iptal et */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    // Bugünün zamanlama kaydını da sil ki bir sonraki açılışta yeniden kurulsun
    await AsyncStorage.removeItem(NOTIF_SCHEDULED_TODAY_KEY);
  } catch (err) {
    console.error('[Notifications] cancelAllNotifications hatası:', err);
  }
}

/**
 * Etkinlik için bildirimler oluştur:
 * 1) Kayıt başarılı bildirimi (hemen gösterilir)
 * 2) 24 saat öncesi hatırlatıcı (yalnızca etkinlik 24+ saat sonra ise)
 *
 * Identifier: "event-reminder-{eventId}"
 */
export async function scheduleEventReminder(event: {
  id: string;
  title: string;
  event_date?: string | null;
  location?: string | null;
}): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  if (!event.event_date) return;

  try {
    const eventDate = new Date(event.event_date);
    const now = new Date();

    // Geçmiş etkinlik kontrolü — geçmişteyse sadece kayıt bildirimi göster
    const eventInFuture = eventDate.getTime() > now.getTime();

    // 1) Başarılı Kayıt Bildirimi (Hemen Göster)
    const successNotifId = `event-registered-${event.id}`;
    const successTitle = '🎉 Kayıt Başarılı!';
    const successBody = `"${event.title}" etkinliğine başarıyla kayıt olundu.`;
    
    await Notifications.scheduleNotificationAsync({
      identifier: successNotifId,
      content: { 
        title: successTitle, 
        body: successBody, 
        data: { eventId: event.id, type: 'event-registered' }, 
        sound: true 
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });
    await saveToPanelHistory(successNotifId, successTitle, successBody, 'event-registered', event.id);

    // 2) 24 Saat Öncesi Hatırlatıcı
    // Önce varsa eski hatırlatıcıyı iptal et (tekrar kayıt durumunda çift bildirim önlenir)
    const reminderNotifId = `event-reminder-${event.id}`;
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderNotifId);
    } catch {
      // Yoksa hata yok
    }

    // Yalnızca etkinlik gelecekte VE 24+ saat sonra ise hatırlatıcı kur
    if (eventInFuture) {
      const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
      
      // reminderDate gelecekte mi? (etkinlik en az 24 saat sonra mı?)
      if (reminderDate.getTime() > now.getTime() + 60 * 1000) {
        // +60s güvenlik marjı — çok yakın zamanlı trigger'lar bazı cihazlarda anında tetiklenir
        const title = '🔔 Etkinlik Hatırlatıcı';
        const body = `"${event.title}" etkinliği 24 saat içinde başlıyor!${event.location ? `\n📍 ${event.location}` : ''}`;

        await Notifications.scheduleNotificationAsync({
          identifier: reminderNotifId,
          content: { title, body, data: { eventId: event.id, type: 'event-reminder' }, sound: true },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: reminderDate },
        });
        // NOT: Panel geçmişine kaydetmiyoruz — bildirim tetiklendiğinde
        // notification listener tarafından kaydedilmeli
      }
    }
  } catch (err) {
    console.error('[Notifications] scheduleEventReminder hatası:', err);
  }
}

/**
 * Etkinlik kaydı iptal edildiğinde zamanlanmış bildirimi sil.
 */
export async function cancelEventReminder(eventId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(`event-reminder-${eventId}`);
  } catch (err) {
    console.error('[Notifications] cancelEventReminder hatası:', err);
  }
}

/**
 * Yeni etkinlik oluşturulduğunda tüm kullanıcılara anlık yerel bildirim gönder.
 * (Uygulama açıkken çalışır)
 */
export async function notifyNewEvent(event: {
  id: string;
  title: string;
  location?: string | null;
}): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  try {
    const notifId = `new-event-${Date.now()}`;
    const title = '🎉 Yeni Etkinlik!';
    const body = `"${event.title}" etkinliği yayınlandı!${event.location ? `\n📍 ${event.location}` : ''}`;

    await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: { title, body, data: { type: 'new-event', eventId: event.id }, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
    });

    // Panele hemen kaydet
    await saveToPanelHistory(notifId, title, body, 'new-event', event.id);
  } catch (err) {
    console.error('[Notifications] notifyNewEvent hatası:', err);
  }
}

/**
 * Her Cuma sabahı saat 09:00'da tetiklenecek haftalık bildirim.
 * Identifier: "weekly-friday-message"
 */
export async function scheduleWeeklyFridayMessage(): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  try {
    const notifId = 'weekly-friday-message';
    
    await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: '🌹 Hayırlı Cumalar',
        body: 'FikirForum ailesi olarak mübarek cumanızı tebrik ederiz. Dualarda buluşmak dileğiyle.',
        sound: true,
        data: { type: 'friday-message' }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 6, // 1=Pazar, 6=Cuma (Expo index)
        hour: 9,
        minute: 0,
      },
    });
    
  } catch (err) {
    console.error('[Notifications] scheduleWeeklyFridayMessage hatası:', err);
  }
}

const DAILY_WISDOM = [
  { text: "Birlikte yola çıkmak bir başlangıçtır, bir arada kalmak ilerlemedir, birlikte çalışmak ise başarıdır.", author: "Henry Ford" },
  { text: "İyilik yap, denize at; balık bilmezse Halik bilir.", author: "Anonim" },
  { text: "Gençlik, geleceğin tohumudur; onu sevgi ve bilgiyle sula.", author: "FikirForum" },
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

/**
 * Önümüzdeki 30 gün için her sabah 10:00'da farklı bir günün sözü bildirimi planlar.
 * Her bildirim epoch-gün indeksine göre benzersiz bir söz seçer; böylece
 * aynı söz her ay tekrarlanmaz.
 */
export async function scheduleDailyWisdom(): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  try {
    const now = new Date();
    const MS_PER_DAY = 24 * 60 * 60 * 1000;
    const todayEpochDay = Math.floor(now.getTime() / MS_PER_DAY);

    const DAYS_AHEAD = 30;

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const targetEpochDay = todayEpochDay + i;
      const wisdom = DAILY_WISDOM[targetEpochDay % DAILY_WISDOM.length];

      const triggerDate = new Date(now);
      triggerDate.setDate(now.getDate() + i);
      triggerDate.setHours(10, 0, 0, 0);

      if (triggerDate <= now) continue;

      const notifId = `daily-wisdom-${targetEpochDay}`;

      await Notifications.scheduleNotificationAsync({
        identifier: notifId,
        content: {
          title: '📖 Günün Sözü',
          body: `"${wisdom.text}" — ${wisdom.author}`,
          sound: true,
          data: { type: 'daily-wisdom' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: triggerDate,
        } as any,
      });
    }

  } catch (err) {
    console.error('[Notifications] scheduleDailyWisdom hatası:', err);
  }
}

/**
 * Her gün saat 12:00'de tetiklenecek pusula bildirimi.
 * Identifier: "daily-compass"
 */
export async function scheduleDailyCompass(): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  try {
    const notifId = 'daily-compass';
    
    await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: '🧭 Pusulanı Çevirme Vakti!',
        body: 'Bugünkü pusulanı çevir.',
        sound: true,
        data: { type: 'daily-compass' }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 12,
        minute: 0,
      },
    });
    
  } catch (err) {
    console.error('[Notifications] scheduleDailyCompass hatası:', err);
  }
}

/**
 * Her gün saat 17:00'da tetiklenecek "Günün Hap Bilgileri" bildirimi.
 * Identifier: "daily-facts"
 */
export async function scheduleDailyFactsNotification(): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;
  try {
    const notifId = 'daily-facts';

    await Notifications.scheduleNotificationAsync({
      identifier: notifId,
      content: {
        title: '📚 Bugünün Hap Bilgileri Hazır!',
        body: 'Yeni bilgilerini keşfetmeye hazır mısın? FikirForum\'da bugüne özel içerikler seni bekliyor.',
        sound: true,
        data: { type: 'daily-facts', screen: 'explore' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 17,
        minute: 0,
      },
    });

  } catch (err) {
    console.error('[Notifications] scheduleDailyFactsNotification hatası:', err);
  }
}

/**
 * Tüm yinelenen (recurring) bildirimleri TEK BİR NOKTADAN zamanlar.
 *
 * Çift bildirim sorununu önlemek için:
 * 1. Önce mevcut TÜM zamanlanmış bildirimleri iptal eder (etkinlik hatırlatıcıları hariç)
 * 2. Sonra her bildirimi tek seferde yeniden kurar
 * 3. Günde yalnızca bir kez çalışır (AsyncStorage ile kontrol)
 *
 * @param force - true ise günlük kontrolü atlar (ayarlardan açma/kapama durumu)
 */
export async function scheduleAllRecurringNotifications(force = false): Promise<void> {
  if (!useSettingsStore.getState().notificationsEnabled) return;

  try {
    // Günde bir kez çalışması için kontrol (force=true ise atla)
    if (!force) {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
      const lastScheduled = await AsyncStorage.getItem(NOTIF_SCHEDULED_TODAY_KEY);
      if (lastScheduled === today) {
        return; // Bugün zaten zamanlandı
      }
    }

    // 1) Mevcut yinelenen bildirimleri iptal et (etkinlik hatırlatıcıları hariç)
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notif of scheduled) {
      const id = notif.identifier;
      if (id.startsWith('event-reminder-') || id.startsWith('event-registered-') || id.startsWith('new-event-')) {
        continue;
      }
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    // 2) Tüm yinelenen bildirimleri tek seferde kur
    await scheduleWeeklyFridayMessage();
    await scheduleDailyWisdom();
    await scheduleDailyCompass();
    await scheduleDailyFactsNotification();

    // 3) Bugünün tarihini kaydet
    const today = new Date().toISOString().slice(0, 10);
    await AsyncStorage.setItem(NOTIF_SCHEDULED_TODAY_KEY, today);

  } catch (err) {
    console.error('[Notifications] scheduleAllRecurringNotifications hatası:', err);
  }
}

/**
 * Bir kullanıcıya anlık bildirim (push notification) gönderir.
 *
 * Sunucu tarafında 'send-notification' Edge Function'ı çağrılır.
 * Edge Function hedef kullanıcının push token'ını okuyup bildirimi gönderir.
 *
 * title ve body parametreleri Edge Function'a iletilir.
 */
export async function sendPushNotification(
  targetUserId: string,
  title: string,
  body: string,
  data: { type?: string; [key: string]: any } = {}
): Promise<void> {
  try {
    const type = data?.type;
    if (!type) {
      console.warn('[Notifications] sendPushNotification: data.type eksik, gönderim atlandı.');
      return;
    }

    const { type: _t, ...extra } = data;
    await supabase.functions.invoke('send-notification', {
      body: { targetUserId, type, title, body, data: extra },
    });
  } catch {
    // Edge Function çağrısı başarısız olsa da sessizce geç
  }
}

