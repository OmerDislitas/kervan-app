import { useSettingsStore } from '@/stores/settingsStore';

// FikirForum Renk Paleti & Tema (Karanlık - Varsayılan)
export const Colors = {
  // Ana renkler
  primary: '#E8A838',       // Altın/amber — marka rengi
  primaryDark: '#C98A20',
  primaryLight: '#F5C96A',

  // Arka plan
  background: '#0F1923',    // Koyu lacivert/siyah
  surface: '#1A2736',       // Kart arka planı
  surfaceLight: '#243447',  // Hafif açık yüzey

  // Metin
  textPrimary: '#F0F4F8',
  textSecondary: '#8A9BB5',
  textMuted: '#4A5E73',

  // Durum
  success: '#4CAF82',
  error: '#E05C5C',
  warning: '#F39C12',
  info: '#5B9BD5',

  // Cinsiyet
  male: '#5B9BD5',
  female: '#E87CA8',

  // Sınır/ayraç
  border: '#243447',
  borderLight: '#2E4157',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Tab bar
  tabActive: '#E8A838',
  tabInactive: '#4A5E73',

  // Etkinlik Kategorileri (Vibrant)
  categories: {
    match: '#2ECC71',     // Maç - Yeşil
    trip: '#3498DB',      // Gezi - Mavi
    camp: '#E67E22',      // Kamp - Turuncu
    workshop: '#9B59B6',  // Atölye - Mor
    talk: '#1ABC9C',      // Sohbet - Turkuaz
    other: '#E8A838',     // Diğer - Marka Rengi
  }
};

// Aydınlık Tema (Premium Aesthetic)
export const LightColors = {
  // Ana renkler (Aynı)
  primary: '#E8A838',
  primaryDark: '#C98A20',
  primaryLight: '#F5C96A',

  // Arka plan (Beyaz ve çok hafif gri)
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceLight: '#F1F5F9',

  // Metin (Koyu gri ve siyah)
  textPrimary: '#0F1923',
  textSecondary: '#475569',
  textMuted: '#64748B',

  // Durum
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Cinsiyet
  male: '#3B82F6',
  female: '#EC4899',

  // Sınır/ayraç
  border: '#E2E8F0',
  borderLight: '#CBD5E1',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Tab bar
  tabActive: '#E8A838',
  tabInactive: '#64748B',

  // Etkinlik Kategorileri (Vibrant)
  categories: {
    match: '#10B981',
    trip: '#3B82F6',
    camp: '#F97316',
    workshop: '#8B5CF6',
    talk: '#14B8A6',
    other: '#E8A838',
  }
};

export const useThemeColors = () => {
  const theme = useSettingsStore((state) => state.theme);
  return theme === 'light' ? LightColors : Colors;
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
