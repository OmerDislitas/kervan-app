-- ============================================================
-- Kullanıcı Hesap Silme Yetkisi ve Tetikleyicisi (Trigger)
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) Kullanıcının kendi profilini silebilmesi için RLS politikası ekle
DROP POLICY IF EXISTS "Kullanici kendi profilini silebilir" ON public.profiles;
CREATE POLICY "Kullanici kendi profilini silebilir"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- 2) Profil silindiğinde auth.users'daki hesabı da temizleyen tetikleyici fonksiyonu oluştur (SECURITY DEFINER ile)
CREATE OR REPLACE FUNCTION public.delete_auth_user_on_profile_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.users tablosundan siler (bu işlem auth.sessions ve RLS'leri de temizler)
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3) Tetikleyiciyi public.profiles tablosuna bağla
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.delete_auth_user_on_profile_delete();

-- 4) Schema cache yenile
NOTIFY pgrst, 'reload schema';
