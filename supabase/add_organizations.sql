-- ============================================================
-- FikirForum Uygulaması - STK / Organizasyon Desteği Migration
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) STK / Organizasyonlar Tablosu
CREATE TABLE IF NOT EXISTS public.organizations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  logo_url    text,       -- Logo resim URL'si veya boşsa baş harflerle avatar gösterilecek
  description text,       -- Kısa açıklama
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2) Etkinlikler Tablosuna STK Bağlantısı Ekleme
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

-- 3) RLS (Row Level Security) Etkinleştirme
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3.1) Tablo yetkilerini tanımla (Permission Denied hatasını önler)
GRANT ALL ON TABLE public.organizations TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Politikalar
DROP POLICY IF EXISTS "Herkes organizasyonlari gorebilir" ON public.organizations;
CREATE POLICY "Herkes organizasyonlari gorebilir"
  ON public.organizations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin organizasyon ekleyebilir" ON public.organizations;
CREATE POLICY "Admin organizasyon ekleyebilir"
  ON public.organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin organizasyon guncelleyebilir" ON public.organizations;
CREATE POLICY "Admin organizasyon guncelleyebilir"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admin organizasyon silebilir" ON public.organizations;
CREATE POLICY "Admin organizasyon silebilir"
  ON public.organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4) Örnek STK / Kurum Verileri (Seed Data)
INSERT INTO public.organizations (name, logo_url, description)
VALUES 
  ('FikirForum Gençlik Hareketi', 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=120&auto=format&fit=crop&q=60', 'Gençliğin gelişimini hedefleyen öncü hareket.'),
  ('İHH İnsani Yardım Vakfı', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=120&auto=format&fit=crop&q=60', 'Dünya genelinde insani yardım faaliyetleri yürüten vakıf.'),
  ('Türkiye Diyanet Vakfı (TDV)', 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&auto=format&fit=crop&q=60', 'Eğitim, kültür ve sosyal yardım alanlarında faaliyet gösteren vakıf.'),
  ('TÜGVA (Türkiye Gençlik Vakfı)', 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=120&auto=format&fit=crop&q=60', 'Gençlerin sosyal, fiziksel ve kültürel gelişimini destekleyen vakıf.'),
  ('Yeşilay', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=120&auto=format&fit=crop&q=60', 'Bağımlılıkla mücadelede öncü sivil toplum kuruluşu.')
ON CONFLICT (name) DO NOTHING;

-- 5) Mevcut yayınlanmış etkinlikleri ilk STK'ya (FikirForum Gençlik) varsayılan olarak bağlayalım
DO $$
DECLARE
  fikirforum_id uuid;
BEGIN
  SELECT id INTO fikirforum_id FROM public.organizations WHERE name = 'FikirForum Gençlik Hareketi' LIMIT 1;
  IF fikirforum_id IS NOT NULL THEN
    UPDATE public.events SET organization_id = fikirforum_id WHERE organization_id IS NULL;
  END IF;
END $$;
