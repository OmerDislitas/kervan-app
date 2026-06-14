-- ============================================================
-- Follower & Following Count Cache System (v8)
-- ============================================================

-- 1) Add followers_count and following_count columns to profiles table if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS followers_count int DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS following_count int DEFAULT 0;

-- 2) Backfill existing values (Only count 'accepted' status follows)
UPDATE public.profiles p
SET followers_count = (
  SELECT count(*)::int FROM public.follows f 
  WHERE f.following_id = p.id AND f.status = 'accepted'
);

UPDATE public.profiles p
SET following_count = (
  SELECT count(*)::int FROM public.follows f 
  WHERE f.follower_id = p.id AND f.status = 'accepted'
);

-- 3) Create function to handle follows changes and update counts
CREATE OR REPLACE FUNCTION public.handle_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Only increment if follow is immediately accepted
    IF (NEW.status = 'accepted') THEN
      UPDATE public.profiles 
      SET following_count = COALESCE(following_count, 0) + 1 
      WHERE id = NEW.follower_id;
      
      UPDATE public.profiles 
      SET followers_count = COALESCE(followers_count, 0) + 1 
      WHERE id = NEW.following_id;
    END IF;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If status changes from pending/other to accepted, increment counts
    IF (OLD.status IS DISTINCT FROM 'accepted' AND NEW.status = 'accepted') THEN
      UPDATE public.profiles 
      SET following_count = COALESCE(following_count, 0) + 1 
      WHERE id = NEW.follower_id;
      
      UPDATE public.profiles 
      SET followers_count = COALESCE(followers_count, 0) + 1 
      WHERE id = NEW.following_id;
    -- If status changes from accepted to pending/other, decrement counts
    ELSIF (OLD.status = 'accepted' AND NEW.status IS DISTINCT FROM 'accepted') THEN
      UPDATE public.profiles 
      SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
      WHERE id = NEW.follower_id;
      
      UPDATE public.profiles 
      SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
      WHERE id = NEW.following_id;
    END IF;
    
  ELSIF (TG_OP = 'DELETE') THEN
    -- Only decrement if the deleted follow was accepted
    IF (OLD.status = 'accepted') THEN
      UPDATE public.profiles 
      SET following_count = GREATEST(0, COALESCE(following_count, 0) - 1) 
      WHERE id = OLD.follower_id;
      
      UPDATE public.profiles 
      SET followers_count = GREATEST(0, COALESCE(followers_count, 0) - 1) 
      WHERE id = OLD.following_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Recreate Trigger
DROP TRIGGER IF EXISTS on_follow_change ON public.follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR UPDATE OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_counts();

-- 5) Redefine get_user_follow_counts function to read from cached columns
CREATE OR REPLACE FUNCTION public.get_user_follow_counts(target_user_id uuid)
RETURNS TABLE (
  followers_count bigint,
  following_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT p.followers_count FROM public.profiles p WHERE p.id = target_user_id), 0)::bigint as followers_count,
    COALESCE((SELECT p.following_count FROM public.profiles p WHERE p.id = target_user_id), 0)::bigint as following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6) Cache Yenile
NOTIFY pgrst, 'reload schema';
