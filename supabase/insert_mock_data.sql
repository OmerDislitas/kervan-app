-- ============================================================
-- Kervan Uygulaması - Mock Veri Ekleme Betiği
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
  v_event_id uuid;
  v_question_id uuid;
  v_comment_id uuid;
  v_org_id uuid;
  i int;
  v_name text;
  v_email text;
  v_username text;
  v_event_title text;
  v_category text;
BEGIN
  -- 1) MOCK ORGANIZATIONS (10 STK)
  FOR i IN 1..10 LOOP
    v_org_id := gen_random_uuid();
    INSERT INTO public.organizations (id, name, logo_url, description, created_at)
    VALUES (
      v_org_id,
      'STK Vakfı ' || i,
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=150',
      'Bu ' || i || ' numaralı STK vakfı, gençlik, eğitim, kültür ve sosyal sorumluluk projeleri yürütmektedir.',
      now() - (i || ' days')::interval
    ) ON CONFLICT DO NOTHING;
  END LOOP;

  -- 2) MOCK USERS & PROFILES (60 Users)
  FOR i IN 1..60 LOOP
    v_user_id := gen_random_uuid();
    v_email := 'kullanici' || i || '@kervanapp.com';
    v_username := 'kullanici_' || i;
    v_name := 'Kullanıcı ' || i;

    -- auth.users'a ekle (Supabase Auth)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at)
    VALUES (
      v_user_id,
      v_email,
      '$2a$10$abcdefghijklmnopqrstuv', -- dummy hash
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated',
      now() - (i || ' days')::interval
    );

    -- public.profiles'a ekle
    INSERT INTO public.profiles (id, email, full_name, username, university_id, university_name, department, university_year, gender, role, points, is_private, created_at)
    VALUES (
      v_user_id,
      v_email,
      v_name,
      v_username,
      (i % 55) + 1,
      'Üniversite ' || ((i % 55) + 1),
      'Bölüm ' || (i % 10),
      (i % 4 + 1) || '. Sınıf',
      CASE WHEN i % 2 = 0 THEN 'male'::text ELSE 'female'::text END,
      'user',
      (i * 15) % 300,
      CASE WHEN i % 5 = 0 THEN true ELSE false END,
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 3) MOCK EVENTS (50 events)
  FOR i IN 1..50 LOOP
    v_user_id := (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1);
    IF v_user_id IS NULL THEN
      -- Eğer admin yoksa ilk kullanıcıyı admin yapıp seçelim
      v_user_id := (SELECT id FROM public.profiles LIMIT 1);
      UPDATE public.profiles SET role = 'admin' WHERE id = v_user_id;
    END IF;

    v_org_id := (SELECT id FROM public.organizations ORDER BY random() LIMIT 1);
    v_category := (ARRAY['match', 'trip', 'camp', 'workshop', 'talk', 'other'])[ (i % 6) + 1 ];
    v_event_title := (ARRAY['Halı Saha Maçı', 'Doğa Yürüyüşü', 'Yaz Kampı', 'Robotik Atölyesi', 'Girişimcilik Zirvesi', 'Tarih Söyleşisi'])[ (i % 6) + 1 ] || ' #' || i;

    INSERT INTO public.events (title, description, location, event_date, is_recurring, recurring_day, recurring_time, gender_restriction, max_capacity, created_by, is_published, organization_id, category, created_at)
    VALUES (
      v_event_title,
      'Bu ' || i || ' numaralı etkinliktir. Katılım sağlayarak puan kazanabilir ve yeni insanlarla tanışabilirsiniz.',
      'Kervan Merkezi Konferans Salonu ' || (i % 5 + 1),
      now() + (i || ' days')::interval + '2 hours'::interval,
      false,
      null,
      null,
      CASE WHEN i % 3 = 1 THEN 'male'::text WHEN i % 3 = 2 THEN 'female'::text ELSE null END,
      20 + (i % 5) * 10,
      v_user_id,
      true,
      v_org_id,
      v_category,
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 4) MOCK EVENT REGISTRATIONS (150 registrations)
  FOR i IN 1..150 LOOP
    v_user_id := (SELECT id FROM public.profiles ORDER BY random() LIMIT 1);
    v_event_id := (SELECT id FROM public.events ORDER BY random() LIMIT 1);

    INSERT INTO public.event_registrations (event_id, user_id, status, registered_at)
    VALUES (v_event_id, v_user_id, 'active', now() - (i % 10 || ' hours')::interval)
    ON CONFLICT (event_id, user_id) DO NOTHING;
  END LOOP;

  -- 5) MOCK WEEKLY QUESTIONS (20 questions)
  FOR i IN 1..20 LOOP
    v_user_id := (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1);
    INSERT INTO public.weekly_questions (title, description, is_active, created_by, created_at)
    VALUES (
      'Haftalık Tartışma Konusu #' || i,
      'Sizce bu konudaki en önemli toplumsal sorun nedir? Fikirlerinizi paylaşın. #' || i,
      CASE WHEN i <= 3 THEN true ELSE false END,
      v_user_id,
      now() - (i || ' weeks')::interval
    );
  END LOOP;

  -- 6) MOCK QUESTION COMMENTS (80 comments)
  FOR i IN 1..80 LOOP
    v_user_id := (SELECT id FROM public.profiles ORDER BY random() LIMIT 1);
    v_question_id := (SELECT id FROM public.weekly_questions ORDER BY random() LIMIT 1);

    INSERT INTO public.question_comments (question_id, user_id, content, created_at)
    VALUES (
      v_question_id,
      v_user_id,
      'Bence bu konuda en önemli nokta yardımlaşmadır. Yorum #' || i,
      now() - (i || ' hours')::interval
    );
  END LOOP;

  -- 7) MOCK COMMENT LIKES (120 likes)
  FOR i IN 1..120 LOOP
    v_user_id := (SELECT id FROM public.profiles ORDER BY random() LIMIT 1);
    v_comment_id := (SELECT id FROM public.question_comments ORDER BY random() LIMIT 1);

    INSERT INTO public.comment_likes (comment_id, user_id, created_at)
    VALUES (v_comment_id, v_user_id, now() - (i % 24 || ' hours')::interval)
    ON CONFLICT (comment_id, user_id) DO NOTHING;
  END LOOP;

  -- 8) MOCK TOPIC SUGGESTIONS (50 topic suggestions)
  FOR i IN 1..50 LOOP
    v_user_id := (SELECT id FROM public.profiles ORDER BY random() LIMIT 1);
    INSERT INTO public.topic_suggestions (user_id, title, description, status, created_at)
    VALUES (
      v_user_id,
      'Öneri Tartışma Başlığı #' || i,
      'Bu konunun Kervan topluluğu tarafından tartışılmasının faydalı olacağını düşünüyorum.',
      (ARRAY['pending', 'reviewed', 'accepted', 'rejected'])[ (i % 4) + 1 ],
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 9) MOCK EVENT SUGGESTIONS (50 event suggestions)
  FOR i IN 1..50 LOOP
    v_user_id := (SELECT id FROM public.profiles ORDER BY random() LIMIT 1);
    INSERT INTO public.event_suggestions (user_id, title, description, category, status, created_at)
    VALUES (
      v_user_id,
      'Öneri Etkinlik Adı #' || i,
      'Gençlerin katılımı için bu etkinliğin yapılması yararlı olacaktır.',
      (ARRAY['match', 'trip', 'camp', 'workshop', 'talk', 'other'])[ (i % 6) + 1 ],
      (ARRAY['pending', 'reviewed', 'approved', 'rejected'])[ (i % 4) + 1 ],
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 10) MOCK FOLLOWS (100 follows)
  FOR i IN 1..100 LOOP
    v_user_id := (SELECT id FROM public.profiles ORDER BY random() LIMIT 1);
    DECLARE
      v_target_id uuid;
    BEGIN
      v_target_id := (SELECT id FROM public.profiles WHERE id <> v_user_id ORDER BY random() LIMIT 1);
      IF v_target_id IS NOT NULL THEN
        INSERT INTO public.follows (follower_id, following_id, status, created_at)
        VALUES (v_user_id, v_target_id, 'accepted', now() - (i || ' hours')::interval)
        ON CONFLICT (follower_id, following_id) DO NOTHING;
      END IF;
    END;
  END LOOP;

END $$;
