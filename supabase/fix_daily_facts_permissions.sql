-- ============================================================
-- GÜNLÜK HAP BİLGİLERİ PERMISSION DENIED HATASI KESİN ÇÖZÜM
-- Supabase Dashboard > SQL Editor'de ÇALIŞTIRIN
-- ============================================================

-- 1. Tablo yetkilerini tanımla (Permission Denied hatasını çözer)
GRANT ALL ON TABLE public.daily_facts TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.facts_pool TO postgres, anon, authenticated, service_role;

-- 2. Gelecekte oluşturulacak tablolar için varsayılan yetkileri de garantiye alalım
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- 3. RLS politikalarını sıfırla ve yeniden etkinleştir (Temiz bir başlangıç için)
ALTER TABLE public.daily_facts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_facts_public_read" ON public.daily_facts;
CREATE POLICY "daily_facts_public_read"
  ON public.daily_facts FOR SELECT
  USING (true);

ALTER TABLE public.facts_pool DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.facts_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facts_pool_public_read" ON public.facts_pool;
CREATE POLICY "facts_pool_public_read"
  ON public.facts_pool FOR SELECT
  USING (true);

-- 4. Bugünün verisini zorla yeniden oluşturalım
SELECT public.generate_daily_facts();

-- ============================================================
-- SON KONTROL:
-- 1. Yukarıdaki tüm komutları SQL Editor'de çalıştırın.
-- 2. Uygulamayı tamamen kapatıp tekrar açın.
-- 3. Keşfet sayfasındaki bilgiler yenilenmiş olacaktır!
-- ============================================================
