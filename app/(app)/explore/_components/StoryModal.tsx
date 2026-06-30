import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Image,
  Pressable,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spacing, BorderRadius } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const STORY_DURATION = 15000;

interface StoryGroup {
  id: string;
  title: string;
  icon: string;
  color: string;
  slides: any[];
}

interface StoryModalProps {
  storiesData: StoryGroup[];
  activeStoryGroup: StoryGroup | null;
  currentSlideIndex: number;
  onClose: () => void;
  onSetActiveGroup: (group: StoryGroup | null) => void;
  onSetSlideIndex: (idx: number) => void;
  quizAnswer: number | null;
  quizRevealed: boolean;
  onSetQuizAnswer: (ans: number) => void;
  onSetQuizRevealed: (v: boolean) => void;
}

const StoryModal = React.memo(function StoryModal({
  storiesData,
  activeStoryGroup,
  currentSlideIndex,
  onClose,
  onSetActiveGroup,
  onSetSlideIndex,
  quizAnswer,
  quizRevealed,
  onSetQuizAnswer,
  onSetQuizRevealed,
}: StoryModalProps) {
  const insets = useSafeAreaInsets();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    if (!activeStoryGroup) return;
    if (currentSlideIndex < activeStoryGroup.slides.length - 1) {
      onSetSlideIndex(currentSlideIndex + 1);
    } else {
      const currentIndex = storiesData.findIndex((g) => g.id === activeStoryGroup.id);
      if (currentIndex < storiesData.length - 1) {
        onSetActiveGroup(storiesData[currentIndex + 1]);
        onSetSlideIndex(0);
      } else {
        onClose();
      }
    }
  };

  const prevSlide = () => {
    if (!activeStoryGroup) return;
    if (currentSlideIndex > 0) {
      onSetSlideIndex(currentSlideIndex - 1);
    } else {
      const currentIndex = storiesData.findIndex((g) => g.id === activeStoryGroup.id);
      if (currentIndex > 0) {
        const prevGroup = storiesData[currentIndex - 1];
        onSetActiveGroup(prevGroup);
        onSetSlideIndex(prevGroup.slides.length - 1);
      }
    }
  };

  const handleStoryPress = (evt: any) => {
    const x = evt.nativeEvent.locationX;
    if (x < SCREEN_WIDTH / 3) prevSlide();
    else nextSlide();
  };

  const startProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) nextSlide();
    });
  };

  useEffect(() => {
    if (activeStoryGroup) {
      startProgress();
      
      const slide = activeStoryGroup.slides[currentSlideIndex];
      if (slide) {
        if (slide.type === 'hap_bilgi') {
          AsyncStorage.setItem('@kervan_last_fact_read', Date.now().toString()).catch(() => {});
        } else if (slide.type === 'daily_quote') {
          AsyncStorage.setItem('@kervan_last_quote_read', Date.now().toString()).catch(() => {});
        }
      }
    }
    else { progressAnim.setValue(0); }
  }, [activeStoryGroup, currentSlideIndex]);

  useEffect(() => {
    if (isPaused) {
      progressAnim.stopAnimation();
    } else if (activeStoryGroup) {
      const currentVal = (progressAnim as any)._value || 0;
      const remainingTime = STORY_DURATION * (1 - currentVal);
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: remainingTime,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) nextSlide();
      });
    }
  }, [isPaused]);

  const currentSlide = activeStoryGroup?.slides[currentSlideIndex];

  const renderSlideContent = () => {
    if (!currentSlide) return null;

    if (currentSlide.type === 'calendar') {
      return (
        <View style={styles.calendarSlide}>
          <View style={styles.calendarGlassCard}>
            <Text style={styles.calDayName}>{currentSlide.dayName?.toUpperCase()}</Text>
            <Text style={styles.calDayNumber}>{currentSlide.date?.split(' ')[0]}</Text>
            <Text style={styles.calMonthYear}>{currentSlide.date?.split(' ').slice(1).join(' ')}</Text>
            <View style={styles.calDivider} />
            <Text style={styles.calDateLabel}>Tarihte Bugun</Text>
          </View>
          {currentSlide.event && (
            <View style={styles.calEventCard}>
              <View style={styles.calEventBadge}>
                <Text style={styles.calEventBadgeText}>★ ONEMLI GUN</Text>
              </View>
              <Text style={styles.calEventTitle}>{currentSlide.event}</Text>
              <Text style={styles.calEventDetail}>{currentSlide.detail}</Text>
            </View>
          )}
        </View>
      );
    }

    if (currentSlide.type === 'daily_quote') {
      return (
        <View style={styles.quoteSlide}>
          <Text style={styles.quoteDecorMark}>"</Text>
          <View style={styles.quoteGlassCard}>
            <Text style={styles.quoteText}>{currentSlide.quoteText}</Text>
            <View style={styles.quoteDivider} />
            <View style={styles.quoteAuthorRow}>
              <View style={styles.quoteAuthorDot} />
              <Text style={styles.quoteAuthor}>{currentSlide.quoteAuthor}</Text>
            </View>
          </View>
          <View style={styles.quoteBadge}>
            <Ionicons name="book-outline" size={12} color="rgba(255,255,255,0.8)" />
            <Text style={styles.quoteBadgeText}>GÜNÜN İLHAMI</Text>
          </View>
        </View>
      );
    }

    if (currentSlide.type === 'hap_bilgi') {
      return (
        <View style={styles.hapBilgiSlide}>
          <View style={[styles.hapBilgiCategoryBadge, { backgroundColor: currentSlide.categoryColor || '#4D96FF' }]}>
            <Ionicons name="bulb-outline" size={12} color="#fff" />
            <Text style={styles.hapBilgiCategoryText}>{currentSlide.category?.toUpperCase()}</Text>
          </View>
          <View style={styles.hapBilgiGlassCard}>
            <Text style={styles.hapBilgiTitle}>{currentSlide.title}</Text>
            <View style={styles.hapBilgiDivider} />
            <Text style={styles.hapBilgiDetail}>{currentSlide.detail}</Text>
          </View>
        </View>
      );
    }

    if (currentSlide.type === 'quiz') {
      return (
        <View style={styles.quizSlide}>
          <View style={styles.quizBadge}>
            <Ionicons name="help-circle-outline" size={14} color="#10B981" />
            <Text style={styles.quizBadgeText}>GÜNLÜK BİLGELİK TESTİ</Text>
          </View>
          <View style={styles.quizQuestionCard}>
            <Text style={styles.quizQuestionText}>{currentSlide.question}</Text>
          </View>
          <View style={styles.quizOptions}>
            {currentSlide.options.map((opt: string, idx: number) => {
              const isSelected = quizAnswer === idx;
              const isCorrect = idx === currentSlide.correctIndex;
              let bgColor = 'rgba(255,255,255,0.12)';
              let borderColor = 'rgba(255,255,255,0.25)';
              let textColor = '#fff';
              if (quizRevealed) {
                if (isCorrect) { bgColor = 'rgba(16,185,129,0.35)'; borderColor = '#10B981'; }
                else if (isSelected) { bgColor = 'rgba(239,68,68,0.35)'; borderColor = '#EF4444'; }
              } else if (isSelected) {
                bgColor = 'rgba(255,255,255,0.25)'; borderColor = '#fff';
              }
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.quizOption, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => {
                    if (!quizRevealed) {
                      onSetQuizAnswer(idx);
                      onSetQuizRevealed(true);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.quizOptionLabel, { color: textColor }]}>{String.fromCharCode(65 + idx)})</Text>
                  <Text style={[styles.quizOptionText, { color: textColor }]}>{opt}</Text>
                  {quizRevealed && isCorrect && <Ionicons name="checkmark-circle" size={18} color="#10B981" />}
                  {quizRevealed && isSelected && !isCorrect && <Ionicons name="close-circle" size={18} color="#EF4444" />}
                </TouchableOpacity>
              );
            })}
          </View>
          {quizRevealed && (
            <View style={styles.quizExplanation}>
              <Ionicons name="information-circle-outline" size={14} color="rgba(255,255,255,0.7)" />
              <Text style={styles.quizExplanationText}>{currentSlide.explanation}</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.textSlide}>
        <Text style={styles.slideTitle}>{currentSlide?.title || activeStoryGroup?.title}</Text>
        <Text style={styles.slideDetail}>{currentSlide?.detail}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={!!activeStoryGroup}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.storyModalContainer}>
        <Pressable
          style={styles.storyPressArea}
          onPress={handleStoryPress}
          onLongPress={() => setIsPaused(true)}
          onPressOut={() => setIsPaused(false)}
        >
          {currentSlide?.image && (
            <Image source={{ uri: currentSlide.image }} style={styles.storyBgImage} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.9)']}
            style={styles.storyOverlay}
          />

          {/* Top UI */}
          <View style={[styles.storyTopUI, { paddingTop: insets.top + 12 }]}>
            <View style={styles.progressContainer}>
              {activeStoryGroup?.slides.map((_: any, i: number) => (
                <View key={i} style={styles.progressBarBg}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: i < currentSlideIndex
                          ? '100%'
                          : i === currentSlideIndex
                            ? progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                            : '0%',
                      },
                    ]}
                  />
                </View>
              ))}
            </View>
            <View style={styles.storyHeaderInfo}>
              <View style={styles.storyAuthor}>
                <View style={[styles.storyAuthorIcon, { backgroundColor: activeStoryGroup?.color }]}>
                  <Ionicons name={activeStoryGroup?.icon as any} size={16} color="#fff" />
                </View>
                <Text style={styles.storyAuthorName}>{activeStoryGroup?.title}</Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content Body */}
          <View style={styles.storyBody}>
            {renderSlideContent()}
          </View>
        </Pressable>
      </View>
    </Modal>
  );
});

export default StoryModal;

const styles = StyleSheet.create({
  storyModalContainer: { flex: 1, backgroundColor: '#000' },
  storyPressArea: { flex: 1 },
  storyBgImage: { ...StyleSheet.absoluteFillObject, width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  storyOverlay: { ...StyleSheet.absoluteFillObject },
  storyTopUI: { paddingHorizontal: 15, paddingTop: 10 },
  progressContainer: { flexDirection: 'row', gap: 5, height: 2, marginBottom: 15 },
  progressBarBg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#fff' },
  storyHeaderInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  storyAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyAuthorIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  storyAuthorName: { color: '#fff', fontWeight: '800', fontSize: 15 },
  storyBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },

  // Calendar
  calendarSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  calendarGlassCard: {
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)', borderRadius: 28, paddingVertical: 28,
    paddingHorizontal: 36, width: '85%', shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.35, shadowRadius: 30, elevation: 12,
  },
  calDayName: { fontSize: 12, fontWeight: '800', color: 'rgba(255,255,255,0.7)', letterSpacing: 4, marginBottom: 6 },
  calDayNumber: { fontSize: 88, fontWeight: '900', color: '#fff', lineHeight: 90, textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10, letterSpacing: -4 },
  calMonthYear: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.9)', marginTop: 2, letterSpacing: 0.5 },
  calDivider: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1, marginVertical: 14 },
  calDateLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 3, textTransform: 'uppercase' },
  calEventCard: { marginTop: 24, width: '90%', backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 20, alignItems: 'center' },
  calEventBadge: { backgroundColor: 'rgba(255,200,50,0.25)', borderWidth: 1, borderColor: 'rgba(255,200,50,0.5)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  calEventBadgeText: { color: '#FFD700', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  calEventTitle: { color: '#fff', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 10, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6, lineHeight: 24 },
  calEventDetail: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center', lineHeight: 22 },

  // Hap Bilgi
  hapBilgiSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 8 },
  hapBilgiCategoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16, alignSelf: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  hapBilgiCategoryText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  hapBilgiGlassCard: { backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 28, paddingVertical: 28, paddingHorizontal: 26, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.5, shadowRadius: 30, elevation: 14 },
  hapBilgiTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 4, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8, letterSpacing: 0.2 },
  hapBilgiDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 16, width: '35%', alignSelf: 'center' },
  hapBilgiDetail: { color: 'rgba(255,255,255,0.92)', fontSize: 15, lineHeight: 24, textAlign: 'center' },

  // Quote
  quoteSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 8 },
  quoteDecorMark: { fontSize: 120, color: 'rgba(255,255,255,0.18)', lineHeight: 100, fontWeight: '900', alignSelf: 'flex-start', marginLeft: 16, marginBottom: -20 },
  quoteGlassCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 28, paddingVertical: 32, paddingHorizontal: 28, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 14 },
  quoteText: { color: '#fff', fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 34, letterSpacing: 0.2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8 },
  quoteDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginVertical: 20, width: '40%', alignSelf: 'center' },
  quoteAuthorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  quoteAuthorDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.6)' },
  quoteAuthor: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600', fontStyle: 'italic', letterSpacing: 0.5 },
  quoteBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 22, backgroundColor: 'rgba(167,139,250,0.25)', borderWidth: 1, borderColor: 'rgba(167,139,250,0.5)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6 },
  quoteBadgeText: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  // Quiz
  quizSlide: { alignItems: 'center', width: '100%', paddingHorizontal: 6 },
  quizBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 18 },
  quizBadgeText: { color: '#10B981', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  quizQuestionCard: { backgroundColor: 'rgba(0,0,0,0.45)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 22, paddingVertical: 22, paddingHorizontal: 22, width: '100%', marginBottom: 18 },
  quizQuestionText: { color: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center', lineHeight: 28, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6 },
  quizOptions: { width: '100%', gap: 10, marginBottom: 16 },
  quizOption: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16 },
  quizOptionLabel: { fontSize: 14, fontWeight: '900', width: 22, opacity: 0.7 },
  quizOptionText: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 20 },
  quizExplanation: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 14, padding: 14, width: '100%' },
  quizExplanationText: { flex: 1, color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 20, fontWeight: '500' },

  // Fallback
  textSlide: { alignItems: 'center' },
  slideTitle: { color: '#fff', fontSize: 32, fontWeight: '900', textAlign: 'center', marginBottom: 20 },
  slideDetail: { color: 'rgba(255,255,255,0.95)', fontSize: 20, textAlign: 'center', lineHeight: 32 },
});
