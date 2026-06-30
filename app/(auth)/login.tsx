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
            <Text style={styles.label}>E-posta</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={themeColors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="ornek@email.com"
                placeholderTextColor={themeColors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
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

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={themeColors.background} />
            ) : (
              <Text style={styles.loginButtonText}>Giriş Yap</Text>
            )}
          </TouchableOpacity>
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.background,
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
  passwordInput: {
    paddingRight: Spacing.xl,
  },
  eyeButton: {
    padding: Spacing.xs,
  },
  loginButton: {
    backgroundColor: themeColors.primary,
    borderRadius: BorderRadius.md,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
    shadowColor: themeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
