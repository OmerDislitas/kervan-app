import { Ionicons } from '@expo/vector-icons';

export type UserBadgeStats = {
  commentsCount: number;
  eventsCount: number;
  followersCount: number;
  followingCount: number;
  points: number;
};

export type Badge = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: [string, string]; // For gradient
  conditionDesc: string; // How to earn it (for display)
  isEarned: (stats: UserBadgeStats) => boolean;
};

export const BADGES: Badge[] = [
  {
    id: 'first_comment',
    title: 'Söz Sende',
    description: 'İlk kıvılcımı yaktın, fikirlerini paylaşmaya başladın.',
    icon: 'chatbubbles',
    colors: ['#00c6ff', '#0072ff'],
    conditionDesc: 'En az 1 yorum yap',
    isEarned: (stats) => stats.commentsCount >= 1,
  },
  {
    id: 'opinion_leader',
    title: 'Fikir Öncüsü',
    description: 'Söylediklerin dinleniyor, topluluğa yön veriyorsun.',
    icon: 'megaphone',
    colors: ['#f12711', '#f5af19'],
    conditionDesc: 'En az 10 yorum yap',
    isEarned: (stats) => stats.commentsCount >= 10,
  },
  {
    id: 'community_leader',
    title: 'Söz Üstadı',
    description: 'Tartışmaların vazgeçilmez ismi, tam bir fikir önderi.',
    icon: 'flame',
    colors: ['#11998e', '#38ef7d'],
    conditionDesc: 'En az 50 yorum yap',
    isEarned: (stats) => stats.commentsCount >= 50,
  },
  {
    id: 'event_starter',
    title: 'İlk Adım',
    description: 'Gerçek dünyada FikirForum ile ilk buluşman gerçekleşti.',
    icon: 'calendar',
    colors: ['#8E2DE2', '#4A00E0'],
    conditionDesc: 'En az 1 etkinliğe katıl',
    isEarned: (stats) => stats.eventsCount >= 1,
  },
  {
    id: 'event_ambassador',
    title: 'FikirForum Elçisi',
    description: 'Etkinliklerin aranan yüzü, FikirForum ruhunu yaşatıyorsun.',
    icon: 'compass',
    colors: ['#FF416C', '#FF4B2B'],
    conditionDesc: 'En az 5 etkinliğe katıl',
    isEarned: (stats) => stats.eventsCount >= 5,
  },
  {
    id: 'social_butterfly',
    title: 'Sosyal Kelebek',
    description: 'Yeni insanları keşfetmeyi ve bağ kurmayı seviyorsun.',
    icon: 'heart-half',
    colors: ['#FDC830', '#F37335'],
    conditionDesc: 'En az 20 kişiyi takip et',
    isEarned: (stats) => stats.followingCount >= 20,
  },
  {
    id: 'popular',
    title: 'Gözde Üye',
    description: 'İlgi odağısın! Herkesin takip etmek istediği bir profilsin.',
    icon: 'people',
    colors: ['#1D976C', '#93F9B9'],
    conditionDesc: 'En az 20 takipçiye ulaş',
    isEarned: (stats) => stats.followersCount >= 20,
  },
  {
    id: 'phenomenon',
    title: 'Fenomen',
    description: 'Artık FikirForum topluluğunun en çok bilinen yüzlerinden birisin.',
    icon: 'star',
    colors: ['#FF0099', '#493240'],
    conditionDesc: 'En az 100 takipçiye ulaş',
    isEarned: (stats) => stats.followersCount >= 100,
  },
  {
    id: 'veteran',
    title: 'Kıdemli Gezgin',
    description: 'FikirForum\'ı dolu dolu kullanan, tecrübeli elit bir üye.',
    icon: 'medal',
    colors: ['#D4AF37', '#FFDF00'], // Gold gradient
    conditionDesc: 'En az 500 puan topla',
    isEarned: (stats) => stats.points >= 500,
  },
  {
    id: 'fikirforum_guide',
    title: 'FikirForum Rehberi',
    description: 'Uygulamanın efsanelerinden! Senin rehberliğine ihtiyacımız var.',
    icon: 'diamond',
    colors: ['#434343', '#000000'], // Obsidian premium gradient
    conditionDesc: 'En az 1000 puan topla',
    isEarned: (stats) => stats.points >= 1000,
  },
];
