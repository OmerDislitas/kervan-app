-- ============================================================
-- Hap Bilgi Okuma Ödül Fonksiyonu (v11)
-- Kullanıcı "Okudum" butonuna bastığında 2 puan kazanır.
-- Her fact_id için günlük bir kez kazanılabilir.
-- ============================================================

-- claim_fact_reward(fact_id text) → JSON
CREATE OR REPLACE FUNCTION public.claim_fact_reward(fact_id text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_today   text;
  v_key     text;
  v_exists  boolean;
  v_points  int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'unauthenticated');
  END IF;

  v_today := to_char(now() AT TIME ZONE 'Europe/Istanbul', 'YYYY-MM-DD');
  v_key   := v_today || '_' || fact_id;

  -- Bugün bu bilgi için puan alındı mı kontrol et
  SELECT EXISTS (
    SELECT 1 FROM public.fact_reads
    WHERE user_id = v_user_id AND read_key = v_key
  ) INTO v_exists;

  IF v_exists THEN
    SELECT points INTO v_points FROM public.profiles WHERE id = v_user_id;
    RETURN json_build_object('success', true, 'already_claimed', true, 'points', COALESCE(v_points, 0));
  END IF;

  -- Kaydı ekle
  INSERT INTO public.fact_reads (user_id, read_key, created_at)
  VALUES (v_user_id, v_key, now());

  -- 2 puan ekle
  UPDATE public.profiles SET points = COALESCE(points, 0) + 2 WHERE id = v_user_id;

  SELECT points INTO v_points FROM public.profiles WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'already_claimed', false, 'points', COALESCE(v_points, 0));
END;
$$;

-- fact_reads tablosu (daha önce yoksa oluştur)
CREATE TABLE IF NOT EXISTS public.fact_reads (
  id        uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id   uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  read_key  text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, read_key)
);

-- RLS
ALTER TABLE public.fact_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own fact_reads" ON public.fact_reads;
CREATE POLICY "Users can insert own fact_reads"
  ON public.fact_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can select own fact_reads" ON public.fact_reads;
CREATE POLICY "Users can select own fact_reads"
  ON public.fact_reads FOR SELECT
  USING (auth.uid() = user_id);

-- İzinler
REVOKE ALL ON FUNCTION public.claim_fact_reward(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_fact_reward(text) TO authenticated;

-- Schema cache yenile
NOTIFY pgrst, 'reload schema';
