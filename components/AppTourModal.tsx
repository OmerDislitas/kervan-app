import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Dimensions, 
  Animated, 
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOUR_SLIDES = [
  {
    id: 'home',
    title: 'Ana Sayfa',
    subtitle: 'Kervan\'ın Kalbi',
    desc: 'Gündemi takip et, günlük pusulayla günün rotasını çiz ve en güncel gelişmeleri tek ekranda gör.',
    icon: 'home',
    route: '/(app)',
    colors: ['#0f172a', '#1e293b']
  },
  {
    id: 'explore',
    title: 'Keşfet',
    subtitle: 'Yeni Ufuklara Yelken Aç',
    desc: 'Her gün yeni bir hap bilgi, tarihten bir yaprak ve yepyeni içeriklerle kendini geliştir.',
    icon: 'compass',
    route: '/(app)/explore',
    colors: ['#00c6ff', '#0072ff']
  },
  {
    id: 'soz-sende',
    title: 'Söz Sende',
    subtitle: 'Fikirlerini Özgürce Paylaş',
    desc: 'Haftalık tartışmalara katıl, topluluğun bir parçası ol ve fikir önderi rozetlerini kazan.',
    icon: 'chatbubbles',
    route: '/(app)/soz-sende',
    colors: ['#11998e', '#38ef7d']
  },
  {
    id: 'events',
    title: 'Etkinlikler',
    subtitle: 'Gerçek Dünyada İz Bırak',
    desc: 'Doğa yürüyüşleri, kamplar ve atölyelere katıl. İstersen sen de bir etkinlik fikri öner.',
    icon: 'calendar',
    route: '/(app)/events',
    colors: ['#f12711', '#f5af19']
  },
  {
    id: 'profile',
    title: 'Hesabım & Rozetler',
    subtitle: 'Yolculuğunu Taçlandır',
    desc: 'Uygulamayı kullandıkça puan topla, sıralamada yüksel ve birbirinden şık premium rozetleri profilinde sergile.',
    icon: 'medal',
    route: '/(app)/profile',
    colors: ['#D4AF37', '#AA771C']
  }
];

type AppTourModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function AppTourModal({ visible, onClose }: AppTourModalProps) {
  const themeColors = useThemeColors();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Reset when opened
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();

      // Navigate to the first slide immediately
      router.push(TOUR_SLIDES[0].route as any);
    } else {
      scaleAnim.setValue(0.9);
      // Optional: Navigate back to home when closed, or stay on the last viewed tab.
      // Usually users prefer to stay on the tab they ended on.
    }
  }, [visible]);

  // Handle navigation when slide changes
  useEffect(() => {
    if (visible && TOUR_SLIDES[currentIndex]) {
      const currentRoute = TOUR_SLIDES[currentIndex].route;
      router.push(currentRoute as any);
    }
  }, [currentIndex, visible, router]);

  const handleNext = () => {
    if (currentIndex < TOUR_SLIDES.length - 1) {
      animateTransition(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      animateTransition(currentIndex - 1);
    }
  };

  const animateTransition = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: nextIndex > currentIndex ? -20 : 20,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setCurrentIndex(nextIndex);
      slideAnim.setValue(nextIndex > currentIndex ? 20 : -20);
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  if (!visible) return null;

  const currentSlide = TOUR_SLIDES[currentIndex];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Transparent dark overlay to keep the app visible in background */}
        <View style={styles.overlay} />

        <Animated.View 
          style={[
            styles.cardWrapper,
            { transform: [{ scale: scaleAnim }] }
          ]}
        >
          <View style={[styles.card, { backgroundColor: themeColors.surface }]}>
            {/* Header / Icon Gradient */}
            <LinearGradient
              colors={currentSlide.colors as [string, string]}
              style={styles.cardHeader}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.iconContainer}>
                <Ionicons name={currentSlide.icon as any} size={48} color="#fff" />
              </View>
            </LinearGradient>

            <Animated.View 
              style={[
                styles.content,
                { 
                  opacity: fadeAnim,
                  transform: [{ translateX: slideAnim }]
                }
              ]}
            >
              <Text style={[styles.subtitle, { color: themeColors.primary }]}>
                {currentSlide.subtitle}
              </Text>
              <Text style={[styles.title, { color: themeColors.textPrimary }]}>
                {currentSlide.title}
              </Text>
              <Text style={[styles.desc, { color: themeColors.textSecondary }]}>
                {currentSlide.desc}
              </Text>
            </Animated.View>

            {/* Progress Indicators */}
            <View style={styles.progressContainer}>
              {TOUR_SLIDES.map((_, idx) => (
                <View 
                  key={idx} 
                  style={[
                    styles.progressDot,
                    { backgroundColor: themeColors.border },
                    idx === currentIndex && [styles.progressDotActive, { backgroundColor: themeColors.primary }]
                  ]} 
                />
              ))}
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              {currentIndex > 0 ? (
                <TouchableOpacity 
                  style={[styles.btn, styles.btnGhost]} 
                  onPress={handlePrev}
                >
                  <Text style={[styles.btnTextGhost, { color: themeColors.textSecondary }]}>Geri</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.btn} /> // Spacer
              )}
              
              <TouchableOpacity 
                style={[styles.btn, styles.btnPrimary, { backgroundColor: themeColors.primary }]} 
                onPress={handleNext}
              >
                <Text style={styles.btnTextPrimary}>
                  {currentIndex === TOUR_SLIDES.length - 1 ? 'Bitir' : 'İleri'}
                </Text>
                <Ionicons 
                  name={currentIndex === TOUR_SLIDES.length - 1 ? 'checkmark' : 'arrow-forward'} 
                  size={16} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeAbsolute} onPress={onClose}>
              <Ionicons name="close-circle" size={28} color="rgba(0,0,0,0.3)" />
            </TouchableOpacity>

          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  cardWrapper: {
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  desc: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressDotActive: {
    width: 24,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnGhost: {
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  btnPrimary: {
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnTextGhost: {
    fontSize: 16,
    fontWeight: '600',
  },
  btnTextPrimary: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  closeAbsolute: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 15,
  }
});
