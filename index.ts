// expo-notifications SDK 53+ Expo Go'da Android push bildirimi desteklemez.
// DevicePushTokenAutoRegistration.fx.js modül yüklendiğinde otomatik console.error fırlatıyor.
// Sadece bu spesifik mesajı filtrele, diğer hatalar etkilenmesin.
if (__DEV__) {
  const _origError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.includes('expo-notifications') && msg.includes('Android Push notifications')) {
      return; // Expo Go push uyarısını sessizce yut
    }
    _origError(...args);
  };
}

import "expo-router/entry";
