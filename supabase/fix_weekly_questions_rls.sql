-- ============================================================
-- weekly_questions RLS Düzeltmesi
-- "permission denied for table weekly_questions" hatasını çözer
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) Mevcut politikaları temizle (çakışma önlemek için)
DROP POLICY IF EXISTS "Herkes aktif sorulari gorebilir" ON public.weekly_questions;
DROP POLICY IF EXISTS "Admin soru olusturabilir" ON public.weekly_questions;
DROP POLICY IF EXISTS "Admin soru guncelleyebilir" ON public.weekly_questions;
DROP POLICY IF EXISTS "Admin soru silebilir" ON public.weekly_questions;

-- 2) RLS'yi aktif et (zaten aktifse sorun olmaz)
ALTER TABLE public.weekly_questions ENABLE ROW LEVEL SECURITY;

-- 3) SELECT: Herkes görebilir
CREATE POLICY "Herkes aktif sorulari gorebilir"
  ON public.weekly_questions FOR SELECT
  USING (true);

-- 4) INSERT: Sadece admin
CREATE POLICY "Admin soru olusturabilir"
  ON public.weekly_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 5) UPDATE: Sadece admin
CREATE POLICY "Admin soru guncelleyebilir"
  ON public.weekly_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 6) DELETE: Sadece admin
CREATE POLICY "Admin soru silebilir"
  ON public.weekly_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 7) GRANT: authenticated kullanıcılara tablo yetkisi ver
GRANT ALL ON public.weekly_questions TO authenticated;

-- 8) Schema cache yenile
NOTIFY pgrst, 'reload schema';
