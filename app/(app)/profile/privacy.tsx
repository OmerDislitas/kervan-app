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

const SUPPORT_EMAIL = 'fikirforumapp@gmail.com';

const LAST_UPDATED = '31 Mayıs 2026';

const sections = [
  {
    icon: 'person-outline' as const,
    title: '1. Topladığımız Kişisel Bilgiler',
    content: `FikirForum uygulaması; hizmetlerimizi sunabilmek için bazı kişisel verilerinizi toplamaktadır. Topladığımız veriler şunlardır:

Hesap Bilgileri
• Ad, soyad ve kullanıcı adı
• E-posta adresi (giriş ve bildirim amacıyla)
• Şifre (şifrelenmiş biçimde saklanır, hiçbir zaman düz metin olarak tutulmaz)
• Profil fotoğrafı (isteğe bağlı, yalnızca yüklediğinizde)

İçerik ve Etkileşim Verileri
• Yazdığınız yorumlar, beğeniler ve katıldığınız tartışmalar
• Tamamladığınız görevler ve kazandığınız puanlar
• Uygulamayı kullandığınız süre ve ziyaret sıklığı (istatistiksel)

Teknik Veriler
• Cihaz türü ve işletim sistemi sürümü
• Uygulama sürümü
• Hata raporları (anonim)`,
  },
  {
    icon: 'analytics-outline' as const,
    title: '2. Verilerinizi Neden Topluyoruz?',
    content: `Topladığımız veriler yalnızca aşağıdaki amaçlar doğrultusunda kullanılmaktadır:

✦ Hesap yönetimi ve kimlik doğrulama: E-posta ve şifreniz, hesabınıza güvenli erişim sağlamak için kullanılır.

✦ Kişiselleştirilmiş deneyim: Kullanım alışkanlıklarınıza göre size daha uygun içerikler ve günlük görevler sunulur.

✦ Topluluk özellikleri: Yorum, beğeni ve tartışma verileriniz diğer kullanıcılarla etkileşim kurmanızı sağlar.

✦ Bildirimler: Bildirimleri etkinleştirdiyseniz, ilgi alanlarınıza yönelik günlük bilgelik, pusulа ve etkinlik bildirimleri gönderilir.

✦ Güvenlik ve doğrulama: Yetkisiz erişimleri tespit etmek ve hesap güvenliğini sağlamak.

✦ Hizmet iyileştirme: Anonim kullanım verileri, uygulamayı geliştirmemize yardımcı olur.`,
  },
  {
    icon: 'lock-closed-outline' as const,
    title: '3. Verileriniz Nasıl Korunuyor?',
    content: `FikirForum, verilerinizin güvenliğini en üst düzeyde önemsemektedir. Bu kapsamda alınan teknik ve idari tedbirler şunlardır:

• Tüm veriler endüstri standardı şifreleme (SSL/TLS) protokolleriyle aktarılır.
• Şifreleriniz bcrypt algoritmasıyla hash'lenerek saklanır — hiçbir çalışanımız dahil kimse şifrenizi göremez.
• Veriler, güvenlik sertifikalarına sahip Supabase altyapısı üzerinde barındırılmaktadır.
• Veritabanı erişimi yalnızca yetkili sistem bileşenleriyle sınırlıdır.
• Düzenli güvenlik denetimleri ve güncelleme süreçleri uygulanmaktadır.

Hiçbir sistem %100 güvenli olmasa da olası bir güvenlik ihlalinde kullanıcılarımızı derhal bilgilendirme sorumluluğumuzu yerine getiririz.`,
  },
  {
    icon: 'share-social-outline' as const,
    title: '4. Verilerinizi Kimlerle Paylaşıyoruz?',
    content: `FikirForum, kişisel verilerinizi üçüncü taraflara satmaz, kiralamaz veya pazarlama amacıyla aktarmaz.

Verileriniz yalnızca şu durumlarda paylaşılabilir:

• Altyapı Sağlayıcıları: Supabase (veritabanı barındırma), Expo (push bildirim altyapısı) gibi teknik hizmet sağlayıcılarla — bu sağlayıcılar verilerinizi yalnızca hizmet amaçlı kullanır.

• Yasal Zorunluluklar: Mahkeme kararı veya yetkili kamu otoritelerinin yasal talebi halinde, yasaların gerektirdiği ölçüde.

• Güvenlik İhlalleri: Hesabınızı veya diğer kullanıcıları korumak amacıyla gerekli durumlarda.

Bunların dışında hiçbir koşulda verileriniz paylaşılmaz.`,
  },
  {
    icon: 'notifications-off-outline' as const,
    title: '5. Bildirimler ve İletişim Tercihleri',
    content: `Bildirim iznini kabul etmeniz halinde size şu türde bildirimler gönderilebilir:

• Günlük Bilgelik: Her gün yeni bir düşündürücü söz veya hikaye
• FikirForum Pusulası: Günlük görev hatırlatması
• Cuma Mesajı: Haftanın anlamlı mesajı
• Hap Bilgi: Günün öğrenilmesi gereken bilgisi

Bildirim tercihlerinizi Ayarlar > Tercihler bölümünden dilediğiniz zaman değiştirebilirsiniz. Bildirimleri kapatmanız halinde mevcut izinler iptal edilir ve yeni bildirim gönderilmez.`,
  },
  {
    icon: 'finger-print-outline' as const,
    title: '6. Haklarınız',
    content: `Kişisel verileriniz üzerinde aşağıdaki haklara sahipsiniz:

✦ Erişim Hakkı: Hakkınızda sakladığımız verilere erişim talep edebilirsiniz.

✦ Düzeltme Hakkı: Yanlış veya eksik bilgilerinizi düzeltmemizi talep edebilirsiniz. (Profil Düzenle ekranından kendiniz de güncelleyebilirsiniz.)

✦ Silme Hakkı: Hesabınızı ve ilişkili verileri silmemizi talep edebilirsiniz.

✦ İtiraz Hakkı: Belirli veri işleme faaliyetlerine itiraz edebilirsiniz.

✦ Taşınabilirlik Hakkı: Verilerinizin yapılandırılmış bir formatta tarafınıza iletilmesini talep edebilirsiniz.

Bu haklarınızı kullanmak için fikirforumapp@gmail.com adresine yazabilirsiniz.`,
  },
  {
    icon: 'time-outline' as const,
    title: '7. Verilerin Saklanma Süresi',
    content: `Kişisel verileriniz, hesabınız aktif olduğu sürece saklanır. Hesabınızı silmeniz halinde:

• Profil bilgileriniz 30 gün içinde sistemden kalıcı olarak silinir.
• Paylaştığınız yorumlar anonimleştirilerek saklanabilir (topluluk tartışmalarının bütünlüğü açısından).
• Yasal yükümlülükler gerektirdiği durumlarda bazı veriler mevzuatın öngördüğü süre boyunca tutulabilir.`,
  },
  {
    icon: 'refresh-outline' as const,
    title: '8. Bu Politikanın Güncellenmesi',
    content: `Gizlilik Politikamız zaman zaman güncellenebilir. Önemli değişiklikler olduğunda uygulama üzerinden bildirim yapılır ve politikanın üst kısmındaki "Son güncelleme" tarihi güncellenir.

Uygulamayı kullanmaya devam etmeniz, güncel politikayı kabul ettiğiniz anlamına gelir. Politikayı periyodik olarak incelemenizi öneririz.`,
  },
  {
    icon: 'mail-outline' as const,
    title: '9. İletişim ve Başvuru',
    content: `Gizlilik Politikamıza ilişkin sorularınız, talepleriniz veya şikayetleriniz için:

📧 fikirforumapp@gmail.com

Tarafımıza iletilen başvurular en geç 15 iş günü içinde yanıtlanacaktır. Resmi başvurularınızı yazılı olarak iletmenizi öneririz.`,
  },
];

export default function PrivacyScreen() {
  const themeColors = useThemeColors();
  const styles = React.useMemo(() => createStyles(themeColors), [themeColors]);
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={themeColors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gizlilik Politikası</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Ionicons name="shield-checkmark" size={32} color={'#22C55E'} />
          <Text style={styles.introTitle}>Gizliliğinize Önem Veriyoruz</Text>
          <Text style={styles.introSubtitle}>
            FikirForum olarak verilerinizi korumak en temel önceliğimizdir. Bu politika; hangi bilgileri neden topladığımızı, nasıl kullandığımızı ve haklarınızı açıkça ortaya koymaktadır.
          </Text>
          <View style={styles.updateBadge}>
            <Ionicons name="time-outline" size={13} color={themeColors.textSecondary} />
            <Text style={styles.updateText}>Son güncelleme: {LAST_UPDATED}</Text>
          </View>
        </View>

        {/* Highlight Box */}
        <View style={styles.highlightBox}>
          <Ionicons name="checkmark-circle" size={18} color={'#22C55E'} />
          <Text style={styles.highlightText}>
            FikirForum, kişisel verilerinizi hiçbir koşulda üçüncü taraflara satmaz veya ticari amaçla kullanmaz.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconWrap}>
                <Ionicons name={section.icon} size={18} color={'#22C55E'} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionBody}>{section.content}</Text>
            {section.icon === 'mail-outline' && (
              <TouchableOpacity
                style={styles.emailButton}
                onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                activeOpacity={0.75}
              >
                <Ionicons name="mail" size={16} color="#fff" />
                <Text style={styles.emailButtonText}>{SUPPORT_EMAIL}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Footer Note */}
        <View style={styles.footerNote}>
          <Ionicons name="shield-outline" size={16} color={themeColors.textMuted} />
          <Text style={styles.footerNoteText}>
            Bu politika, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında hazırlanmıştır.
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
    backgroundColor: '#22C55E' + '12',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#22C55E' + '25',
  },
  introTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: themeColors.textPrimary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
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
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: '#22C55E' + '15',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: '#22C55E' + '30',
  },
  highlightText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: themeColors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
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
    backgroundColor: '#22C55E' + '15',
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
    gap: 8,
    backgroundColor: '#22C55E',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.lg,
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
  },
  emailButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#fff',
  },
});
