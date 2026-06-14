-- ============================================================
-- Yorum Güncelleme Politikası
-- ============================================================

-- Kullanıcının kendi yorumunu güncellemesine izin ver
DROP POLICY IF EXISTS "Kullanici kendi yorumunu guncelleyebilir" ON public.question_comments;
CREATE POLICY "Kullanici kendi yorumunu guncelleyebilir"
  ON public.question_comments FOR UPDATE
  USING (auth.uid() = user_id);
