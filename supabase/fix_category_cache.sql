-- ============================================================
-- Schema Cache Fix: events.category kolonu
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) Kolonu mevcut değilse ekle (güvenli)
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS category text
  DEFAULT 'other'
  CHECK (category IN ('match', 'trip', 'camp', 'workshop', 'talk', 'other'));

-- 2) Schema cache'i yenile (PostgREST'i sıfırla)
NOTIFY pgrst, 'reload schema';
