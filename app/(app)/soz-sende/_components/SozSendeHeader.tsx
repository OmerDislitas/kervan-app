import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

interface SozSendeHeaderProps {
  onSuggestTopic: () => void;
}

/**
 * Söz Sende ekranının statik header bileşeni.
 * Sıfır veri bağımlılığı → Tab'a tıklanır tıklanmaz anında render edilir.
 */
const SozSendeHeader = React.memo(function SozSendeHeader({ onSuggestTopic }: SozSendeHeaderProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push('/(app)')} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Söz Sende</Text>
        </View>

        <TouchableOpacity
          style={styles.suggestBtn}
          onPress={onSuggestTopic}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[themeColors.primary, themeColors.primaryLight || '#F5C96A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.suggestBtnGradient}
          >
            <Ionicons name="bulb" size={13} color="#0F1923" />
            <Text style={styles.suggestBtnText}>Konu Öner</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
      <Text style={styles.headerSubtitle}>
        Fikirlerini özgürce paylaş, toplulukla tartışmaya katıl.
      </Text>
    </View>
  );
});

export default SozSendeHeader;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    header: { padding: Spacing.lg, paddingBottom: Spacing.md },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: themeColors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: themeColors.border,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: '900',
      color: themeColors.textPrimary,
      letterSpacing: -0.5,
    },
    headerSubtitle: {
      fontSize: Typography.fontSize.md,
      color: themeColors.textSecondary,
      marginTop: 4,
      lineHeight: 22,
    },
    suggestBtn: {
      borderRadius: BorderRadius.full,
      overflow: 'hidden',
      shadowColor: themeColors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 3,
    },
    suggestBtnGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
    },
    suggestBtnText: {
      color: '#0F1923',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
  });
