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
import NetInfo from '@react-native-community/netinfo';

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
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    passwordConfirm?: string;
    accepted?: string;
  }>({});

  const handleRegister = async () => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'E-posta adresinizi girin.';
    } else if (!/\S+@\S+\.\S+/.test(email.trim())) {
      newErrors.email = 'Geçerli bir e-posta adresi girin.';
    }
    if (password.length < 6) {
      newErrors.password = 'Şifreniz en az 6 karakter olmalıdır.';
    }
    if (!passwordConfirm) {
      newErrors.passwordConfirm = 'Şifreyi tekrar girin.';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = 'Şifreler eşleşmiyor.';
    }
    if (!accepted) {
      newErrors.accepted = 'Kullanım Şartları\'nı kabul etmeniz gerekiyor.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check internet connection before attempting sign up
    const netState = await NetInfo.fetch();
    if (!netState.isConnected) {
      setShowOfflineModal(true);
      return;
    }

    setErrors({});
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
          <Text style={[styles.label, errors.email && styles.labelError]}>E-posta *</Text>
          <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
            <Ionicons
              name="mail-outline"
              size={18}
              color={errors.email ? themeColors.error : themeColors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="ornek@email.com"
              placeholderTextColor={themeColors.textMuted}
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={50}
            />
          </View>
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {/* Şifre */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, errors.password && styles.labelError]}>Şifre *</Text>
          <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={errors.password ? themeColors.error : themeColors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="En az 6 karakter"
              placeholderTextColor={themeColors.textMuted}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {/* Şifre Tekrar */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, errors.passwordConfirm && styles.labelError]}>Şifre Tekrar *</Text>
          <View style={[
            styles.inputWrapper,
            errors.passwordConfirm
              ? styles.inputWrapperError
              : (passwordConfirm && password !== passwordConfirm ? { borderColor: themeColors.error } : null),
          ]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={errors.passwordConfirm ? themeColors.error : themeColors.textSecondary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Şifreyi tekrar girin"
              placeholderTextColor={themeColors.textMuted}
              value={passwordConfirm}
              onChangeText={(t) => {
                setPasswordConfirm(t);
                if (errors.passwordConfirm) setErrors((e) => ({ ...e, passwordConfirm: undefined }));
              }}
              secureTextEntry={!showPasswordConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPasswordConfirm(!showPasswordConfirm)} style={styles.eyeButton}>
              <Ionicons name={showPasswordConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          {errors.passwordConfirm && (
            <Text style={styles.errorText}>{errors.passwordConfirm}</Text>
          )}
          {!errors.passwordConfirm && passwordConfirm !== '' && password !== passwordConfirm && (
            <Text style={styles.errorText}>Şifreler eşleşmiyor</Text>
          )}
        </View>

        {/* Şartlar ve Koşullar */}
        <View style={[styles.termsContainer, errors.accepted && styles.termsContainerError]}>
          <TouchableOpacity 
            style={styles.checkbox} 
            onPress={() => {
              setAccepted(!accepted);
              if (errors.accepted) setErrors((e) => ({ ...e, accepted: undefined }));
            }}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={accepted ? "checkbox" : "square-outline"} 
              size={20} 
              color={errors.accepted ? themeColors.error : (accepted ? themeColors.primary : themeColors.textSecondary)} 
            />
          </TouchableOpacity>
          <Text style={[styles.termsText, errors.accepted && { color: themeColors.error }]}>
            <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>
              Kullanım Şartları
            </Text>
            'nı okudum ve kabul ediyorum.
          </Text>
        </View>
        {errors.accepted && <Text style={[styles.errorText, { marginTop: 4 }]}>{errors.accepted}</Text>}

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
                setErrors((e) => ({ ...e, accepted: undefined }));
                setShowTermsModal(false);
              }}
            >
              <Text style={styles.modalAcceptButtonText}>Okudum, Kabul Ediyorum</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Offline Warning Modal */}
      <Modal visible={showOfflineModal} animationType="fade" transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertCard}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="wifi-outline" size={48} color={themeColors.error} />
            </View>
            <Text style={styles.alertTitle}>Bağlantı Hatası</Text>
            <Text style={styles.alertMessage}>
              İnternet bağlantınız bulunmamaktadır. Lütfen internet bağlantınızı kontrol edip tekrar deneyiniz.
            </Text>
            <TouchableOpacity 
              style={styles.alertButton} 
              onPress={() => setShowOfflineModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.alertButtonText}>Tamam</Text>
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
  labelError: { color: themeColors.error },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: themeColors.surface, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: themeColors.border, paddingHorizontal: Spacing.md },
  inputWrapperError: { borderColor: themeColors.error, borderWidth: 1.5, backgroundColor: themeColors.error + '08' },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, height: 50, color: themeColors.textPrimary, fontSize: Typography.fontSize.md },
  passwordInput: { paddingRight: 4 },
  eyeButton: { padding: Spacing.xs },
  errorText: { fontSize: Typography.fontSize.xs, color: themeColors.error, marginTop: 4, marginLeft: 2 },
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
  termsContainerError: {
    backgroundColor: themeColors.error + '08',
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: themeColors.error,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
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
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  alertCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: themeColors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  alertIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: themeColors.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  alertTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
    color: themeColors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: Typography.fontSize.md,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  alertButton: {
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.md,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  alertButtonText: {
    color: themeColors.background,
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
});
