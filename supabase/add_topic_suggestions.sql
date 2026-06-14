-- ============================================================
-- Tartışma Konusu (Söz Sende) Öneri Tablosu
-- ============================================================

CREATE TABLE IF NOT EXISTS public.topic_suggestions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  status      text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.topic_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanici konu onerisi yapabilir"
  ON public.topic_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanici veya Admin onerileri gorebilir"
  ON public.topic_suggestions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admin onerileri guncelleyebilir"
  ON public.topic_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admin onerileri silebilir"
  ON public.topic_suggestions FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

GRANT ALL ON public.topic_suggestions TO authenticated;

-- Schema cache yenile
NOTIFY pgrst, 'reload schema';
