-- ============================================================
-- Profil avatarı seçimi — uygulama içinde paketlenmiş 15 hazır
-- avatar görselinden birini seçmeyi sağlar. Görselin kendisi
-- istemci tarafında (constants/avatars.ts) bulunur; burada sadece
-- hangi avatarın seçili olduğunu tutan bir sayı (1-15) saklanır.
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_id smallint;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_avatar_id_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_avatar_id_check
  CHECK (avatar_id IS NULL OR (avatar_id BETWEEN 1 AND 15));

-- security_fixes.sql (K-2) profiles'ı column-level GRANT ile kısıtladığı
-- için yeni sütunun hem okunabilir hem de sahibi tarafından
-- güncellenebilir olması için ayrıca GRANT edilmesi gerekiyor.
-- (avatar_id PII değildir — diğer kullanıcıların yorumlarda/profilde
-- avatarını görebilmesi için authenticated role'e SELECT açık.)
GRANT SELECT (avatar_id) ON public.profiles TO authenticated;
GRANT UPDATE (avatar_id) ON public.profiles TO authenticated;

NOTIFY pgrst, 'reload schema';
