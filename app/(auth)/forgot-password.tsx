import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const { email: emailParam } = useLocalSearchParams<{ email: string }>();
  const email = (emailParam || '').trim().toLowerCase();

  const OTP_LENGTH = 6;
  const [step, setStep] = useState<'otp' | 'reset'>('otp');
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [resendMessage, setResendMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // OTP doğrulaması geçici bir Supabase oturumu açar. Bu ekran açıkken
  // kök layout'un otomatik yönlendirmesini durdurmazsak, kullanıcı yeni
  // şifresini belirlemeden uygulamaya atılır. Ekrandan ayrılınca (tamamlanan
  // ya da yarıda bırakılan akış fark etmeksizin) bayrak tekrar kapatılır.
  React.useEffect(() => {
    useAuthStore.getState().setPasswordRecoveryInProgress(true);
    return () => useAuthStore.getState().setPasswordRecoveryInProgress(false);
  }, []);

  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetErrors, setResetErrors] = useState<{ password?: string; passwordConfirm?: string; general?: string }>({});

  const handleCodeChange = (value: string, index: number) => {
    if (otpError) setOtpError('');
    const cleaned = value.replace(/[^0-9]/g, '');

    if (cleaned.length > 1) {
      const pastedCode = cleaned.slice(0, OTP_LENGTH);
      const newCode = Array(OTP_LENGTH).fill('');
      for (let i = 0; i < pastedCode.length; i++) {
        newCode[i] = pastedCode[i];
      }
      setCode(newCode);

      const lastIndex = Math.min(pastedCode.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastIndex]?.focus();

      if (pastedCode.length === OTP_LENGTH) {
        handleVerify(pastedCode);
      }
      return;
    }

    const newCode = [...code];
    newCode[index] = cleaned;
    setCode(newCode);

    if (cleaned && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    if (!cleaned && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (index === OTP_LENGTH - 1 && cleaned) {
      const fullCode = [...newCode].join('');
      if (fullCode.replace(/\s/g, '').length === OTP_LENGTH) {
        handleVerify(fullCode);
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (fullCode?: string) => {
    if (verifyLoading) return;

    const otp = (fullCode ?? code.join('')).trim();

    if (!email) {
      setOtpError('E-posta adresi bulunamadı. Lütfen baştan tekrar deneyin.');
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      setOtpError(`Lütfen ${OTP_LENGTH} haneli doğrulama kodunu girin.`);
      return;
    }

    setOtpError('');
    setVerifyLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });

      if (error) {
        console.error('[ForgotPassword] verifyOtp error:', error);
        setOtpError('Doğrulama kodu hatalı veya süresi dolmuş. Lütfen kodu kontrol edip tekrar deneyin.');
        return;
      }

      setStep('reset');
    } catch (err: any) {
      console.error('[ForgotPassword] Unexpected verify error:', err);
      setOtpError('Doğrulama sırasında bir hata oluştu.');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || !email) return;

    setResendMessage(null);
    setResendLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setResendLoading(false);

    if (error) {
      setResendMessage({ type: 'error', text: 'Kod gönderilemedi. Lütfen tekrar deneyin.' });
    } else {
      setResendMessage({ type: 'success', text: 'Yeni doğrulama kodu e-postanıza gönderildi.' });
    }
  };

  const handleConfirmNewPassword = async () => {
    if (resetLoading) return;

    const newErrors: typeof resetErrors = {};
    if (newPassword.length < 6) {
      newErrors.password = 'Şifreniz en az 6 karakter olmalıdır.';
    }
    if (newPassword !== newPasswordConfirm) {
      newErrors.passwordConfirm = 'Girdiğiniz şifreler eşleşmiyor.';
    }
    if (Object.keys(newErrors).length > 0) {
      setResetErrors(newErrors);
      return;
    }

    setResetErrors({});
    setResetLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      // verifyOtp(type: 'recovery') zaten bir oturum açtı; authStore'u
      // burada elle senkronize ediyoruz çünkü kök layout'taki dinleyici
      // bu olay için profili otomatik çekmiyor (yalnızca INITIAL_SESSION/
      // SIGNED_IN durumunda çekiyor).
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        useAuthStore.getState().setSession(sessionData.session);
        await useAuthStore.getState().fetchProfile(sessionData.session.user.id);
      }
      useAuthStore.getState().setLoading(false);

      router.replace('/(app)');
    } catch (err: any) {
      console.error('[ForgotPassword] updateUser error:', err);
      setResetErrors({ general: err?.message || 'Şifre güncellenemedi. Lütfen tekrar deneyin.' });
    } finally {
      setResetLoading(false);
    }
  };

  if (step === 'reset') {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View style={{ width: 36 }} />
          <Text style={styles.headerTitle}>Yeni Şifre</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-open" size={40} color={themeColors.primary} />
          </View>
        </View>

        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>Hesabınız için yeni bir şifre oluşturun.</Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, resetErrors.password && styles.labelError]}>Yeni Şifre</Text>
          <View style={[styles.inputWrapper, resetErrors.password && styles.inputWrapperError]}>
            <Ionicons name="lock-closed-outline" size={18} color={resetErrors.password ? themeColors.error : themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="En az 6 karakter"
              placeholderTextColor={themeColors.textMuted}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                if (resetErrors.password || resetErrors.general) setResetErrors((e) => ({ ...e, password: undefined, general: undefined }));
              }}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} style={styles.eyeButton}>
              <Ionicons name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          {!!resetErrors.password && <Text style={styles.errorText}>{resetErrors.password}</Text>}
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, resetErrors.passwordConfirm && styles.labelError]}>Yeni Şifre (Tekrar)</Text>
          <View style={[styles.inputWrapper, resetErrors.passwordConfirm && styles.inputWrapperError]}>
            <Ionicons name="lock-closed-outline" size={18} color={resetErrors.passwordConfirm ? themeColors.error : themeColors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Şifreyi tekrar girin"
              placeholderTextColor={themeColors.textMuted}
              value={newPasswordConfirm}
              onChangeText={(t) => {
                setNewPasswordConfirm(t);
                if (resetErrors.passwordConfirm || resetErrors.general) setResetErrors((e) => ({ ...e, passwordConfirm: undefined, general: undefined }));
              }}
              secureTextEntry={!showNewPasswordConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)} style={styles.eyeButton}>
              <Ionicons name={showNewPasswordConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          </View>
          {!!resetErrors.passwordConfirm && <Text style={styles.errorText}>{resetErrors.passwordConfirm}</Text>}
        </View>

        {!!resetErrors.general && <Text style={[styles.errorText, styles.generalErrorText]}>{resetErrors.general}</Text>}

        <TouchableOpacity
          style={[styles.verifyButton, resetLoading && styles.buttonDisabled]}
          onPress={handleConfirmNewPassword}
          disabled={resetLoading}
          activeOpacity={0.85}
        >
          {resetLoading ? (
            <ActivityIndicator color={themeColors.background} />
          ) : (
            <Text style={styles.verifyButtonText}>Tamam</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şifremi Unuttum</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* İkon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail" size={40} color={themeColors.primary} />
        </View>
      </View>

      <Text style={styles.title}>E-postanıza Kod Gönderildi</Text>
      <Text style={styles.subtitle}>
        <Text style={{ color: themeColors.primary }}>{email}</Text>
        {'\n'}adresine 6 haneli şifre yenileme kodu gönderdik.
      </Text>

      {/* OTP Kutular */}
      <View style={styles.otpContainer}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null, otpError && styles.otpInputError]}
            value={digit}
            onChangeText={(val) => handleCodeChange(val, i)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
            selectionColor={themeColors.primary}
            placeholderTextColor={themeColors.textMuted}
          />
        ))}
      </View>
      {!!otpError && <Text style={[styles.errorText, styles.otpErrorText]}>{otpError}</Text>}

      {/* Doğrula Butonu */}
      <TouchableOpacity
        style={[styles.verifyButton, verifyLoading && styles.buttonDisabled]}
        onPress={() => handleVerify()}
        disabled={verifyLoading}
        activeOpacity={0.85}
      >
        {verifyLoading ? (
          <ActivityIndicator color={themeColors.background} />
        ) : (
          <Text style={styles.verifyButtonText}>Doğrula</Text>
        )}
      </TouchableOpacity>

      {/* Tekrar Gönder */}
      <View style={styles.resendSection}>
        <Text style={styles.resendText}>Kod gelmedi mi? </Text>
        <TouchableOpacity onPress={handleResend} disabled={resendLoading}>
          {resendLoading ? (
            <ActivityIndicator size="small" color={themeColors.primary} />
          ) : (
            <Text style={styles.resendLink}>Tekrar Gönder</Text>
          )}
        </TouchableOpacity>
      </View>
      {!!resendMessage && (
        <Text
          style={[
            styles.resendMessageText,
            resendMessage.type === 'error' ? styles.errorText : styles.successText,
          ]}
        >
          {resendMessage.text}
        </Text>
      )}
    </View>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background, paddingHorizontal: Spacing.lg, paddingTop: Spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: themeColors.border },
  headerTitle: { fontSize: Typography.fontSize.lg, fontWeight: '700', color: themeColors.textPrimary },
  iconContainer: { alignItems: 'center', marginVertical: Spacing.xl },
  iconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: themeColors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: themeColors.primary + '44' },
  title: { fontSize: Typography.fontSize['2xl'], fontWeight: '800', color: themeColors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.fontSize.md, color: themeColors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
  otpContainer: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  otpInput: { width: 50, height: 60, borderRadius: BorderRadius.md, backgroundColor: themeColors.surface, borderWidth: 1.5, borderColor: themeColors.border, color: themeColors.textPrimary, fontSize: Typography.fontSize.xl, fontWeight: '700', textAlign: 'center' },
  otpInputFilled: { borderColor: themeColors.primary, backgroundColor: themeColors.surfaceLight },
  otpInputError: { borderColor: themeColors.error },
  verifyButton: { backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: themeColors.background, fontSize: Typography.fontSize.lg, fontWeight: '700' },
  resendSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
  resendText: { color: themeColors.textSecondary, fontSize: Typography.fontSize.md },
  resendLink: { color: themeColors.primary, fontSize: Typography.fontSize.md, fontWeight: '700' },
  resendMessageText: { textAlign: 'center', marginTop: Spacing.sm, fontSize: Typography.fontSize.sm },
  successText: { color: themeColors.success },
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
  otpErrorText: { textAlign: 'center', marginTop: -Spacing.lg, marginBottom: Spacing.lg, fontSize: Typography.fontSize.sm },
  generalErrorText: { textAlign: 'center', marginBottom: Spacing.md, fontSize: Typography.fontSize.sm },
});
