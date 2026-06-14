
-- Puan Sistemi
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS points int DEFAULT 0;

-- Yorum yapınca puan kazandır
CREATE OR REPLACE FUNCTION public.handle_comment_points()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET points = points + 10 WHERE id = NEW.user_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET points = points - 10 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_added ON public.question_comments;
CREATE TRIGGER on_comment_added
  AFTER INSERT OR DELETE ON public.question_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_points();

-- Etkinliğe katılınca puan kazandır
CREATE OR REPLACE FUNCTION public.handle_registration_points()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET points = points + 50 WHERE id = NEW.user_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status = 'active' AND NEW.status = 'cancelled') THEN
      UPDATE public.profiles SET points = points - 50 WHERE id = NEW.user_id;
    ELSIF (OLD.status = 'cancelled' AND NEW.status = 'active') THEN
      UPDATE public.profiles SET points = points + 50 WHERE id = NEW.user_id;
    END IF;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET points = points - 50 WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_registration_change ON public.event_registrations;
CREATE TRIGGER on_registration_change
  AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_registration_points();
