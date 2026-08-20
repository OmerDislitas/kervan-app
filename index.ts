// expo-notifications SDK 53+ Expo Go'da Android push bildirimi desteklemez.
// DevicePushTokenAutoRegistration.fx.js modül yüklendiğinde otomatik console.error fırlatıyor.
// Sadece bu spesifik mesajı filtrele, diğer hatalar etkilenmesin.
if (__DEV__) {
  const _origError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
    // Expo Go'nun dahili keep-awake hatasını yut (kod hatası değil, cihaz kısıtlaması)
    if (msg.includes('keep awake') || msg.includes('keepAwake')) return;
    // Expo Go'da Android push bildirimi desteklenmiyor uyarısını yut
    if (msg.includes('expo-notifications') && msg.includes('Android Push notifications')) return;
    // Supabase'in geçersiz refresh token hatası — kod hatası değil, oturum süresi dolmuş
    if (msg.includes('Invalid Refresh Token') || msg.includes('Refresh Token Not Found')) return;
    _origError(...args);
  };

  // Promise rejection'lardan da filtrele
  const _origWarn = console.warn.bind(console);
  console.warn = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : String(args[0] ?? '');
    if (msg.includes('keep awake') || msg.includes('keepAwake')) return;
    _origWarn(...args);
  };
}

import "expo-router/entry";
