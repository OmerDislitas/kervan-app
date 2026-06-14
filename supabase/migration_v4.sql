-- ============================================================
-- RLS Politikası Düzeltmesi - weekly_questions
-- Bu migration, admin soru oluşturma hatasını düzeltir
-- ============================================================

-- Eski politikaları kaldır
DROP POLICY IF EXISTS "Admin soru olusturabilir" ON public.weekly_questions;
DROP POLICY IF EXISTS "Admin soru guncelleyebilir" ON public.weekly_questions;
DROP POLICY IF EXISTS "Admin soru silebilir" ON public.weekly_questions;

-- Yeni politikaları ekle (events tablosundaki gibi doğrudan kontrol)
CREATE POLICY "Admin soru olusturabilir"
  ON public.weekly_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin soru guncelleyebilir"
  ON public.weekly_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin soru silebilir"
  ON public.weekly_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );