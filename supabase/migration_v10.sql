-- ============================================================
-- Delete User RPC (v10)
-- Giriş yapmış kullanıcının kendi auth.users kaydını siler.
-- SECURITY DEFINER ile auth şemasına erişim sağlanır.
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sadece oturum açmış kullanıcı kendi hesabını silebilir
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- Yalnızca giriş yapmış kullanıcılar çağırabilir
REVOKE ALL ON FUNCTION public.delete_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;

-- Schema cache'i yenile
NOTIFY pgrst, 'reload schema';
