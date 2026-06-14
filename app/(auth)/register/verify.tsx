import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';
import { registerData } from './step1';

export default function VerifyScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const OTP_LENGTH = 6; 
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Verifikasyon sayfası açıldığında email kontrolü yapalım
  useEffect(() => {
    if (!registerData.email) {
      console.error('[VerifyScreen] registerData.email is missing!');
      // Eğer email yoksa geri gönderelim (veya store'dan çekelim)
      const pendingEmail = useAuthStore.getState().pendingProfileData?.email;
      if (pendingEmail) {
        registerData.email = pendingEmail;
      } else {
        Alert.alert('Hata', 'Kayıt verilerine ulaşılamadı. Lütfen tekrar deneyin.', [
          { text: 'Geri Dön', onPress: () => router.replace('/(auth)/register/step1') }
        ]);
      }
    }
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    
    // Eğer kopyala-yapıştır yapıldıysa (birden fazla karakter girildiyse)
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
    if (loading) return;

    const otp = (fullCode ?? code.join('')).trim();
    const email = registerData.email?.trim().toLowerCase();

    if (!email) {
      Alert.alert('Hata', 'E-posta adresi bulunamadı.');
      return;
    }

    if (otp.length !== OTP_LENGTH) {
      Alert.alert('Hata', `Lütfen ${OTP_LENGTH} haneli doğrulama kodunu girin.`);
      return;
    }

    setLoading(true);
    console.log(`[VerifyScreen] Verifying OTP: ${otp} for email: ${email}`);
    
    // AuthStore'a kayıt verilerini pasla
    useAuthStore.getState().setPendingProfileData(registerData);

    try {
      let { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      // Eğer signup tipi başarısız olursa ve hata varsa, alternatif olarak 'email' tipini deneyelim
      if (error) {
        console.log('[VerifyScreen] signup verification failed, trying fallback to email type...');
        const emailVerifyRes = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });
        
        if (!emailVerifyRes.error) {
          data = emailVerifyRes.data;
          error = null;
        }
      }

      if (error) {
        console.error('[VerifyScreen] verifyOtp error:', error);
        setLoading(false);
        Alert.alert('Geçersiz Kod', 'Doğrulama kodu hatalı veya süresi dolmuş. Lütfen kodu kontrol edip tekrar deneyin.');
        return;
      }

      if (data.user) {
        console.log('[VerifyScreen] verifyOtp successful. User ID:', data.user.id);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('[VerifyScreen] Unexpected error:', err);
      setLoading(false);
      Alert.alert('Hata', 'Doğrulama sırasında bir hata oluştu.');
    }
  };

  const handleResend = async () => {
    if (resendLoading) return;
    
    const email = registerData.email?.trim().toLowerCase();
    if (!email) return;

    setResendLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    setResendLoading(false);

    if (error) {
      Alert.alert('Hata', 'Kod gönderilemedi. Lütfen tekrar deneyin.');
    } else {
      Alert.alert('Gönderildi', 'Yeni doğrulama kodu e-postanıza gönderildi.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kayıt Ol</Text>
        <View style={{ width: 36 }} />
      </View>

      <ProgressBar step={4} total={4} />

      {/* İkon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail" size={40} color={themeColors.primary} />
        </View>
      </View>

      <Text style={styles.title}>E-posta Doğrulama</Text>
      <Text style={styles.subtitle}>
        <Text style={{ color: themeColors.primary }}>{registerData.email}</Text>
        {'\n'}adresine 6 haneli doğrulama kodu gönderdik.
      </Text>

      {/* OTP Kutular */}
      <View style={styles.otpContainer}>
        {code.map((digit, i) => (
          <TextInput
            key={i}
            ref={(ref) => { inputRefs.current[i] = ref; }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
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

      {/* Doğrula Butonu */}
      <TouchableOpacity
        style={[styles.verifyButton, loading && styles.buttonDisabled]}
        onPress={() => handleVerify()}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={themeColors.background} />
        ) : (
          <Text style={styles.verifyButtonText}>Doğrula ve Giriş Yap</Text>
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
    </View>
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
  verifyButton: { backgroundColor: themeColors.primary, borderRadius: BorderRadius.md, height: 52, alignItems: 'center', justifyContent: 'center', shadowColor: themeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  buttonDisabled: { opacity: 0.6 },
  verifyButtonText: { color: themeColors.background, fontSize: Typography.fontSize.lg, fontWeight: '700' },
  resendSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.lg },
  resendText: { color: themeColors.textSecondary, fontSize: Typography.fontSize.md },
  resendLink: { color: themeColors.primary, fontSize: Typography.fontSize.md, fontWeight: '700' },
});


