import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

interface SuggestModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

/**
 * Android için konu önerisi modal.
 * iOS'ta Alert.prompt kullanıldığından bu sadece Android & diğer platformlarda gösterilir.
 */
const SuggestModal = React.memo(function SuggestModal({
  visible,
  value,
  onChangeText,
  onClose,
  onSubmit,
}: SuggestModalProps) {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Konu Önerisi 💡</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={themeColors.textPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.modalSubtitle}>
            Tartışılmasını istediğin fikri veya soruyu yaz:
          </Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Önerinizi buraya yazın..."
            placeholderTextColor={themeColors.textMuted}
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={300}
            autoFocus
          />
          <Text style={styles.charCount}>{value.length}/300</Text>
          <TouchableOpacity
            style={styles.modalSubmitBtn}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            <Text style={styles.modalSubmitText}>Öneriyi Gönder</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

export default SuggestModal;

const createStyles = (themeColors: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: themeColors.background,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      padding: Spacing.lg,
      paddingBottom: 36,
      borderTopWidth: 1,
      borderColor: themeColors.border,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    modalTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: '800',
      color: themeColors.textPrimary,
    },
    modalSubtitle: {
      fontSize: Typography.fontSize.sm,
      color: themeColors.textSecondary,
      marginBottom: Spacing.md,
      lineHeight: 20,
    },
    modalInput: {
      backgroundColor: themeColors.surface,
      borderWidth: 1,
      borderColor: themeColors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      color: themeColors.textPrimary,
      fontSize: 15,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    charCount: {
      fontSize: 11,
      color: themeColors.textMuted,
      textAlign: 'right',
      marginTop: 4,
      marginBottom: Spacing.md,
    },
    modalSubmitBtn: {
      backgroundColor: themeColors.primary,
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: 'center',
    },
    modalSubmitText: {
      color: '#0F1923',
      fontWeight: '800',
      fontSize: 15,
    },
  });
