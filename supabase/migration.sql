-- ============================================================
-- Kervan UygulamasÄ± - Supabase VeritabanÄ± Migration
-- Supabase Dashboard > SQL Editor'de Ã§alÄ±ÅŸtÄ±rÄ±n
-- ============================================================

-- 1) Ä°stanbul Ãœniversiteleri
CREATE TABLE IF NOT EXISTS public.universities (
  id   serial PRIMARY KEY,
  name text   UNIQUE NOT NULL
);

INSERT INTO public.universities (name) VALUES
  ('BoÄŸaziÃ§i Ãœniversitesi'),
  ('Ä°stanbul Teknik Ãœniversitesi (Ä°TÃœ)'),
  ('Ä°stanbul Ãœniversitesi'),
  ('Marmara Ãœniversitesi'),
  ('YÄ±ldÄ±z Teknik Ãœniversitesi (YTÃœ)'),
  ('SabancÄ± Ãœniversitesi'),
  ('KoÃ§ Ãœniversitesi'),
  ('Galatasaray Ãœniversitesi'),
  ('Ä°stanbul Bilgi Ãœniversitesi'),
  ('BahÃ§eÅŸehir Ãœniversitesi'),
  ('Beykent Ãœniversitesi'),
  ('Ä°stanbul KÃ¼ltÃ¼r Ãœniversitesi'),
  ('Ä°stanbul Ticaret Ãœniversitesi'),
  ('Maltepe Ãœniversitesi'),
  ('Ã–zyeÄŸin Ãœniversitesi'),
  ('AcÄ±badem Mehmet Ali AydÄ±nlar Ãœniversitesi'),
  ('AltÄ±nbaÅŸ Ãœniversitesi'),
  ('Bezmialem VakÄ±f Ãœniversitesi'),
  ('Biruni Ãœniversitesi'),
  ('DoÄŸuÅŸ Ãœniversitesi'),
  ('Fatih Sultan Mehmet VakÄ±f Ãœniversitesi'),
  ('FenerbahÃ§e Ãœniversitesi'),
  ('Gedik Ãœniversitesi'),
  ('HaliÃ§ Ãœniversitesi'),
  ('Ä°bn Haldun Ãœniversitesi'),
  ('Ä°stanbul 29 MayÄ±s Ãœniversitesi'),
  ('Ä°stanbul AydÄ±n Ãœniversitesi'),
  ('Ä°stanbul Esenyurt Ãœniversitesi'),
  ('Ä°stanbul GeliÅŸim Ãœniversitesi'),
  ('Ä°stanbul Medeniyet Ãœniversitesi'),
  ('Ä°stanbul Medipol Ãœniversitesi'),
  ('Ä°stanbul Okan Ãœniversitesi'),
  ('Ä°stanbul Sabahattin Zaim Ãœniversitesi'),
  ('Ä°stanbul TopkapÄ± Ãœniversitesi'),
  ('Ä°stanbul Yeni YÃ¼zyÄ±l Ãœniversitesi'),
  ('Kadir Has Ãœniversitesi'),
  ('MEF Ãœniversitesi'),
  ('Mimar Sinan GÃ¼zel Sanatlar Ãœniversitesi'),
  ('NiÅŸantaÅŸÄ± Ãœniversitesi'),
  ('Piri Reis Ãœniversitesi'),
  ('TÃ¼rk-Alman Ãœniversitesi'),
  ('ÃœskÃ¼dar Ãœniversitesi'),
  ('Yeditepe Ãœniversitesi'),
  ('DiÄŸer')
ON CONFLICT (name) DO NOTHING;

-- 2) KullanÄ±cÄ± Profilleri
CREATE TABLE IF NOT EXISTS public.profiles (
  id               uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            text        NOT NULL,
  full_name        text        NOT NULL,
  phone            text,
  university_id    int         REFERENCES public.universities(id),
  university_name  text,       -- Denormalized, dropdown'dan gelen text
  department       text,
  university_year  text,
  gender           text        NOT NULL CHECK (gender IN ('male', 'female')),
  role             text        NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  push_token       text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- 3) Etkinlikler
CREATE TABLE IF NOT EXISTS public.events (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title               text        NOT NULL,
  description         text,
  location            text,
  event_date          timestamptz,
  is_recurring        boolean     NOT NULL DEFAULT false,
  recurring_day       int         CHECK (recurring_day BETWEEN 0 AND 6),
  recurring_time      time,
  gender_restriction  text        CHECK (gender_restriction IN ('male', 'female')),
  max_capacity        int         CHECK (max_capacity > 0),
  created_by          uuid        REFERENCES public.profiles(id),
  is_published        boolean     NOT NULL DEFAULT false,
  category            text        DEFAULT 'other' CHECK (category IN ('match', 'trip', 'camp', 'workshop', 'talk', 'other')),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Tablo zaten varsa category sÃ¼tununu ekle
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text DEFAULT 'other' CHECK (category IN ('match', 'trip', 'camp', 'workshop', 'talk', 'other'));

-- 4) Etkinlik KayÄ±tlarÄ±
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid        NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id       uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  registered_at timestamptz NOT NULL DEFAULT now(),
  status        text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled')),
  UNIQUE (event_id, user_id)
);

-- 5) Bildirim Logu
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid        REFERENCES public.events(id) ON DELETE SET NULL,
  sent_at         timestamptz NOT NULL DEFAULT now(),
  recipient_count int
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- profiles RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KullanÄ±cÄ± kendi profilini okuyabilir"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "KullanÄ±cÄ± kendi profilini gÃ¼ncelleyebilir"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "KullanÄ±cÄ± profil oluÅŸturabilir"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE POLICY "Admin tÃ¼m profilleri okuyabilir"
  ON public.profiles FOR SELECT
  USING ( public.is_admin() );

-- events RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes yayÄ±ndaki etkinlikleri gÃ¶rebilir"
  ON public.events FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admin tÃ¼m etkinlikleri gÃ¶rebilir"
  ON public.events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin etkinlik oluÅŸturabilir"
  ON public.events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin etkinlik gÃ¼ncelleyebilir"
  ON public.events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin etkinlik silebilir"
  ON public.events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- event_registrations RLS
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "KullanÄ±cÄ± kendi kayÄ±tlarÄ±nÄ± gÃ¶rebilir"
  ON public.event_registrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "KullanÄ±cÄ± kayÄ±t oluÅŸturabilir"
  ON public.event_registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "KullanÄ±cÄ± kendi kaydÄ±nÄ± gÃ¼ncelleyebilir"
  ON public.event_registrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin tÃ¼m kayÄ±tlarÄ± gÃ¶rebilir"
  ON public.event_registrations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- universities RLS (herkes okuyabilir)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Herkes Ã¼niversiteleri gÃ¶rebilir"
  ON public.universities FOR SELECT
  USING (true);

-- ============================================================
-- ADMIN ATAMA
-- KayÄ±t olduktan sonra Supabase Dashboard > Table Editor >
-- profiles tablosunda ilgili kullanÄ±cÄ±nÄ±n role'Ã¼nÃ¼ 'admin' yapÄ±n
-- ============================================================

-- ============================================================
-- REALTIME (katÄ±lÄ±mcÄ± sayÄ±sÄ± iÃ§in)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_registrations;

-- ============================================================
-- YETKÄ°LENDÄ°RME (GRANTS)
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- 6) SÃ¶z Sende (HaftanÄ±n SorularÄ± ve TartÄ±ÅŸma)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.weekly_questions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  is_active   boolean     NOT NULL DEFAULT true,
  created_by  uuid        REFERENCES public.profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.question_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid        NOT NULL REFERENCES public.weekly_questions(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content     text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id  uuid        NOT NULL REFERENCES public.question_comments(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (comment_id, user_id)
);

-- RLS FOR SÃ¶z Sende
ALTER TABLE public.weekly_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Questions RLS
CREATE POLICY "Herkes aktif sorulari gorebilir"
  ON public.weekly_questions FOR SELECT
  USING (true);

CREATE POLICY "Admin soru olusturabilir"
  ON public.weekly_questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin soru guncelleyebilir"
  ON public.weekly_questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin soru silebilir"
  ON public.weekly_questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Comments RLS
CREATE POLICY "Herkes yorumlari gorebilir"
  ON public.question_comments FOR SELECT
  USING (true);

CREATE POLICY "Kullanici yorum yapabilir"
  ON public.question_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanici kendi yorumunu silebilir"
  ON public.question_comments FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- Likes RLS
CREATE POLICY "Herkes begenileri gorebilir"
  ON public.comment_likes FOR SELECT
  USING (true);

CREATE POLICY "Kullanici begeni yapabilir"
  ON public.comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Kullanici kendi begenisini kaldirabilir"
  ON public.comment_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Ã–rnek "SÃ¶z Sende" Sorusu
-- ============================================================
INSERT INTO public.weekly_questions (title, description, is_active)
VALUES ('KudÃ¼s ne zaman Ã¶zgÃ¼r olur?', 'Bu hafta Mescid-i Aksa ve KudÃ¼s davasÄ± Ã¼zerine fikirlerimizi paylaÅŸÄ±yoruz. Sizce Ã¼mmetin bu konudaki rolÃ¼ nedir?', true);

 
 - -   1 )   T a k i p   S i s t e m i 
 
 C R E A T E   T A B L E   I F   N O T   E X I S T S   p u b l i c . f o l l o w s   ( 
 
     i d                       u u i d                 P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) , 
 
     f o l l o w e r _ i d     u u i d                 N O T   N U L L   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E , 
 
     f o l l o w i n g _ i d   u u i d                 N O T   N U L L   R E F E R E N C E S   p u b l i c . p r o f i l e s ( i d )   O N   D E L E T E   C A S C A D E , 
 
     c r e a t e d _ a t       t i m e s t a m p t z   N O T   N U L L   D E F A U L T   n o w ( ) , 
 
     U N I Q U E   ( f o l l o w e r _ i d ,   f o l l o w i n g _ i d ) 
 
 ) ; 
 
 
 
 - -   R L S   f o r   f o l l o w s 
 
 A L T E R   T A B L E   p u b l i c . f o l l o w s   E N A B L E   R O W   L E V E L   S E C U R I T Y ; 
 
 
 
 C R E A T E   P O L I C Y   " H e r k e s   t a k i p l e r i   g Ã ¶ r e b i l i r " 
 
     O N   p u b l i c . f o l l o w s   F O R   S E L E C T 
 
     U S I N G   ( t r u e ) ; 
 
 
 
 C R E A T E   P O L I C Y   " K u l l a n Ä ± c Ä ±   t a k i p   e d e b i l i r " 
 
     O N   p u b l i c . f o l l o w s   F O R   I N S E R T 
 
     W I T H   C H E C K   ( a u t h . u i d ( )   =   f o l l o w e r _ i d ) ; 
 
 
 
 C R E A T E   P O L I C Y   " K u l l a n Ä ± c Ä ±   t a k i b i   b Ä ± r a k a b i l i r " 
 
     O N   p u b l i c . f o l l o w s   F O R   D E L E T E 
 
     U S I N G   ( a u t h . u i d ( )   =   f o l l o w e r _ i d ) ; 
 
 
 
 - -   2 )   Y o r u m l a r a   c e v a p   v e r m e   ( t h r e a d i n g ) 
 
 A L T E R   T A B L E   p u b l i c . q u e s t i o n _ c o m m e n t s   A D D   C O L U M N   I F   N O T   E X I S T S   p a r e n t _ i d   u u i d   R E F E R E N C E S   p u b l i c . q u e s t i o n _ c o m m e n t s ( i d )   O N   D E L E T E   C A S C A D E ; 
 
 
 
 - -   3 )   B e Ä xe n i   s a y Ä ± s Ä ± n a   g Ã ¶ r e   s Ä ± r a l a m a   i Ã § i n   R e a l t i m e   v e   G r a n t   a y a r l a r Ä ±   ( z a t e n   g e n e l d e   a Ã § Ä ± k   o l u r   a m a   g a r a n t i   o l s u n ) 
 
 G R A N T   A L L   O N   p u b l i c . f o l l o w s   T O   a n o n ,   a u t h e n t i c a t e d ; 
 
 
 - -   H e r k e s i n   p r o f i l   b i l g i l e r i n i   g o r e b i l m e s i   i c i n   R L S   g u n c e l l e m e s i 
 D R O P   P O L I C Y   I F   E X I S T S   \ 
 
 K u l l a n 1c 1
 
 k e n d i 
 
 p r o f i l i n i 
 
 o k u y a b i l i r \   O N   p u b l i c . p r o f i l e s ; 
 C R E A T E   P O L I C Y   \ H e r k e s 
 
 p r o f i l l e r i 
 
 g ö r e b i l i r \   O N   p u b l i c . p r o f i l e s   F O R   S E L E C T   U S I N G   ( t r u e ) ; 
 
 
 
 
 - -   P u a n   S i s t e m i 
 
 A L T E R   T A B L E   p u b l i c . p r o f i l e s   A D D   C O L U M N   I F   N O T   E X I S T S   p o i n t s   i n t   D E F A U L T   0 ; 
 
 
 
 - -   Y o r u m   y a p Ä ± n c a   p u a n   k a z a n d Ä ± r 

-- 10) Profil Gizliliği
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false;
