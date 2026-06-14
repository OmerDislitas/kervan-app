-- ============================================================
-- Etkinlik Öneri Tablosu İzinleri ve Eksik Kolon Düzeltme
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) is_admin() fonksiyonunun varlığından emin ol
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2) Eksik 'location' kolonunu ekle
ALTER TABLE public.event_suggestions ADD COLUMN IF NOT EXISTS location text;

-- 3) Status constraintini koddakiyle (approved) uyumlu hale getir
ALTER TABLE public.event_suggestions DROP CONSTRAINT IF EXISTS event_suggestions_status_check;
ALTER TABLE public.event_suggestions ADD CONSTRAINT event_suggestions_status_check 
  CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected'));

-- 4) RLS'nin aktif olduğundan emin ol
ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

-- 5) Politikaları Temizle ve Yeniden Oluştur
DROP POLICY IF EXISTS "Kullanici oneri yapabilir" ON public.event_suggestions;
CREATE POLICY "Kullanici oneri yapabilir"
  ON public.event_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin onerileri gorebilir" ON public.event_suggestions;
CREATE POLICY "Admin onerileri gorebilir"
  ON public.event_suggestions FOR SELECT
  USING (
    auth.uid() = user_id OR
    public.is_admin()
  );

DROP POLICY IF EXISTS "Admin onerileri guncelleyebilir" ON public.event_suggestions;
CREATE POLICY "Admin onerileri guncelleyebilir"
  ON public.event_suggestions FOR UPDATE
  USING ( public.is_admin() );

DROP POLICY IF EXISTS "Admin onerileri silebilir" ON public.event_suggestions;
CREATE POLICY "Admin onerileri silebilir"
  ON public.event_suggestions FOR DELETE
  USING ( public.is_admin() );

-- 5) Rol Yetkilerini Ver (Permission Denied hatasını çözen ana kısım)
GRANT ALL ON public.event_suggestions TO authenticated;
GRANT ALL ON public.event_suggestions TO anon;
GRANT ALL ON public.event_suggestions TO service_role;

-- 6) Şema önbelleğini yenile
NOTIFY pgrst, 'reload schema';
