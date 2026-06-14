-- ============================================================
-- Username Kolonu + Etkinlik Öneri Tablosu
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) username kolonu ekle (unique)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

-- Mevcut kullanıcılara full_name'den username oluştur (geçici)
-- (isteğe bağlı, kullanıcılar kendileri ayarlayacak)

-- 2) username unique index (null değerler hariç)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique
  ON public.profiles (username)
  WHERE username IS NOT NULL;

-- 3) Etkinlik öneri tablosu
CREATE TABLE IF NOT EXISTS public.event_suggestions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  description text,
  category    text        DEFAULT 'other',
  status      text        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS for event_suggestions
ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kullanici oneri yapabilir"
  ON public.event_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin onerileri gorebilir"
  ON public.event_suggestions FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admin onerileri guncelleyebilir"
  ON public.event_suggestions FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

GRANT ALL ON public.event_suggestions TO authenticated;

-- 4) Grant for profiles (username update)
GRANT ALL ON public.profiles TO authenticated;

-- 5) Schema cache yenile
NOTIFY pgrst, 'reload schema';
