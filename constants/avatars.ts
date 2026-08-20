// Uygulama içinde kayıtlı, seçilebilir profil avatarları.
// Görseller assets/images/avatars/avatar-1.png ... avatar-15.png olarak
// eklenmelidir (640x640 px, PNG). profiles.avatar_id (1-15) bu haritayla
// eşleşir; null/eksikse harf avatarına (initials) düşülür.
export const AVATAR_COUNT = 15;

export const AVATARS: Record<number, any> = {
  1: require('../assets/images/avatars/avatar-1.png'),
  2: require('../assets/images/avatars/avatar-2.png'),
  3: require('../assets/images/avatars/avatar-3.png'),
  4: require('../assets/images/avatars/avatar-4.png'),
  5: require('../assets/images/avatars/avatar-5.png'),
  6: require('../assets/images/avatars/avatar-6.png'),
  7: require('../assets/images/avatars/avatar-7.png'),
  8: require('../assets/images/avatars/avatar-8.png'),
  9: require('../assets/images/avatars/avatar-9.png'),
  10: require('../assets/images/avatars/avatar-10.png'),
  11: require('../assets/images/avatars/avatar-11.png'),
  12: require('../assets/images/avatars/avatar-12.png'),
  13: require('../assets/images/avatars/avatar-13.png'),
  14: require('../assets/images/avatars/avatar-14.png'),
  15: require('../assets/images/avatars/avatar-15.png'),
};

export function getAvatarSource(avatarId?: number | null) {
  if (!avatarId) return null;
  return AVATARS[avatarId] ?? null;
}
