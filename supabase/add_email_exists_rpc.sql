-- ============================================================
-- "Şifremi Unuttum" akışı — girilen e-postanın sistemde kayıtlı
-- olup olmadığını sızıntısız şekilde kontrol eden RPC.
--
-- Neden RPC: security_fixes.sql (K-3) ile anon rolünden public.profiles
-- tablosuna tüm erişim kaldırıldı (REVOKE ALL ... FROM anon). Giriş
-- ekranı henüz authenticate olmamış (anon) bir kullanıcı tarafından
-- kullanıldığı için profiles'a doğrudan sorgu atamıyoruz. Bu fonksiyon
-- SECURITY DEFINER ile RLS'i bypass eder ama istemciye SADECE boolean
-- döner — e-posta, isim vb. hiçbir PII sızdırmaz.
-- ============================================================
CREATE OR REPLACE FUNCTION public.email_exists(check_email text)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(email) = lower(check_email)
  );
$$;

REVOKE ALL ON FUNCTION public.email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_exists(text) TO anon;
GRANT EXECUTE ON FUNCTION public.email_exists(text) TO authenticated;
