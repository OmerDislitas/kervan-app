-- ============================================================
-- Bir yorum beğenildiğinde yorum sahibine 2 puan kazandırır.
-- Beğeni geri alınırsa (unlike) puan geri düşer. Kendi yorumunu
-- beğenerek puan kazanmayı engellemek için liker == sahip ise
-- puan verilmez (migration_v3.sql'deki puan tetikleyicileriyle
-- ve add_social_notifications_triggers.sql'deki bildirim
-- tetikleyicisiyle aynı desen).
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_comment_like_points()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_owner_id uuid;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    SELECT user_id INTO v_comment_owner_id
    FROM public.question_comments
    WHERE id = NEW.comment_id;

    IF (v_comment_owner_id IS NOT NULL AND v_comment_owner_id <> NEW.user_id) THEN
      UPDATE public.profiles SET points = points + 2 WHERE id = v_comment_owner_id;
    END IF;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    SELECT user_id INTO v_comment_owner_id
    FROM public.question_comments
    WHERE id = OLD.comment_id;

    IF (v_comment_owner_id IS NOT NULL AND v_comment_owner_id <> OLD.user_id) THEN
      UPDATE public.profiles SET points = points - 2 WHERE id = v_comment_owner_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_comment_like_points ON public.comment_likes;
CREATE TRIGGER on_comment_like_points
  AFTER INSERT OR DELETE ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_like_points();
