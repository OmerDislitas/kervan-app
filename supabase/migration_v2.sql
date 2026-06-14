
-- 1) Takip Sistemi
CREATE TABLE IF NOT EXISTS public.follows (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id  uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id)
);

-- RLS for follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes takipleri görebilir"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Kullanıcı takip edebilir"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Kullanıcı takibi bırakabilir"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- 2) Yorumlara cevap verme (threading)
ALTER TABLE public.question_comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.question_comments(id) ON DELETE CASCADE;

-- 3) Beğeni sayısına göre sıralama için Realtime ve Grant ayarları (zaten genelde açık olur ama garanti olsun)
GRANT ALL ON public.follows TO anon, authenticated;
