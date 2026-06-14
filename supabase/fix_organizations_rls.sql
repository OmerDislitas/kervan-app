-- ============================================================
-- Organizations Tablosu RLS Politikalarını Düzeltme
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1. Önce mevcut politikaları kaldıralım
DROP POLICY IF EXISTS "Herkes organizasyonlari gorebilir" ON public.organizations;
DROP POLICY IF EXISTS "Admin organizasyon ekleyebilir" ON public.organizations;
DROP POLICY IF EXISTS "Admin organizasyon guncelleyebilir" ON public.organizations;
DROP POLICY IF EXISTS "Admin organizasyon silebilir" ON public.organizations;

-- 2. RLS'i yeniden etkinleştirelim (zaten etkin olabilir)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2.1 Tablo yetkilerini tanımla (Permission Denied hatasını çözer)
GRANT ALL ON TABLE public.organizations TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Profiles tablosunda RLS politikalarını kontrol edelim
-- Admin kontrolü yapabilmek için profiles tablosunun okunabilir olması gerek
DROP POLICY IF EXISTS "Kullanıcılar kendi profillerini görebilir" ON public.profiles;
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 4. Yeni ve daha güvenilir RLS politikaları ekleyelim

-- Herkes organizasyonları görebilir
CREATE POLICY "Herkes organizasyonlari gorebilir"
  ON public.organizations FOR SELECT
  USING (true);

-- Sadece admin kullanıcılar organizasyon ekleyebilir
-- Not: auth.uid() null olmamalı (giriş yapılmış olmalı)
CREATE POLICY "Admin organizasyon ekleyebilir"
  ON public.organizations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Sadece admin kullanıcılar organizasyon güncelleyebilir
CREATE POLICY "Admin organizasyon guncelleyebilir"
  ON public.organizations FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Sadece admin kullanıcılar organizasyon silebilir
CREATE POLICY "Admin organizasyon silebilir"
  ON public.organizations FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- ÖNEMLI: Kullanıcınızın admin olduğundan emin olun
-- ============================================================
-- Supabase Dashboard > Authentication > Users sayfasından
-- kendi kullanıcıınızı bulun ve user metadata'da role=admin olduğundan emin olun
-- VEYA profiles tablosunda kendi kaydınızın role alanını 'admin' yapın:

-- KENDI EMAIL ADRESINIZI AŞAĞIDAKI SATIRA YAZIN:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'talhaysr23@gmail.com';

-- ============================================================
-- Alternatif Çözüm: Eğer yukarıdaki hala çalışmazsa,
-- geçici olarak tüm authenticated kullanıcılara izin verebilirsiniz:
-- ============================================================
-- DROP POLICY IF EXISTS "Admin organizasyon ekleyebilir" ON public.organizations;
-- CREATE POLICY "Authenticated users can insert organizations"
--   ON public.organizations FOR INSERT
--   WITH CHECK (auth.role() = 'authenticated');
-- 
-- DROP POLICY IF EXISTS "Admin organizasyon guncelleyebilir" ON public.organizations;
-- CREATE POLICY "Authenticated users can update organizations"
--   ON public.organizations FOR UPDATE
--   USING (auth.role() = 'authenticated');
-- 
-- DROP POLICY IF EXISTS "Admin organizasyon silebilir" ON public.organizations;
-- CREATE POLICY "Authenticated users can delete organizations"
--   ON public.organizations FOR DELETE
--   USING (auth.role() = 'authenticated');