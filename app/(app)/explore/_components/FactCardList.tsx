import React, { useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Spacing } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Android LayoutAnimation desteği
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_WIDTH = SCREEN_WIDTH * 0.87;
const CARD_MARGIN = 10;
const SNAP_INTERVAL = CARD_WIDTH + CARD_MARGIN;
// Görsel yüksekliği — sabit (kart içinde resim her zaman görünür)
const IMAGE_HEIGHT = 220;

export interface FactItem {
  id: string;
  title: string;
  desc: string;
  category: string;
  image: string;
  color: string;
}

interface FactCardListProps {
  facts: FactItem[];
  isLoading: boolean;
  pointsEarned: Record<string, boolean>;
  onOkudum: (fact: FactItem) => void;
  animValue: Animated.Value;
}

// ─── Tek Kart ────────────────────────────────────────────────────────────────
const FactCard = React.memo(function FactCard({
  item,
  earned,
  onOkudum,
}: {
  item: FactItem;
  earned: boolean;
  onOkudum: (fact: FactItem) => void;
}) {
  const themeColors = useThemeColors();
  const [expanded, setExpanded] = React.useState(false);
  const btnScale = useRef(new Animated.Value(1)).current;

  const cardColor = item.color || themeColors.primary;

  const handleCardPress = useCallback(() => {
    // LayoutAnimation: native smooth height change
    LayoutAnimation.configureNext({
      duration: 320,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'spring', springDamping: 0.8 },
    });
    setExpanded(prev => {
      const nextVal = !prev;
      if (nextVal) {
        // Kart açıldıysa okundu olarak işaretlemek için timestamp kaydet
        AsyncStorage.setItem('@fikirforum_last_fact_read', Date.now().toString()).catch(() => {});
      }
      return nextVal;
    });
  }, []);

  const handleOkudum = useCallback(() => {
    if (!expanded) return;
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 15 }),
    ]).start();
    AsyncStorage.setItem('@fikirforum_last_fact_read', Date.now().toString()).catch(() => {});
    onOkudum(item);
  }, [expanded, item, onOkudum, btnScale]);

  const isLocked = !expanded && !earned;

  return (
    <TouchableOpacity
      style={[styles.cardOuter, { width: CARD_WIDTH }]}
      activeOpacity={0.88}
      onPress={handleCardPress}
    >
      {/* Görsel — sabit yükseklik */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Üst: kategori badge + aç/kapat ipucu */}
        <View style={styles.topRow}>
          <View style={[styles.badge, { backgroundColor: cardColor }]}>
            <Text style={styles.badgeText}>{item.category}</Text>
          </View>
          <View style={styles.tapHint}>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={13} color="rgba(255,255,255,0.85)" />
            <Text style={styles.tapHintText}>{expanded ? "Kapat" : "Aç"}</Text>
          </View>
        </View>
      </View>

      {/* İçerik alanı — arka plan: theme surface */}
      <View style={[styles.contentBox, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        {/* Başlık */}
        <Text style={[styles.title, { color: themeColors.textPrimary }]}>
          {item.title}
        </Text>

        {/* Açıklama — expanded olunca görünür */}
        {expanded && (
          <Text style={[styles.desc, { color: themeColors.textSecondary }]}>
            {item.desc}
          </Text>
        )}

        {/* Okudum butonu */}
        <Animated.View style={{ transform: [{ scale: btnScale }] }}>
          <TouchableOpacity
            style={[
              styles.okuButton,
              {
                backgroundColor: earned
                  ? 'rgba(34, 197, 94, 0.15)'
                  : isLocked
                  ? themeColors.surfaceLight ?? themeColors.surface
                  : themeColors.primary + '22',
                borderColor: earned
                  ? '#22c55e'
                  : isLocked
                  ? themeColors.border
                  : themeColors.primary,
              },
            ]}
            onPress={handleOkudum}
            activeOpacity={isLocked ? 1 : 0.75}
            disabled={isLocked}
          >
            <Text
              style={[
                styles.okuText,
                {
                  color: earned ? '#22c55e' : isLocked ? themeColors.textMuted : themeColors.primary,
                  opacity: isLocked ? 0.5 : 1,
                },
              ]}
            >
              {earned ? 'Okundu ✓' : isLocked ? 'Önce metni aç' : 'Okudum (+2 Puan)'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
});

// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonCard() {
  const themeColors = useThemeColors();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.7] });

  return (
    <View style={{ width: CARD_WIDTH, marginRight: CARD_MARGIN }}>
      <Animated.View style={[styles.skeletonCard, { backgroundColor: themeColors.surface, opacity }]}>
        <View style={[styles.skeletonImage, { backgroundColor: themeColors.border }]} />
        <View style={{ padding: 16, gap: 10 }}>
          <View style={[styles.skeletonLine, { width: '80%', backgroundColor: themeColors.border }]} />
          <View style={[styles.skeletonLine, { width: '60%', height: 12, backgroundColor: themeColors.border }]} />
          <View style={[styles.skeletonBtn, { backgroundColor: themeColors.border }]} />
        </View>
      </Animated.View>
    </View>
  );
}

// ─── Ana Liste ────────────────────────────────────────────────────────────────
export default function FactCardList({
  facts,
  isLoading,
  pointsEarned,
  onOkudum,
  animValue,
}: FactCardListProps) {
  const themeColors = useThemeColors();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [facts]);

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-18, 0],
  });

  const renderItem = useCallback(
    ({ item }: { item: FactItem }) => (
      <FactCard
        item={item}
        earned={!!pointsEarned[item.id]}
        onOkudum={onOkudum}
      />
    ),
    [pointsEarned, onOkudum]
  );

  if (isLoading) {
    return (
      <View style={styles.skeletonRow}>
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  if (!facts || facts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="book-outline" size={40} color={themeColors.textMuted} />
        <Text style={[styles.emptyText, { color: themeColors.textMuted }]}>
          Bu kategoride bilgi yok
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={{ opacity: animValue, transform: [{ translateX }] }}>
      <FlatList
        ref={flatListRef}
        data={facts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={SNAP_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={styles.listContent}
        overScrollMode="never"
        bounces
        // getItemLayout kaldırıldı — kartlar dinamik yükseklikte
      />
    </Animated.View>
  );
}

// ─── Stiller ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  cardOuter: {
    marginRight: CARD_MARGIN,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  imageContainer: {
    width: '100%',
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tapHintText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
  },
  contentBox: {
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  desc: {
    fontSize: 14,
    lineHeight: 22,
  },
  okuButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  okuText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  // Skeleton
  skeletonRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
  },
  skeletonCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  skeletonImage: {
    width: '100%',
    height: IMAGE_HEIGHT,
  },
  skeletonLine: {
    height: 18,
    borderRadius: 8,
  },
  skeletonBtn: {
    height: 42,
    borderRadius: 12,
    marginTop: 4,
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
