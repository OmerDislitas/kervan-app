import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { HOME_COMPASS_TASKS } from '@/constants/homeData';
import { useRenderTracker } from '@/lib/debugPerf';

const COMPASS_POINTS = 25;

function getPeriodBounds() {
  const now = new Date();
  const periodStart = new Date(now);
  const nextPeriodStart = new Date(now);

  if (now.getHours() < 12) {
    periodStart.setHours(0, 0, 0, 0);
    nextPeriodStart.setHours(12, 0, 0, 0);
  } else {
    periodStart.setHours(12, 0, 0, 0);
    nextPeriodStart.setHours(0, 0, 0, 0);
    nextPeriodStart.setDate(nextPeriodStart.getDate() + 1);
  }
  return { periodStart, nextPeriodStart };
}

export const CompassCard = React.memo(function CompassCard() {
  useRenderTracker('CompassCard');
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();

  const compassAnim = React.useRef(new Animated.Value(0)).current;
  const [task, setTask] = React.useState<any>(null);
  const [isSpinning, setIsSpinning] = React.useState(false);
  const [taskCompleted, setTaskCompleted] = React.useState(false);
  const [cooldown, setCooldown] = React.useState<string | null>(null);
  const [earnedPoints, setEarnedPoints] = React.useState(false);

  const spinRotation = compassAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1080deg'],
  });

  const loadTask = React.useCallback(async () => {
    try {
      const savedTaskStr = await AsyncStorage.getItem('@kervan_compass_task');
      const timestampStr = await AsyncStorage.getItem('@kervan_compass_time');
      const completedStr = await AsyncStorage.getItem('@kervan_compass_completed');
      const earnedStr = await AsyncStorage.getItem('@kervan_compass_points_earned');

      if (savedTaskStr && timestampStr) {
        const timestamp = parseInt(timestampStr, 10);
        const { periodStart, nextPeriodStart } = getPeriodBounds();

        if (timestamp >= periodStart.getTime()) {
          setTask(JSON.parse(savedTaskStr));
          setTaskCompleted(completedStr === 'true');
          setEarnedPoints(earnedStr === 'true');

          const remainingMs = nextPeriodStart.getTime() - Date.now();
          const rH = Math.floor(remainingMs / (1000 * 60 * 60));
          const rM = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          setCooldown(`${rH}s ${rM}d`);
        } else {
          await AsyncStorage.multiRemove([
            '@kervan_compass_task',
            '@kervan_compass_time',
            '@kervan_compass_completed',
            '@kervan_compass_points_earned',
          ]);
          setTask(null);
          setTaskCompleted(false);
          setCooldown(null);
          setEarnedPoints(false);
        }
      } else {
        setTask(null);
        setTaskCompleted(false);
        setCooldown(null);
        setEarnedPoints(false);
      }
    } catch (e) {
      console.error('loadTask error:', e);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadTask();
      const interval = setInterval(loadTask, 60000);
      return () => clearInterval(interval);
    }, [loadTask])
  );

  const spinCompass = () => {
    if (isSpinning) return;
    if (task && !taskCompleted) {
      Alert.alert('🧭 Şu Anki Hedefin', 'Yeni bir hedef için önce mevcut hedefini tamamla!', [{ text: 'Tamam' }]);
      return;
    }
    if (task && taskCompleted) {
      Alert.alert('⏳ Dinlenme Süresi', `Yeni pusula için ${cooldown} daha beklemelisin.`, [{ text: 'Tamam' }]);
      return;
    }
    setIsSpinning(true);
    compassAnim.setValue(0);
    Animated.timing(compassAnim, { toValue: 1, duration: 2000, useNativeDriver: true }).start(async () => {
      const newTask = HOME_COMPASS_TASKS[Math.floor(Math.random() * HOME_COMPASS_TASKS.length)];
      setTask(newTask);
      setIsSpinning(false);
      setTaskCompleted(false);
      await AsyncStorage.setItem('@kervan_compass_task', JSON.stringify(newTask));
      await AsyncStorage.setItem('@kervan_compass_time', Date.now().toString());
      await AsyncStorage.setItem('@kervan_compass_completed', 'false');
      await AsyncStorage.setItem('@kervan_compass_points_earned', 'false');
      await AsyncStorage.setItem('@kervan_compass_start_points', (profile?.points || 0).toString());
      loadTask();
    });
  };

  const handleDoTask = (taskId: string) => {
    switch (taskId) {
      case 'h1':
      case 'h3':
        router.push('/(app)/soz-sende');
        break;
      case 'h2':
      case 'h5':
      case 'h7':
      case 'h8':
        router.push('/(app)/explore');
        break;
      case 'h4':
      case 'h6':
        router.push('/(app)/profile');
        break;
      default:
        router.push('/(app)');
    }
  };

  const completeTask = async () => {
    if (taskCompleted || !task) return;

    let verified = false;
    try {
      const { periodStart } = getPeriodBounds();
      const thresholdTime = periodStart.getTime() - 5 * 60 * 1000;
      const thresholdISO = new Date(thresholdTime).toISOString();

      switch (task.id) {
        case 'h1':
        case 'h7': {
          const lastCommentTimeStr = await AsyncStorage.getItem('@kervan_last_comment_time');
          verified = lastCommentTimeStr ? parseInt(lastCommentTimeStr, 10) >= thresholdTime : false;
          if (!verified && profile?.id) {
            const table = task.id === 'h7' ? 'question_comments' : 'question_comments';
            const { data } = await supabase
              .from(table)
              .select('id')
              .eq('user_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length > 0) verified = true;
          }
          if (!verified) {
            const dest = task.id === 'h7' ? '/(app)/explore' : '/(app)/soz-sende';
            Alert.alert('Görevin Tamamlanmadı 🧭', 'En az bir tartışma sorusuna yorum yazmalısın.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Görevi Yap', onPress: () => router.push(dest as any) },
            ]);
            return;
          }
          break;
        }
        case 'h2':
        case 'h8': {
          const lastFactReadStr = await AsyncStorage.getItem('@kervan_last_fact_read');
          verified = lastFactReadStr ? parseInt(lastFactReadStr, 10) >= thresholdTime : false;
          if (!verified) {
            Alert.alert('Görevin Tamamlanmadı 🧭', 'Bugünün hap bilgilerinden en az birini okumalısın.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Görevi Yap', onPress: () => router.push('/(app)/explore') },
            ]);
            return;
          }
          break;
        }
        case 'h3': {
          const lastLikeTimeStr = await AsyncStorage.getItem('@kervan_last_like_time');
          verified = lastLikeTimeStr ? parseInt(lastLikeTimeStr, 10) >= thresholdTime : false;
          if (!verified && profile?.id) {
            const { data } = await supabase
              .from('comment_likes')
              .select('id')
              .eq('user_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length >= 1) verified = true;
          }
          if (!verified) {
            Alert.alert('Görevin Tamamlanmadı 🧭', 'Söz Sende panelinde yorumları beğenerek topluluğa destek olmalısın.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Görevi Yap', onPress: () => router.push('/(app)/soz-sende') },
            ]);
            return;
          }
          break;
        }
        case 'h4': {
          const lastProfileViewStr = await AsyncStorage.getItem('@kervan_last_profile_view');
          verified = lastProfileViewStr ? parseInt(lastProfileViewStr, 10) >= thresholdTime : false;
          if (!verified) {
            Alert.alert('Görevin Tamamlanmadı 🧭', 'Profiline gidip rozetlerini ve istatistiklerini kontrol etmelisin.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Görevi Yap', onPress: () => router.push('/(app)/profile') },
            ]);
            return;
          }
          break;
        }
        case 'h5': {
          const lastQuoteReadStr = await AsyncStorage.getItem('@kervan_last_quote_read');
          verified = lastQuoteReadStr ? parseInt(lastQuoteReadStr, 10) >= thresholdTime : false;
          if (!verified) {
            Alert.alert('Görevin Tamamlanmadı 🧭', 'Keşfet ekranındaki "Günün Sözü" hikayesini açıp okumalısın.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Görevi Yap', onPress: () => router.push('/(app)/explore') },
            ]);
            return;
          }
          break;
        }
        case 'h6': {
          const lastFollowStr = await AsyncStorage.getItem('@kervan_last_follow');
          verified = lastFollowStr ? parseInt(lastFollowStr, 10) >= thresholdTime : false;
          if (!verified && profile?.id) {
            const { data } = await supabase
              .from('follows')
              .select('id')
              .eq('follower_id', profile.id)
              .gte('created_at', thresholdISO)
              .limit(1);
            if (data && data.length > 0) verified = true;
          }
          if (!verified) {
            Alert.alert('Görevin Tamamlanmadı 🧭', 'Profil sekmesine gidip bir kullanıcıyı takip etmelisin.', [
              { text: 'İptal', style: 'cancel' },
              { text: 'Görevi Yap', onPress: () => router.push('/(app)/profile') },
            ]);
            return;
          }
          break;
        }
        default:
          verified = true;
      }
    } catch {
      verified = true;
    }

    setTaskCompleted(true);
    setEarnedPoints(true);
    await AsyncStorage.setItem('@kervan_compass_completed', 'true');
    await AsyncStorage.setItem('@kervan_compass_points_earned', 'true');
    loadTask();

    if (profile?.id) {
      try {
        const { data, error: rpcError } = await supabase.rpc('claim_compass_reward');
        if (!rpcError && data) {
          const result = data as { success: boolean; already_claimed?: boolean; points: number };
          useAuthStore.setState({ profile: { ...profile, points: result.points } });
          await fetchProfile(profile.id);
          if (result.already_claimed) {
            Alert.alert('Görev Tamamlandı 🧭', 'Bugünün pusula ödülünü zaten almıştın. Yarın tekrar bekleriz!');
            return;
          }
        }
      } catch {
      }
    }
    Alert.alert('Tebrikler 🎉', `Görevini başarıyla tamamladın ve ${COMPASS_POINTS} puan kazandın!`);
  };

  return (
    <View style={[styles.card, styles.premiumShadow]}>
      <LinearGradient
        colors={[themeColors.surface, themeColors.surfaceLight]}
        style={styles.content}
      >
        <View style={styles.glow} />

        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="compass" size={14} color={themeColors.surface} />
            <Text style={styles.badgeText}>GÜNLÜK PUSULA</Text>
          </View>
          {task && cooldown && (
            <View style={styles.cooldownPill}>
              <Ionicons name="time-outline" size={12} color={themeColors.textSecondary} />
              <Text style={styles.cooldownPillText}>{cooldown}</Text>
            </View>
          )}
        </View>

        {!task ? (
          <View style={styles.spinArea}>
            <Animated.View style={[styles.compassIcon, { transform: [{ rotate: spinRotation }] }]}>
              <Ionicons name="compass-outline" size={48} color={themeColors.primary} />
            </Animated.View>
            <View style={styles.spinTextWrap}>
              <Text style={styles.mainTitle}>Bugün Nereye?</Text>
              <Text style={[styles.desc, { color: themeColors.textSecondary }]}>
                Pusulayı çevir, bugünün özel hedefini keşfet ve {COMPASS_POINTS} puan kazan!
              </Text>
            </View>
            <TouchableOpacity
              style={styles.spinBtn}
              onPress={spinCompass}
              disabled={isSpinning}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[themeColors.primary, themeColors.primary + 'E6']}
                style={styles.spinBtnInner}
              >
                <Ionicons name="navigate-circle" size={18} color="#fff" />
                <Text style={styles.spinBtnText}>{isSpinning ? 'Belirleniyor...' : 'Pusulayı Çevir'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.taskArea}>
            <View style={styles.taskHeader}>
              <View
                style={[
                  styles.taskIconBig,
                  { backgroundColor: themeColors.primary + '15', borderColor: themeColors.primary + '30' },
                ]}
              >
                <Ionicons name={task.icon as any} size={24} color={themeColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.taskCategory, { color: themeColors.primary }]}>BUGÜNKÜ HEDEFİN</Text>
                <Text style={[styles.taskTitle, { color: themeColors.textPrimary }]}>{task.title}</Text>
              </View>
            </View>

            <Text style={[styles.taskDesc, { color: themeColors.textSecondary }]}>{task.desc}</Text>

            <View style={[styles.progressBar, { backgroundColor: themeColors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: taskCompleted ? '100%' : '8%', backgroundColor: themeColors.primary },
                ]}
              />
            </View>

            {!taskCompleted ? (
              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: themeColors.primary }]}
                  onPress={() => handleDoTask(task.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="arrow-forward-circle" size={16} color="#fff" />
                  <Text style={styles.actionBtnText}>Görevi Yap</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.verifyBtn, { borderColor: themeColors.primary + '50' }]}
                  onPress={completeTask}
                  activeOpacity={0.85}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={themeColors.primary} />
                  <Text style={[styles.actionBtnText, { color: themeColors.primary }]}>Kontrol Et</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.completedState}>
                <Ionicons name="checkmark-done-circle" size={20} color={themeColors.success} />
                <Text style={[styles.completedText, { color: themeColors.textPrimary }]}>
                  Hedefini başarıyla tamamladın! (+{COMPASS_POINTS} Puan)
                </Text>
              </View>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
});

export default CompassCard;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    card: {
      borderRadius: BorderRadius.xl,
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
      position: 'relative',
      overflow: 'hidden',
    },
    premiumShadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 8,
    },
    content: {
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: themeColors.primary + '30',
      borderRadius: BorderRadius.xl,
    },
    glow: {
      position: 'absolute',
      right: -30,
      bottom: -30,
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: themeColors.primary + '15',
      zIndex: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
      position: 'relative',
      zIndex: 2,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: themeColors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: BorderRadius.full,
    },
    badgeText: {
      color: themeColors.surface,
      fontSize: Typography.fontSize.xs,
      fontWeight: '700',
    },
    cooldownPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: themeColors.surfaceLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    cooldownPillText: {
      color: themeColors.textSecondary,
      fontSize: Typography.fontSize.xs,
      fontWeight: '600',
    },
    spinArea: {
      alignItems: 'center',
      gap: 12,
      position: 'relative',
      zIndex: 2,
    },
    compassIcon: {
      marginVertical: Spacing.xs,
    },
    spinTextWrap: {
      alignItems: 'center',
      gap: 6,
    },
    mainTitle: {
      color: themeColors.textPrimary,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
    },
    desc: {
      fontSize: Typography.fontSize.sm,
      lineHeight: 20,
      textAlign: 'center',
      paddingHorizontal: Spacing.sm,
    },
    spinBtn: {
      marginTop: Spacing.xs,
      borderRadius: BorderRadius.lg,
      overflow: 'hidden',
    },
    spinBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: BorderRadius.lg,
    },
    spinBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: Typography.fontSize.md,
    },
    taskArea: {
      gap: Spacing.md,
      position: 'relative',
      zIndex: 2,
    },
    taskHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    taskIconBig: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      flexShrink: 0,
    },
    taskCategory: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1.5,
      marginBottom: 2,
    },
    taskTitle: {
      fontSize: Typography.fontSize.lg,
      fontWeight: '800',
    },
    taskDesc: {
      fontSize: Typography.fontSize.sm,
      lineHeight: 20,
    },
    progressBar: {
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    progressFill: {
      height: 4,
      borderRadius: 2,
    },
    taskActions: {
      flexDirection: 'row',
      gap: Spacing.md,
      marginTop: Spacing.xs,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 12,
    },
    actionBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: Typography.fontSize.sm,
    },
    verifyBtn: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    completedState: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
    },
    completedText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: '600',
    },
  });
