-- ============================================================
-- KERVAN — GÜVENLİK DÜZELTMELERİ (security_fixes.sql)
-- ------------------------------------------------------------
-- Supabase Dashboard > SQL Editor'de SIRAYLA çalıştırın.
-- Bu dosya idempotsenttir (birden fazla kez çalıştırılabilir).
--
-- İÇERİK:
--   K-1 / Y-1  Yetki yükseltme + puan/takipçi manipülasyonu  (profiles UPDATE/INSERT)
--   K-2 / Y-2  PII sızıntısı (email/phone/push_token) + push token hasadı
--   K-3        anon aşırı yetkileri + RLS'siz tablolar
--   Y-3        Gizli hesapları onaysız takip (follows.status)
--   O-1        sync_all_user_points herkese açık RPC
--   EK         get_event_participants / get_my_profile yardımcı RPC'leri
--
-- ⚠️ K-2 BÖLÜMÜ İSTEMCİ DEĞİŞİKLİĞİ GEREKTİRİR (aşağıda işaretli).
--    Bu SQL ile birlikte şu dosyalar güncellenmelidir:
--      - stores/authStore.ts            -> rpc('get_my_profile')
--      - app/(app)/profile/[id].tsx     -> select('*') yerine güvenli kolonlar
-- ============================================================


-- ============================================================
-- K-1 / Y-1  PROFİL YETKİ YÜKSELTMESİNİ KAPAT
-- ------------------------------------------------------------
-- Kök neden: profiles UPDATE politikasında WITH CHECK yoktu ve
-- 'role','points','email' gibi sütunlar kullanıcı tarafından
-- serbestçe değiştirilebiliyordu. Aşağıda hem RLS WITH CHECK hem
-- de kolon-bazlı GRANT ile çift katman koruma uygulanır.
-- ============================================================

-- Saklanan (mevcut) hassas sütun değerlerini RLS'i bypass ederek
-- okuyan yardımcı fonksiyon. WITH CHECK içinde özyineleme yaşanmaması
-- için SECURITY DEFINER kullanılır.
CREATE OR REPLACE FUNCTION public.profile_protected_unchanged(
  p_role text,
  p_points int,
  p_email text,
  p_followers int,
  p_following int
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role  = p_role
      AND email = p_email
      AND COALESCE(points, 0)           = COALESCE(p_points, 0)
      AND COALESCE(followers_count, 0)  = COALESCE(p_followers, 0)
      AND COALESCE(following_count, 0)  = COALESCE(p_following, 0)
  );
$$;
REVOKE ALL ON FUNCTION public.profile_protected_unchanged(text,int,text,int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.profile_protected_unchanged(text,int,text,int,int) TO authenticated;

-- UPDATE: kullanıcı kendi profilini günceller, ancak korumalı
-- sütunlar (role/points/email/followers/following) değişemez.
DROP POLICY IF EXISTS "Kullanıcı kendi profilini güncelleyebilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanici kendi profilini guncelleyebilir" ON public.profiles;
CREATE POLICY "Kullanici kendi profilini guncelleyebilir"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND public.profile_protected_unchanged(role, points, email, followers_count, following_count)
  );

-- INSERT: ilk giriş profil oluşturma. role mutlaka 'user' olmalı
-- (saldırgan ilk insert'te role='admin' yazamasın).
DROP POLICY IF EXISTS "KullanÄ±cÄ± profil oluÅŸturabilir" ON public.profiles;
DROP POLICY IF EXISTS "Kullanici profil olusturabilir" ON public.profiles;
CREATE POLICY "Kullanici profil olusturabilir"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'user'
    AND COALESCE(points, 0) = 0
  );


-- ============================================================
-- K-2 / Y-2  PII SIZINTISINI KAPAT (email / phone / push_token)
-- ------------------------------------------------------------
-- profiles satırları herkese açık kalır (yorum/öneri sahibinin
-- adı görünmeli) ANCAK hassas SÜTUNLAR yalnızca SECURITY DEFINER
-- RPC üzerinden, sadece kendi satırın için okunabilir.
--
-- ⚠️ Bu bölümden sonra `select('*')` çağrıları "permission denied
--    for column email" hatası verir. İstemci kodu güncellenmelidir.
-- ============================================================

-- 1) Tüm tablo yetkilerini sıfırla (K-3'teki GRANT ALL'u geri alır)
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM authenticated;

-- 2) anon'a profil erişimi YOK. authenticated'e yalnızca güvenli
--    sütunlarda SELECT ver (email/phone/push_token/university_id HARİÇ).
GRANT SELECT (
  id, full_name, username, bio, gender, role, is_private,
  points, followers_count, following_count,
  university_name, department, university_year, created_at
) ON public.profiles TO authenticated;

-- 3) UPDATE yalnızca kullanıcının değiştirmesi meşru olan sütunlarda.
--    role/points/email/gender/followers/following GRANT'lenmez → bu
--    sütunlar API üzerinden hiç değiştirilemez (K-1 ile çift koruma).
GRANT UPDATE (
  full_name, username, phone, university_name, department,
  university_year, is_private, bio, push_token
) ON public.profiles TO authenticated;

-- 4) INSERT (ilk giriş) ve DELETE (kendi hesabını silme) — RLS kısıtlar.
GRANT INSERT, DELETE ON public.profiles TO authenticated;

-- 5) Kendi tam profilini (email/phone/push_token dahil) okumak için RPC.
--    >>> authStore.fetchProfile bunu kullanmalı: supabase.rpc('get_my_profile')
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE
AS $$
  SELECT * FROM public.profiles WHERE id = auth.uid();
$$;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- NOT (Y-2 — Push bildirimi):
-- Push token'lar artık istemciye açılmadığından, istemci tarafındaki
-- sendPushNotification() hedef token'ı okuyamaz ve sessizce devre dışı
-- kalır. Bu BİLİNÇLİ bir güvenlik tercihidir (token hasadını engeller).
-- Push gönderimi bir Supabase Edge Function'a taşınmalıdır; fonksiyon
-- service_role ile token'ı okuyup Expo API'ye gönderir, istemci yalnızca
-- {hedef, başlık, gövde} niyetini iletir.


-- ============================================================
-- K-3  ANON AŞIRI YETKİLERİ + RLS'SİZ TABLOLAR
-- ------------------------------------------------------------
-- 'GRANT ALL ... TO anon' ve 'ALTER DEFAULT PRIVILEGES ... anon'
-- ifadeleri "tek hata = tam açık" riski yaratıyordu. Geri alınır.
-- ============================================================

-- 1) anon'dan tüm tablo/sekans yetkilerini geri al (giriş yapmamış
--    kullanıcının veriye doğrudan erişmesine gerek yok).
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 2) Gelecekteki tablolar için anon'a otomatik ALL verilmesini durdur.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- 3) RLS'i unutulmuş tabloları kapat: notification_logs.
--    (GRANT ALL TO anon ile birleşince herkese açıktı.)
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
-- Bu tabloya yalnızca admin erişsin (istemcinin yazmasına gerek yok).
DROP POLICY IF EXISTS "Admin bildirim loglarini gorebilir" ON public.notification_logs;
CREATE POLICY "Admin bildirim loglarini gorebilir"
  ON public.notification_logs FOR SELECT
  USING ( public.is_admin() );
REVOKE ALL ON public.notification_logs FROM authenticated;
GRANT SELECT ON public.notification_logs TO authenticated;


-- ============================================================
-- Y-3  GİZLİ HESAPLARI ONAYSIZ TAKİP ETMEYİ ENGELLE
-- ------------------------------------------------------------
-- follows INSERT politikası status'u denetlemiyordu; kullanıcı
-- doğrudan status='accepted' yazıp gizli hesabın onay akışını
-- atlayabiliyordu.
-- ============================================================

-- status sütunu yoksa güvenli bir varsayılanla ekle (app zaten kullanıyor).
ALTER TABLE public.follows
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'accepted'
  CHECK (status IN ('pending', 'accepted'));

DROP POLICY IF EXISTS "Kullanicilar baskalarini takip edebilir" ON public.follows;
DROP POLICY IF EXISTS "KullanÄ±cÄ± takip edebilir" ON public.follows;
CREATE POLICY "Kullanicilar baskalarini takip edebilir"
  ON public.follows FOR INSERT
  WITH CHECK (
    auth.uid() = follower_id
    AND (
      -- Gizli hesaplar yalnızca 'pending' ile takip edilebilir;
      -- herkese açık hesaplar doğrudan 'accepted' olabilir.
      status = 'pending'
      OR NOT COALESCE(
           (SELECT is_private FROM public.profiles WHERE id = following_id),
           false
         )
    )
  );

-- Takip isteğini ONAYLAMA işlemi (pending -> accepted) yalnızca
-- takip EDİLEN kişi tarafından yapılabilmeli. UPDATE politikası ekle.
DROP POLICY IF EXISTS "Takip edilen istegi onaylayabilir" ON public.follows;
CREATE POLICY "Takip edilen istegi onaylayabilir"
  ON public.follows FOR UPDATE
  USING (auth.uid() = following_id)
  WITH CHECK (auth.uid() = following_id);


-- ============================================================
-- O-1  sync_all_user_points RPC'sini admin ile sınırla
-- ------------------------------------------------------------
-- Ağır UPDATE'in herhangi bir kullanıcı tarafından tetiklenmesini
-- (kaynak tüketimi/DoS) engelle. Yetki kontrolü artık veritabanında.
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_all_user_points()
RETURNS json AS $$
DECLARE
    updated_count int;
BEGIN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Yetkisiz: yalnızca admin bu işlemi yapabilir.';
    END IF;

    UPDATE public.profiles p
    SET points = (
      COALESCE((SELECT count(*) * 5  FROM public.question_comments  c WHERE c.user_id = p.id), 0)
      +
      COALESCE((SELECT count(*) * 20 FROM public.event_registrations r WHERE r.user_id = p.id AND r.status = 'active'), 0)
    );
    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN json_build_object(
      'success', true,
      'message', 'Puanlar başarıyla senkronize edildi.',
      'updated_rows', updated_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.sync_all_user_points() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_all_user_points() FROM anon;
GRANT EXECUTE ON FUNCTION public.sync_all_user_points() TO authenticated;


-- ============================================================
-- EK  get_event_participants — admin katılımcı listesi (PII)
-- ------------------------------------------------------------
-- Bu RPC istemcide çağrılıyor ama repoda tanımı yoktu (dashboard'da
-- oluşturulmuş). Katılımcı email/telefon döndürdüğü için MUTLAKA
-- admin kontrollü ve SECURITY DEFINER olmalı. Sağlam tanımı burada.
-- ============================================================
-- Mevcut fonksiyon farklı bir dönüş tipiyle tanımlı olabileceğinden
-- (CREATE OR REPLACE dönüş tipini değiştiremez) önce kaldırılır.
DROP FUNCTION IF EXISTS public.get_event_participants(uuid);

CREATE OR REPLACE FUNCTION public.get_event_participants(p_event_id uuid)
RETURNS TABLE (
  reg_id           uuid,
  registered_at    timestamptz,
  full_name        text,
  email            text,
  phone            text,
  gender           text,
  university_name  text,
  department       text,
  university_year  text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public STABLE
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Yetkisiz: yalnızca admin katılımcıları görebilir.';
  END IF;

  RETURN QUERY
  SELECT r.id, r.registered_at, pr.full_name, pr.email, pr.phone, pr.gender,
         pr.university_name, pr.department, pr.university_year
  FROM public.event_registrations r
  JOIN public.profiles pr ON pr.id = r.user_id
  WHERE r.event_id = p_event_id
    AND r.status = 'active'
  ORDER BY r.registered_at ASC;
END;
$$;
REVOKE ALL ON FUNCTION public.get_event_participants(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_event_participants(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_event_participants(uuid) TO authenticated;


-- ============================================================
-- EK-2  GÜNLÜK PUSULA ÖDÜLÜ — güvenli puan verme (K-1 sonrası)
-- ------------------------------------------------------------
-- K-1/Y-1 ile 'points' sütunu istemci güncellemesine kapatıldı
-- (kullanıcı puanını şişiremesin). Pusula görevi puanı artık
-- SUNUCU tarafında, GÜNDE BİR KEZ verilir. Böylece hem meşru akış
-- çalışır hem de istismar (sınırsız puan) engellenir.
-- ============================================================

-- Son ödül tarihini takip için kolon (server tarafı günlük limit).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_compass_claim date;

CREATE OR REPLACE FUNCTION public.claim_compass_reward()
RETURNS json
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  uid        uuid := auth.uid();
  reward     int  := 25;             -- COMPASS_POINTS (istemci ile aynı)
  last_claim date;
  new_points int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Yetkisiz';
  END IF;

  -- Satırı kilitle (eşzamanlı çift ödülü önle)
  SELECT last_compass_claim INTO last_claim
  FROM public.profiles WHERE id = uid FOR UPDATE;

  IF last_claim = CURRENT_DATE THEN
    -- Bugün zaten alınmış: puanı değiştirme, mevcut değeri dön.
    SELECT points INTO new_points FROM public.profiles WHERE id = uid;
    RETURN json_build_object('success', false, 'already_claimed', true, 'points', COALESCE(new_points,0));
  END IF;

  UPDATE public.profiles
    SET points = COALESCE(points, 0) + reward,
        last_compass_claim = CURRENT_DATE
    WHERE id = uid
    RETURNING points INTO new_points;

  RETURN json_build_object('success', true, 'awarded', reward, 'points', new_points);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_compass_reward() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_compass_reward() FROM anon;
GRANT EXECUTE ON FUNCTION public.claim_compass_reward() TO authenticated;

-- NOT: sync_all_user_points() puanları yalnızca yorum+etkinlikten
-- yeniden hesaplar ve pusula bonusunu SIFIRLAR. Admin "Puanları
-- Senkronize Et" çalıştırırsa pusula puanları silinir. Bu eski bir
-- tasarım tutarsızlığıdır; gerekirse pusula bonusu ayrıca eklenmeli.


-- ============================================================
-- Şema önbelleğini yenile (PostgREST)
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- SON KONTROL LİSTESİ
-- ------------------------------------------------------------
-- [ ] Bu SQL'i çalıştırdıktan sonra istemci kodunu güncelle:
--      - stores/authStore.ts            (get_my_profile RPC)
--      - app/(app)/profile/[id].tsx     (select('*') -> güvenli kolonlar)
-- [ ] Push bildirimi için Edge Function planla (Y-2).
-- [ ] (Önerilir) profiles SELECT politikalarındaki "Herkes ... USING(true)"
--     satırı kalsa bile artık hassas kolonlar GRANT'siz olduğundan sızmaz;
--     yine de gözden geçirin.
-- ============================================================
