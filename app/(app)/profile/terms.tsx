import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, useThemeColors } from '@/constants/theme';

const LAST_UPDATED = '31 Mayıs 2026';

const sections = [
  {
    icon: 'document-text-outline' as const,
    title: '1. Genel Hükümler',
    content: `Kervan uygulamasını ("Uygulama") indirerek veya kullanarak işbu Kullanım Koşulları'nı ("Koşullar") okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan etmiş olursunuz.

Bu Koşullar; Kervan'ı geliştiren ekip ("Kervan Ekibi") ile uygulamayı kullanan bireyler ("Kullanıcı") arasındaki hukuki ilişkiyi düzenlemektedir. Koşulları kabul etmiyorsanız lütfen uygulamayı kullanmayınız.`,
  },
  {
    icon: 'person-circle-outline' as const,
    title: '2. Hesap Oluşturma ve Sorumluluk',
    content: `Uygulamayı kullanabilmek için bir hesap oluşturmanız gerekmektedir. Hesap oluştururken sağladığınız bilgilerin doğru, güncel ve eksiksiz olmasından tamamen siz sorumlusunuz.

Hesabınızın güvenliğini sağlamak, şifrenizi gizli tutmak ve yetkisiz erişimleri engellemek kullanıcının sorumluluğundadır. Hesabınızda gerçekleşen tüm işlemlerden siz sorumlu tutulursunuz.

18 yaşın altındaki kullanıcıların uygulamayı kullanması, veli veya yasal temsilcinin bilgi og onay dahilinde olmalıdır.`,
  },
  {
    icon: 'shield-outline' as const,
    title: '3. Kabul Edilebilir Kullanım',
    content: `Kervan; İslami değerlere, Türk kültürüne ve tarihe duyarlı, seviyeli bir topluluk ortamı sunmayı hedeflemektedir. Bu doğrultuda aşağıdaki davranışlar kesinlikle yasaktır:

• Nefret söylemi, ayrımcılık veya şiddete teşvik içeren içerik paylaşmak
• Başkalarının kişisel bilgilerini izinsiz paylaşmak (doxxing)
• Spam, yanıltıcı veya reklam amaçlı içerik üretmek
• Uygulamayı teknik olarak istismar etmeye (hack, bot vb.) çalışmak
• Hakaret, tehdit veya taciz içeren mesaj göndermek
• Telif hakkı ihlali oluşturan materyalleri paylaşmak

Bu kurallara aykırı davranışlar; içeriğin kaldırılması, hesabın askıya alınması veya kalıcı olarak silinmesi gibi yaptırımlarla sonuçlanabilir.`,
  },
  {
    icon: 'create-outline' as const,
    title: '4. İçerik ve Fikri Mülkiyet',
    content: `Uygulama üzerinde paylaştığınız yorumlar, görüşler ve diğer içerikler size aittir; ancak bu içerikleri Kervan platformunda yayınlamakla, söz konusu içerikleri sergileme, dağıtma ve tanıtma amacıyla kullanmamız için bize ücretsiz, münhasır olmayan bir lisans vermiş olursunuz.

Kervan adı, logosu, tasarım ögeleri, uygulama içi grafikler ve özgün içerikler Kervan Ekibi'nin fikri mülkiyetidir. İzinsiz kopyalanamaz, çoğaltılamaz veya ticari amaçla kullanılamaz.`,
  },
  {
    icon: 'ban-outline' as const,
    title: '5. Hizmetin Askıya Alınması',
    content: `Kervan Ekibi; kullanıcıların hesaplarını önceden bildirimde bulunmaksızın ve herhangi bir gerekçe göstermeksizin geçici veya kalıcı olarak askıya alma ya da silme hakkını saklı tutar.

Bu durum özellikle şu hallerde uygulanabilir:
• İşbu Koşullar'ın ihlal edilmesi
• Topluluk standartlarına aykırı davranışlar
• Başka kullanıcıların şikayeti üzerine yapılan inceleme sonuçları
• Sistemin güvenliğini tehdit eden faaliyetler`,
  },
  {
    icon: 'refresh-circle-outline' as const,
    title: '6. Değişiklikler',
    content: `Kervan Ekibi, bu Koşullar'ı önceden haber vermeksizin güncelleme hakkına sahiptir. Yapılan değişiklikler uygulama üzerinden duyurulacak ve güncelleme tarihiyle birlikte yayımlanacaktır.

Değişikliklerden sonra uygulamayı kullanmaya devam etmeniz, yeni koşulları kabul ettiğiniz anlamına gelir. Koşulları periyodik olarak incelemenizi tavsiye ederiz.`,
  },
  {
    icon: 'alert-circle-outline' as const,
    title: '7. Sorumluluk Sınırlaması',
    content: `Kervan, "olduğu gibi" sunulmaktadır. Uygulama kesintisiz veya hatasız çalışacağına dair herhangi bir garanti vermemektedir. Kullanıcıların uygulama üzerinden eriştiği içeriklerden kaynaklanabilecek doğrudan veya dolaylı zararlardan Kervan Ekibi sorumlu tutulamaz.

Kullanıcıların birbiriyle gerçekleştirdiği etkileşimlerden doğan anlaşmazlıklarda Kervan Ekibi taraf olmayacaktır.`,
  },
  {
    icon: 'mail-outline' as const,
    title: '8. İletişim',
    content: `Bu Koşullar hakkında sorularınız veya bildirimleriniz için bizimle iletişime geçebilirsiniz:

📧 kervanapp@gmail.com

Talepleriniz en geç 15 iş günü içinde yanıtlanacaktır.`,
  },
];

export default function TermsScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();

  const handleEmailPress = async () => {
    try {
      await Linking.openURL('mailto:kervanapp@gmail.com');
    } catch (error) {
      console.log('Error opening mail client', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kullanım Koşulları</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Ionicons name="document-text" size={32} color={themeColors.primary} />
          <Text style={styles.introTitle}>Kullanım Koşulları</Text>
          <Text style={styles.introSubtitle}>
            Kervan uygulamasını kullanırken lütfen bu koşulları dikkatlice okuyunuz. Bu koşullar, uygulamamızı kullanırken hak ve sorumluluklarınızı düzenlemektedir.
          </Text>
          <View style={styles.updateBadge}>
            <Ionicons name="time-outline" size={13} color={themeColors.textSecondary} />
            <Text style={styles.updateText}>Son güncelleme: {LAST_UPDATED}</Text>
          </View>
        </View>

        {/* Sections */}
        {sections.map((section, index) => {
          const isEmailSection = section.icon === 'mail-outline';
          return (
            <View key={index} style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionIconWrap}>
                  <Ionicons name={section.icon} size={18} color={themeColors.primary} />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              {isEmailSection ? (
                <View>
                  <Text style={styles.sectionBody}>
                    Bu Koşullar hakkında sorularınız veya bildirimleriniz için bizimle iletişime geçebilirsiniz:
                  </Text>
                  
                  <TouchableOpacity 
                    onPress={handleEmailPress}
                    style={styles.emailButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="mail-open-outline" size={16} color={themeColors.primary} />
                    <Text style={styles.emailText}>kervanapp@gmail.com</Text>
                  </TouchableOpacity>

                  <Text style={styles.sectionBody}>
                    Talepleriniz en geç 15 iş günü içinde yanıtlanacaktır.
                  </Text>
                </View>
              ) : (
                <Text style={styles.sectionBody}>{section.content}</Text>
              )}
            </View>
          );
        })}

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={16} color={themeColors.textMuted} />
          <Text style={styles.footerNoteText}>
            Bu koşullar Türkiye Cumhuriyeti yasaları çerçevesinde hazırlanmıştır.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (themeColors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: themeColors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: themeColors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: themeColors.border,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: themeColors.textPrimary,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  introCard: {
    backgroundColor: themeColors.primary + '12',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: themeColors.primary + '25',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: themeColors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  introSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.md,
    backgroundColor: themeColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: themeColors.border,
  },
  updateText: {
    fontSize: 12,
    color: themeColors.textSecondary,
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border + '50',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: themeColors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '800',
    color: themeColors.textPrimary,
    flex: 1,
  },
  sectionBody: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.textSecondary,
    lineHeight: 24,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: themeColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: themeColors.border + '40',
    marginTop: Spacing.sm,
  },
  footerNoteText: {
    fontSize: 12,
    color: themeColors.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.primary + '12',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.md,
    gap: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: themeColors.primary + '25',
    alignSelf: 'flex-start',
  },
  emailText: {
    fontSize: Typography.fontSize.sm,
    color: themeColors.primary,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
