-- ============================================================
-- Puan Sistemi Güncellemesi (v6)
-- Yorum: 5 Puan, Etkinlik Katılım: 20 Puan
-- ============================================================

-- 1) Puan sütununu garantiye al ve mevcut NULL değerleri 0 yap
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points int DEFAULT 0;
UPDATE public.profiles SET points = 0 WHERE points IS NULL;

-- 2) Yorum Puan Fonksiyonu (5 Puan)
CREATE OR REPLACE FUNCTION public.handle_comment_points()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET points = COALESCE(points, 0) + 5 WHERE id = NEW.user_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET points = GREATEST(0, COALESCE(points, 0) - 5) WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Yorum Tetikleyicisini Yenile
DROP TRIGGER IF EXISTS on_comment_added ON public.question_comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT OR DELETE ON public.question_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_points();

-- 4) Etkinlik Kayıt Puan Fonksiyonu (20 Puan)
CREATE OR REPLACE FUNCTION public.handle_registration_points()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status = 'active') THEN
      UPDATE public.profiles SET points = COALESCE(points, 0) + 20 WHERE id = NEW.user_id;
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status <> 'active' AND NEW.status = 'active') THEN
      UPDATE public.profiles SET points = COALESCE(points, 0) + 20 WHERE id = NEW.user_id;
    ELSIF (OLD.status = 'active' AND NEW.status <> 'active') THEN
      UPDATE public.profiles SET points = GREATEST(0, COALESCE(points, 0) - 20) WHERE id = NEW.user_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    IF (OLD.status = 'active') THEN
      UPDATE public.profiles SET points = GREATEST(0, COALESCE(points, 0) - 20) WHERE id = OLD.user_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Etkinlik Tetikleyicisini Yenile
DROP TRIGGER IF EXISTS on_registration_change ON public.event_registrations;
CREATE TRIGGER on_registration_change
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_registration_points();
