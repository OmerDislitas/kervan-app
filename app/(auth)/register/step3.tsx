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
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { registerData } from './step1';

export default function RegisterStep3() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresinizi girin.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Zayıf Şifre', 'Şifreniz en az 6 karakter olmalıdır.');
      return;
    }
    if (password !== passwordConfirm) {
      Alert.alert('Şifre Uyuşmuyor', 'Girdiğiniz şifreler eşleşmiyor.');
      return;
    }
    if (!accepted) {
      Alert.alert('Kullanım Şartları', 'Kayıt olabilmek için Kullanım Şartları\'nı kabul etmeniz gerekmektedir.');
      return;
    }

    setLoading(true);

    try {
      // 1) Supabase Auth ile kayıt ol (OTP maili gönderilir)
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: registerData.fullName,
          },
        },
      });

      if (error) throw error;

      // 2) Supabase var olan kullanıcı için hata vermez, ama identities boş döner.
      if (data.user && (!data.user.identities || data.user.identities.length === 0)) {
        Alert.alert(
          'E-posta Kullanımda',
          'Bu e-posta adresiyle zaten bir hesap mevcut. Giriş yapmak ister misiniz?',
          [
            { text: 'Giriş Yap', onPress: () => router.replace('/(auth)/login') },
            { text: 'İptal', style: 'cancel' },
          ]
        );
        return;
      }

      if (data.user) {
        // 3) Profil bilgilerini sonraki adım için sakla
        registerData.email = email.trim().toLowerCase();
        registerData.userId = data.user.id;

        router.replace('/(auth)/register/verify');
      }
    } catch (err: any) {
      const msg: string = err.message ?? '';
      const code: string = err.code ?? '';
      if (
        msg.includes('already registered') ||
        msg.includes('User already registered') ||
        code === 'user_already_exists' ||
        code === '23505'
      ) {
        Alert.alert(
          'E-posta Kullanımda',
          'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı deneyin.',
          [
            { text: 'Giriş Yap', onPress: () => router.replace('/(auth)/login') },
            { text: 'Kapat', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Hata', msg || 'Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoading(false);
    }
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kayıt Ol</Text>
          <View style={{ width: 36 }} />
        </View>

        <ProgressBar step={3} total={4} />

        <Text style={styles.stepTitle}>Hesap Oluştur</Text>
        <Text style={styles.stepSubtitle}>
          E-posta adresin ve şifreni belirle. Doğrulama kodu gönderilecek.
        </Text>

        {/* E-posta */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-posta *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor={themeColors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={50}
            />
          </View>
        </View>

        {/* Şifre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifre *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="En az 6 karakter"
              placeholderTextColor={themeColors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Şifre Tekrar */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifre Tekrar *</Text>
          <View style={[styles.inputWrapper, passwordConfirm && password !== passwordConfirm && { borderColor: themeColors.error }]}>
            <Ionicons name="lock-closed-outline" size={18} color={themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Şifreyi tekrar girin"
              placeholderTextColor={themeColors.textMuted}
              value={passwordConfirm}
              onChangeText={setPasswordConfirm}
              secureTextEntry={!showPasswordConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)} style={styles.eyeButton}>
              <Ionicons name={showPasswordConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          {passwordConfirm !== '' && password !== passwordConfirm && (
            <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
          )}
        </View>

        {/* Şartlar ve Koşullar */}
        <View style={styles.termsContainer}>
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={() => setAccepted(!accepted)}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={accepted ? "checkbox" : "square-outline"} 
              size={20} 
              color={accepted ? themeColors.primary : themeColors.textSecondary} 
            />
          </TouchableOpacity>
          <Text style={styles.termsText}>
            <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
              Kullanım Şartları
            </Text>
            'nı okudum ve kabul ediyorum.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={themeColors.background} />
          ) : (
            <>
              <Text style={styles.nextButtonText}>Doğrulama Kodu Gönder</Text>
              <Ionicons name="arrow-forward" size={20} color={themeColors.background} />
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Şartlar Modal */}
      <Modal visible={showTermsModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Kullanım Şartları</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={themeColors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              <Text style={styles.termsBodyTitle}>1. Giriş ve Kabul</Text>
              <Text style={styles.termsBodyText}>
                Kervan uygulamasına kayıt olarak ve uygulamayı kullanarak, bu koşulların tamamını kabul etmiş sayılırsınız. Eğer koşulları kabul etmiyorsanız uygulamayı kullanmayınız.
              </Text>
              
              <Text style={styles.termsBodyTitle}>2. Hizmet Kullanımı</Text>
              <Text style={styles.termsBodyText}>
                Kullanıcılar, topluluk kurallarına, diğer üyelerin haklarına ve yasalara uygun hareket etmekle yükümlüdür. Hakaret, şiddet veya taciz içerikli paylaşımlar hesap kapatma sebebidir.
              </Text>
              
              <Text style={styles.termsBodyTitle}>3. Kişisel Veriler ve Gizlilik</Text>
              <Text style={styles.termsBodyText}>
                Kişisel verileriniz KVKK kapsamında korunmakta olup, sadece uygulamanın işlevselliği, etkinlik planlamaları ve güvenliği amacıyla kullanılır. Üçüncü şahıslarla paylaşılmaz.
              </Text>
              
              <Text style={styles.termsBodyTitle}>4. Puan ve Rozet Sistemi</Text>
              <Text style={styles.termsBodyText}>
                Uygulama içi kazanılan puanlar ve rozetler sanal olup, herhangi bir maddi değer taşımaz. Kervan ekibi puanlama sisteminde değişiklik yapma hakkını saklı tutar.
              </Text>

              <Text style={styles.termsBodyText}>
                Kervan topluluğuna katıldığınız için teşekkür eder, keyifli ve verimli etkinlikler dileriz!
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.modalAcceptButton} 
              onPress={() => {
                setAccepted(true);
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>Okudum, Kabul Ediyorum</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  const themeColors = useThemeColors();
  const progressStyles = createProgressStyles(themeColors);
  return (
    <View style={progressStyles.container}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[progressStyles.bar, i < step ? progressStyles.active : progressStyles.inactive]} />
      ))}
      <Text style={progressStyles.label}>{step}/{total}</Text>
    </View>
  );
}

const createProgressStyles = (themeColors: any) => StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.lg },
  bar: { flex: 1, height: 4, borderRadius: 2 },
  active: { backgroundColor: themeColors.primary },
  inactive: { backgroundColor: themeColors.border },
  label: { color: themeColors.textSecondary, fontSize: Typography.fontSize.xs, marginLeft: Spacing.xs, fontWeight: '600' },
});

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing['2xl'], paddingBottom: Spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  stepTitle: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', color: themeColors.textPrimary, marginBottom: Spacing.xs },
  stepSubtitle: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, marginBottom: Spacing.xl, lineHeight: 22 },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: Typography.fontSize.sm, color: themeColors.textSecondary, marginBottom: Spacing.xs, fontWeight: '500' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.border, paddingHorizontal: Spacing.md },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 50, color: themeColors.textPrimary, fontSize: Typography.fontSize.md },
  passwordInput: { paddingRight: 4 },
  eyeButton: { padding: Spacing.xs },
  errorText: { fontSize: Typography.fontSize.xs, color: themeColors.error, marginTop: 4 },
  nextButton: { flexDirection: 'row', backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, height: 52, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xl, shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  nextButtonText: { color: themeColors.background, fontSize: Typography.fontSize.lg, fontWeight: '700' },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: 2,
    gap: Spacing.sm,
  },
  checkbox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    flex: 1,
  },
  termsLink: {
    color: themeColors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: themeColors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: themeColors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    paddingVertical: Spacing.sm,
  },
  termsBodyTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: 4,
    marginTop: Spacing.sm,
  },
  termsBodyText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  modalAcceptButton: {
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalAcceptButtonText: {
    color: themeColors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
  },
});

