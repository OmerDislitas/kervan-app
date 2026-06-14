import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

// Register verilerini geçici olarak global tutuyoruz (navigasyon arasında)
export const registerData: Record<string, any> = {};

export default function RegisterStep1() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);

  const handleNext = () => {
    if (!fullName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen adınızı ve soyadınızı girin.');
      return;
    }
    if (!gender) {
      Alert.alert('Eksik Bilgi', 'Lütfen cinsiyetinizi seçin.');
      return;
    }

    registerData.fullName = fullName.trim();
    registerData.phone = phone.trim();
    registerData.gender = gender;

    router.push('/(auth)/register/step2');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kayıt Ol</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Progress */}
        <ProgressBar step={1} total={4} />

        <Text style={styles.stepTitle}>Kişisel Bilgiler</Text>
        <Text style={styles.stepSubtitle}>
          Seni tanımak için birkaç bilgiye ihtiyacımız var.
        </Text>

        {/* Ad Soyad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ad Soyad *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ad Soyad"
              placeholderTextColor={themeColors.textMuted}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Telefon */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefon Numarası</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="05XX XXX XX XX"
              placeholderTextColor={themeColors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Cinsiyet */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cinsiyet *</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                gender === 'male' && styles.genderSelected,
                gender === 'male' && { borderColor: themeColors.male },
              ]}
              onPress={() => setGender('male')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === 'male' && { color: themeColors.male },
                ]}
              >
                Erkek
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.genderOption,
                gender === 'female' && styles.genderSelected,
                gender === 'female' && { borderColor: themeColors.female },
              ]}
              onPress={() => setGender('female')}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.genderText,
                  gender === 'female' && { color: themeColors.female },
                ]}
              >
                Kadın
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextButtonText}>Devam Et</Text>
          <Ionicons name="arrow-forward" size={20} color={themeColors.background} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const themeColors = useThemeColors();
  const progressStyles = createProgressStyles(themeColors);
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            progressStyles.bar,
            i < step ? progressStyles.active : progressStyles.inactive,
          ]}
        />
      ))}
      <Text style={progressStyles.label}>{step}/{total}</Text>
    </View>
  );
}

const createProgressStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  active: {
    backgroundColor: themeColors.primary,
  },
  inactive: {
    backgroundColor: themeColors.border,
  },
  label: {
    color: themeColors.textSecondary,
    fontSize: Typography.fontSize.xs,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
});

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: themeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  stepTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textSecondary,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    marginBottom: Spacing.xs,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    color: themeColors.textPrimary,
    fontSize: Typography.fontSize.md,
  },
  genderRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  genderOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: themeColors.border,
    paddingVertical: Spacing.md,
  },
  genderSelected: {
    backgroundColor: themeColors.surfaceLight,
  },
  genderText: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: themeColors.textSecondary,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xl,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: themeColors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
});

