import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı adı belirleyin.');
      return;
    }

    if (username.length < 3) {
      Alert.alert('Hata', 'Kullanıcı adı en az 3 karakter olmalıdır.');
      return;
    }

    // Karakter kontrolü (sadece harf, rakam ve alt çizgi)
    const usernameRegex = /^[a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]+$/;
    const cleanUsername = username.trim().toLowerCase();
    if (!usernameRegex.test(cleanUsername)) {
      Alert.alert('Hata', 'Kullanıcı adı sadece harf, rakam ve alt çizgi (_) içerebilir.');
      return;
    }

    setIsLoading(true);
    try {
      // Önce bu kullanıcı adının alınıp alınmadığını kontrol et
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existingUser) {
        Alert.alert('Hata', 'Bu kullanıcı adı zaten alınmış. Lütfen başka bir tane deneyin.');
        setIsLoading(false);
        return;
      }

      // Kullanıcı adını güncelle
      const { error } = await supabase
        .from('profiles')
        .update({ username: cleanUsername })
        .eq('id', profile!.id);

      if (error) throw error;

      // Profili yeniden çek ve ana sayfaya yönlendir
      await fetchProfile(profile!.id);
      router.replace('/(app)');
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Kullanıcı adı kaydedilirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="at-circle" size={60} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Kullanıcı Adı Belirle</Text>
            <Text style={styles.subtitle}>
              Kervan topluluğunda sizi tanımlayacak benzersiz bir kullanıcı adı seçin. Yorumlarda bu isimle görüneceksiniz.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Kullanıcı Adı</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.atSymbol}>@</Text>
              <TextInput
                style={styles.input}
                placeholder="kullanici_adi"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={(text) => setUsername(text.toLowerCase())}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
              />
            </View>
            <Text style={styles.hint}>
              En az 3 karakter, harf, rakam ve alt çizgi içerebilir.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.background} />
            ) : (
              <>
                <Text style={styles.buttonText}>Devam Et</Text>
                <Ionicons name="arrow-forward" size={20} color={Colors.background} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  inputContainer: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  atSymbol: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
  },
  hint: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 56,
    gap: Spacing.sm,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: Colors.background,
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
});
