import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Colors, Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

export default function LoginScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);

    try {
      // Doğrudan giriş yapmayı dene
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setLoading(false);
        if (error.message.includes('Invalid login credentials')) {
          Alert.alert('Giriş Başarısız', 'E-posta veya şifre hatalı.');
        } else if (error.message.includes('Email not confirmed')) {
          Alert.alert('E-posta Doğrulanmadı', 'Lütfen e-postanızı doğrulayın.');
        } else {
          Alert.alert('Hata', error.message);
        }
        return;
      }

      // Giriş başarılı, profil kontrolü authStore içindeki onAuthStateChange ile yapılacak
      // Eğer profil yoksa fetchProfile otomatik olarak (fallback) oluşturacaktır.
      setLoading(false);
    } catch (err: any) {
      setLoading(false);
      console.error('[Login] signIn exception:', err);
      const message = err?.message || 'Bir sorun oluştu. Lütfen tekrar deneyin.';
      Alert.alert('Hata', message);
    }
  };

  const handleForgotPassword = async () => {
    if (forgotLoading || loading) return;

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setEmailError('Şifrenizi sıfırlamak için önce e-posta adresinizi girin.');
      return;
    }

    setEmailError('');
    setForgotLoading(true);

    try {
      const { data: exists, error: checkError } = await supabase.rpc('email_exists', {
        check_email: trimmedEmail,
      });

      if (checkError) throw checkError;

      if (!exists) {
        setEmailError('Bu e-posta ile uygulamaya kayıt yapılmamış.');
        return;
      }

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (resetError) throw resetError;

      router.push({ pathname: '/(auth)/forgot-password', params: { email: trimmedEmail } });
    } catch (err: any) {
      console.error('[Login] forgotPassword exception:', err);
      setEmailError(err?.message || 'Bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setForgotLoading(false);
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
        {/* Logo & Başlık */}
        <View style={styles.headerSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.logoImage} 
              resizeMode="cover"
            />
          </View>
          <Text style={styles.appName}>FikirForum</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Giriş Yap</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, emailError && styles.labelError]}>E-posta</Text>
            <View style={[styles.inputWrapper, emailError && styles.inputWrapperError]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailError ? themeColors.error : themeColors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor={themeColors.textMuted}
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (emailError) setEmailError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={themeColors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={themeColors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.loginButton, styles.loginButtonFlex, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading || forgotLoading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={themeColors.background} />
              ) : (
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, styles.forgotButton, styles.loginButtonFlex, forgotLoading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading || forgotLoading}
              activeOpacity={0.85}
            >
              {forgotLoading ? (
                <ActivityIndicator color={themeColors.primary} />
              ) : (
                <Text style={styles.forgotButtonText} numberOfLines={1} adjustsFontSizeToFit>
                  Şifremi Unuttum
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Kayıt Ol */}
        <View style={styles.registerSection}>
          <Text style={styles.registerText}>Hesabın yok mu? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register/step1')}>
            <Text style={styles.registerLink}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing['2xl'],
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: themeColors.textPrimary,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    marginTop: Spacing.xs,
    letterSpacing: 0.5,
  },
  formCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.border,
    marginBottom: Spacing.lg,
  },
  formTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginBottom: Spacing.lg,
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
  labelError: {
    color: themeColors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: themeColors.border,
    paddingHorizontal: Spacing.md,
  },
  inputWrapperError: {
    borderColor: themeColors.error,
    borderWidth: 1.5,
    backgroundColor: themeColors.error + '08',
  },
  errorText: {
    fontSize: Typography.fontSize.xs,
    color: themeColors.error,
    marginTop: 4,
    marginLeft: 2,
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
  passwordInput: {
    paddingRight: Spacing.xl,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  loginButton: {
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonFlex: {
    flex: 1,
    marginTop: 0,
  },
  forgotButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: themeColors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: themeColors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  forgotButtonText: {
    color: themeColors.primary,
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: themeColors.textSecondary,
    fontSize: Typography.fontSize.md,
  },
  registerLink: {
    color: themeColors.primary,
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
});
