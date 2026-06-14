-- ============================================================
-- Takip Sistemi (Follow System)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT cannot_follow_self CHECK (follower_id <> following_id)
);

-- RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Politikalar
DROP POLICY IF EXISTS "Herkes takip listelerini gorebilir" ON public.follows;
CREATE POLICY "Herkes takip listelerini gorebilir"
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Kullanicilar baskalarini takip edebilir" ON public.follows;
CREATE POLICY "Kullanicilar baskalarini takip edebilir"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Kullanicilar takibi birakabilir" ON public.follows;
CREATE POLICY "Kullanicilar takibi birakabilir"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Cache Yenile
NOTIFY pgrst, 'reload schema';
