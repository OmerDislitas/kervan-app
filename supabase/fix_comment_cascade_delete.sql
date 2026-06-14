-- ============================================================
-- Yorum Silme Fonksiyonu (Cascade RLS Sorununu Çözer)
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- Normalde RLS açıkken, başkalarının sizin yorumunuza yaptığı beğeniler (comment_likes) 
-- veya yanıtlar (replies) yüzünden yorumunuzu silemezsiniz (Çünkü onların kaydını silme yetkiniz yoktur).
-- Bu SECURITY DEFINER fonksiyonu, RLS'yi atlayarak güvenli bir şekilde silme işlemi yapar.

CREATE OR REPLACE FUNCTION public.delete_comment(comment_id uuid)
RETURNS void AS $$
BEGIN
  -- Güvenlik Kontrolü: Yorumu silmeye çalışan kişi, yorumun sahibi mi veya admin mi?
  IF EXISTS (
    SELECT 1 FROM public.question_comments 
    WHERE id = comment_id AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    -- Yetki varsa yorumu sil (Veritabanı ON DELETE CASCADE ile beğeni ve yanıtları da otomatik silecektir)
    DELETE FROM public.question_comments WHERE id = comment_id;
  ELSE
    RAISE EXCEPTION 'Bu yorumu silme yetkiniz yok veya yorum zaten silinmiş.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
