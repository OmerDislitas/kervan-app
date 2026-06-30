-- ============================================================
-- FIKIRFORUM — profiles Tablosu RLS Temizliği
-- fix_profiles_rls.sql
-- ------------------------------------------------------------
-- Supabase Dashboard > SQL Editor'de çalıştırın.
-- Bu dosya idempotsenttir (birden fazla kez çalıştırılabilir).
--
-- NEDEN GEREKLİ:
--   profiles tablosunda biriken eski/çakışan 11 politika,
--   security_fixes.sql'deki güvenli politikalarla çelişiyor.
--   Supabase RLS politikaları OR mantığıyla değerlendirilir;
--   yani tek bir gevşek politika tüm güvenlik katmanını
--   etkisiz kılabilir.
--
-- DEĞİŞTİRİLEN DOSYALAR: yalnızca Supabase (SQL), uygulama kodu yok.
-- ============================================================


-- ============================================================
-- ADIM 1: ESKİ / ÇAKIŞAN POLİTİKALARI TEMİZLE
-- ============================================================

-- Supabase şablonu — WITH CHECK yok, role kontrolü yok
DROP POLICY IF EXISTS "Enable insert for authenticated users only"
  ON public.profiles;

-- Herkese (public/anon) açık SELECT — PII sızıntısı riski
DROP POLICY IF EXISTS "Enable read access for all users"
  ON public.profiles;

-- WITH CHECK yok, role/points değiştirilebilir
DROP POLICY IF EXISTS "Enable update for users based on id"
  ON public.profiles;

-- security_fixes.sql K-2 ile çelişen public SELECT
DROP POLICY IF EXISTS "Herkes profilleri görebilir"
  ON public.profiles;

-- Türkçe karakter varyantı (eski migration'dan kalma)
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir"
  ON public.profiles;

-- WITH CHECK olmayan eski UPDATE (security_fixes.sql'de doğrusu var)
DROP POLICY IF EXISTS "update_own_profile"
  ON public.profiles;

-- Anlamsız isimli politikalar — muhtemelen geliştirme sırasında
-- Dashboard'dan elle oluşturulmuş, içerikleri bilinmiyor
DROP POLICY IF EXISTS "p1" ON public.profiles;
DROP POLICY IF EXISTS "p2" ON public.profiles;
DROP POLICY IF EXISTS "p3" ON public.profiles;

-- security_fixes.sql'de zaten DROP+CREATE ediliyor; burada tekrar
-- silmek güvenli (yanlışlıkla eski versiyonları varsa temizler)
DROP POLICY IF EXISTS "Kullanici kendi profilini guncelleyebilir"
  ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir"
  ON public.profiles;
DROP POLICY IF EXISTS "Kullanici profil olusturabilir"
  ON public.profiles;
DROP POLICY IF EXISTS "Kullanıcı profil oluşturabilir"
  ON public.profiles;
DROP POLICY IF EXISTS "Kullanici kendi profilini silebilir"
  ON public.profiles;

-- migration.sql'den gelen eski SELECT politikaları
DROP POLICY IF EXISTS "Kullanıcı kendi profilini okuyabilir"
  ON public.profiles;
DROP POLICY IF EXISTS "Admin tüm profilleri okuyabilir"
  ON public.profiles;


-- ============================================================
-- ADIM 2: GÜVENLİ POLİTİKALARI OLUŞTUR
-- ------------------------------------------------------------
-- Toplam 4 politika: SELECT / INSERT / UPDATE / DELETE
-- security_fixes.sql K-1 + K-2 ile tam uyumlu.
-- ============================================================

-- ── SELECT ──────────────────────────────────────────────────
-- Tüm kimlik doğrulanmış kullanıcılar profil listesini (ad/soyad,
-- üniversite vb.) görebilir. Hassas kolonlar (email/phone/push_token)
-- zaten K-2'deki kolon-bazlı GRANT ile gizlenmiştir;
-- bu politika tek başına PII sızdırmaz.
CREATE POLICY "Herkes profilleri gorebilir"
  ON public.profiles FOR SELECT
  USING (true);

-- ── INSERT ──────────────────────────────────────────────────
-- İlk kayıt sırasında profil oluşturma.
-- Saldırgan role='admin' veya points>0 ile INSERT yapamaz.
-- (security_fixes.sql K-1 ile aynı kural — idempotent CREATE)
CREATE POLICY "Kullanici profil olusturabilir"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'user'
    AND COALESCE(points, 0) = 0
  );

-- ── UPDATE ──────────────────────────────────────────────────
-- Kullanıcı yalnızca kendi satırını güncelleyebilir.
-- WITH CHECK ile role/points/email/followers/following
-- değiştirilemez (profile_protected_unchanged fonksiyonu
-- security_fixes.sql'de tanımlandı).
CREATE POLICY "Kullanici kendi profilini guncelleyebilir"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_protected_unchanged(
          role, points, email,
          followers_count, following_count
        )
  );

-- ── DELETE ──────────────────────────────────────────────────
-- Kullanıcı kendi profilini (ve dolayısıyla hesabını) silebilir.
-- Cascade ile tüm ilişkili kayıtlar da silinir.
CREATE POLICY "Kullanici kendi profilini silebilir"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);


-- ============================================================
-- ADIM 3: add_username_and_suggestions.sql'DEKİ GRANT ALL'u DÜZELT
-- ------------------------------------------------------------
-- add_username_and_suggestions.sql'de bulunan:
--   GRANT ALL ON public.profiles TO authenticated;
-- satırı security_fixes.sql K-2'deki tüm kolon kısıtlamalarını
-- geçersiz kılıyordu. Doğru kolon-bazlı yetkiler yeniden uygulanır.
-- ============================================================

-- Önce tüm yetkiyi sıfırla
REVOKE ALL ON public.profiles FROM authenticated;
REVOKE ALL ON public.profiles FROM anon;

-- Güvenli sütunlarda SELECT (email/phone/push_token/university_id HARİÇ)
GRANT SELECT (
  id, full_name, username, bio, gender, role, is_private,
  points, followers_count, following_count,
  university_name, department, university_year, created_at
) ON public.profiles TO authenticated;

-- Kullanıcının meşru olarak değiştirebileceği sütunlarda UPDATE
-- (role/points/email/gender/followers/following GRANT'lenmez)
GRANT UPDATE (
  full_name, username, phone, university_name, department,
  university_year, is_private, bio, push_token
) ON public.profiles TO authenticated;

-- INSERT (profil oluşturma) ve DELETE (hesap silme) — RLS kısıtlar
GRANT INSERT, DELETE ON public.profiles TO authenticated;


-- ============================================================
-- ADIM 4: SCHEMA CACHE'İ YENILE
-- ============================================================
NOTIFY pgrst, 'reload schema';


-- ============================================================
-- ÖZET — Migration tamamlandıktan sonra profiles politikaları:
-- ┌─────────────────────────────────────────────┬────────┐
-- │ Politika                                    │ Komut  │
-- ├─────────────────────────────────────────────┼────────┤
-- │ Herkes profilleri gorebilir                 │ SELECT │
-- │ Kullanici profil olusturabilir              │ INSERT │
-- │ Kullanici kendi profilini guncelleyebilir   │ UPDATE │
-- │ Kullanici kendi profilini silebilir         │ DELETE │
-- └─────────────────────────────────────────────┴────────┘
--
-- Hassas kolonlar (email/phone/push_token) yalnızca
-- get_my_profile() SECURITY DEFINER RPC üzerinden okunabilir.
-- authStore.ts bu RPC'yi zaten kullanmaktadır.
-- ============================================================
