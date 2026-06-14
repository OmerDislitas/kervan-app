-- ============================================================
-- Add Biography Column to Profiles Table (v9)
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) Bio sütununu ekle
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- 2) Uzunluk kısıtlaması ekle (güvenlik için sunucu tarafında da 150 karakter limiti)
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_bio_max_length CHECK (char_length(bio) <= 150);

-- 3) Cache Yenile
NOTIFY pgrst, 'reload schema';
