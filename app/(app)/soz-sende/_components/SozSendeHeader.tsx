import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Spacing, useThemeColors } from '@/constants/theme';
import AppScreenHeader from '@/components/AppScreenHeader';

interface SozSendeHeaderProps {
  onSuggestTopic: () => void;
}

const SozSendeHeader = React.memo(function SozSendeHeader({ onSuggestTopic }: SozSendeHeaderProps) {
  const themeColors = useThemeColors();

  return (
    <AppScreenHeader
      title="Söz Sende"
      rightActions={
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
          </LinearGradient>
        </TouchableOpacity>
      }
    />
  );
});

export default SozSendeHeader;

const styles = StyleSheet.create({
  suggestBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  suggestBtnGradient: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
