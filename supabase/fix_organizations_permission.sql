-- ============================================================
-- STK/organizations "permission denied" hatasi icin KESIN COZUM
-- Supabase Dashboard > SQL Editor'de CALISTIRIN
-- ============================================================

-- ADIM 1: Kendi hesabinizi admin yapin
-- Asagidaki satirda 'sizin@email.com' yerine kendi email adresinizi yazin
UPDATE public.profiles SET role = 'admin' WHERE email = 'talhaysr23@gmail.com';

-- Eger yukaridaki komut "0 rows affected" dondurse bile, profiles tablosunda kaydiniz yoksa:
-- Asagidaki komutu calistirin (yine email adresinizi yazin):
INSERT INTO public.profiles (id, email, full_name, role, gender, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Admin'),
  'admin',
  'male',
  NOW()
FROM auth.users au
WHERE au.email = 'talhaysr23@gmail.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- ADIM 2: RLS politikalarini sifirla ve duzelt
-- Mevcut tum politikalar kaldir
DROP POLICY IF EXISTS "Herkes organizasyonlari gorebilir" ON public.organizations;
DROP POLICY IF EXISTS "Admin organizasyon ekleyebilir" ON public.organizations;
DROP POLICY IF EXISTS "Admin organizasyon guncelleyebilir" ON public.organizations;
DROP POLICY IF EXISTS "Admin organizasyon silebilir" ON public.organizations;

-- RLS'i kapatip tekrar ac (bu, cache'i temizler)
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ADIM 2.1: Tablo yetkilerini tanimla (Permission Denied hatasini cozer)
GRANT ALL ON TABLE public.organizations TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- YENI VE BASITLESTIRILMIS politikalar:
-- Herkes organizasyonlari gorebilir
CREATE POLICY "Herkes organizasyonlari gorebilir"
  ON public.organizations FOR SELECT
  USING (true);

-- Admin organizasyon ekleyebilir - DUZELTILMIS
CREATE POLICY "Admin organizasyon ekleyebilir"
  ON public.organizations FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin organizasyon guncelleyebilir - DUZELTILMIS
CREATE POLICY "Admin organizasyon guncelleyebilir"
  ON public.organizations FOR UPDATE
  USING (
    auth.role() = 'authenticated' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admin organizasyon silebilir - DUZELTILMIS
CREATE POLICY "Admin organizasyon silebilir"
  ON public.organizations FOR DELETE
  USING (
    auth.role() = 'authenticated' AND
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- ADIM 3: Test icin RLS'i gecici olarak tamamen kapatmak isterseniz:
-- NOT: Bu sadece gelistirme asamasinda test amacli kullanilabilir!
-- ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SON KONTROL:
-- 1. Yukaridaki tum komutlari SQL Editor'de calistirin
-- 2. Uygulamayi tamamen kapatip tekrar acin
-- 3. STK eklemeyi deneyin
-- ============================================================