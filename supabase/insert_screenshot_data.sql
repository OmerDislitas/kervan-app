-- ============================================================
-- Google Play Store Ekran Görüntüleri İçin Mock Veri Ekleme Betiği
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

DO $$
DECLARE
  v_users uuid[] := '{}';
  v_user_id uuid;
  v_question_ids uuid[] := '{}';
  v_q_id uuid;
  v_comment_ids uuid[] := '{}';
  v_c_id uuid;
  i int;
  j int;
  v_org_id uuid;
  v_event_id uuid;
  -- Ekran görüntüleri için gerçekçi veriler
  v_names text[] := ARRAY['Ahmet Yılmaz', 'Ömer Dişlitaş', 'Mehmet Demir', 'Kasım Çelik', 'Can Özkan', 'Elif Şahin', 'Burak Yıldız', 'Fatma Erdoğan', 'Emre Kılıç', 'Rüştü Metin'];
  
  v_topics_title text[] := ARRAY[
    'Yapay Zeka Eğitim Sistemini Nasıl Değiştirecek?',
    'Geleceğin Meslekleri Neler Olacak?',
    'Uzaktan Çalışma Verimliliği Düşürüyor mu?',
    'Sosyal Medyanın Psikolojik Etkileri',
    'İklim Değişikliği İçin Bireysel Önlemler Yeterli mi?',
    'Üniversite Eğitimi Şart mı?'
  ];
  
  v_topics_desc text[] := ARRAY[
    'Eğitimde yapay zekanın rolü giderek artıyor. Öğrenci değerlendirmesinden müfredat oluşturmaya kadar yapay zeka entegrasyonu hakkında ne düşünüyorsunuz?',
    'Teknolojinin gelişimiyle bazı meslekler yok olurken yenileri doğuyor. Sizce 10 yıl sonra en değerli beceriler neler olacak?',
    'Evden çalışma modelinin yaygınlaşmasıyla hem avantajlar hem de dezavantajlar ortaya çıktı. Sizin deneyimleriniz ve düşünceleriniz neler?',
    'Günlük hayatımızın ayrılmaz bir parçası olan sosyal medyanın zihinsel sağlığımız üzerindeki etkilerini nasıl değerlendiriyorsunuz?',
    'Küresel ısınma ve iklim değişikliği ile mücadelede sadece bireysel karbon ayak izini azaltmak yeterli mi, yoksa sistemik değişim mi şart?',
    'Günümüzde online eğitimler ve sertifikalar yaygınlaştı. Kariyer yapmak için hala geleneksel dört yıllık üniversite eğitimi gerekli mi?'
  ];
  
  v_comments text[][] := ARRAY[
    -- Comments for topic 1
    ARRAY[
      'Kesinlikle kişiselleştirilmiş eğitimi mümkün kılacak.', 
      'Öğretmenlerin yerini alamayacak ama onlara çok iyi bir yardımcı olacak.', 
      'Veri gizliliği konusunda endişelerim var.', 
      'Öğrencilerin eleştirel düşünme yeteneğini köreltebilir.', 
      'Eğitimde fırsat eşitliği sağlamak için kullanılabilir.'
    ],
    -- Comments for topic 2
    ARRAY[
      'Veri bilimi ve yapay zeka mühendisliği zirvede kalacak.', 
      'Bence yaratıcılık gerektiren meslekler daha çok değerlenecek.', 
      'Duygusal zeka odaklı işler önem kazanacak.', 
      'Siber güvenlik uzmanlarına çok daha fazla ihtiyaç duyacağız.', 
      'Sağlık teknolojileri alanında yeni roller göreceğiz.'
    ],
    -- Comments for topic 3
    ARRAY[
      'Yolda geçen zamanı kazanmak bence en büyük artı.', 
      'Ekip içi iletişimi zayıflattığını düşünüyorum.', 
      'Evde odaklanmak ofise göre çok daha zor olabiliyor.', 
      'Hibrit model bence en ideali.', 
      'Çalışma saatleri ile özel hayat birbirine girdi.'
    ],
    -- Comments for topic 4
    ARRAY[
      'Sürekli bir kıyaslama halinde olmak yorucu.', 
      'Doğru kullanıldığında harika bir bilgi kaynağı.', 
      'Dopamin bağımlılığı yarattığı bir gerçek.', 
      'Gerçek hayatla olan bağımızı koparıyor.', 
      'Dijital detoks yapmak hepimize şart oldu.'
    ],
    -- Comments for topic 5
    ARRAY[
      'Bireysel çabalar önemli ama büyük şirketler adım atmadıkça zor.', 
      'Herkes kapısının önünü süpürse dünya temiz olur.', 
      'Devletlerin acil ve bağlayıcı politikalar üretmesi lazım.', 
      'Geri dönüşüm alışkanlıkları maalesef çok yetersiz.', 
      'Tüketim çılgınlığını durdurmamız gerekiyor.'
    ],
    -- Comments for topic 6
    ARRAY[
      'Diplomadan ziyade portföy ve projelere bakılıyor artık.', 
      'Üniversitenin kattığı vizyon ve çevre çok önemli.', 
      'Teknik alanlar için evet ama yazılım gibi alanlarda şart değil.', 
      'Hala birçok kurumsal firma için temel bir ön eleme kriteri.', 
      'Eğitim hayat boyu sürmeli, dört yıla sığdırılamaz.'
    ]
  ];

  v_event_titles text[] := ARRAY[
    'Yapay Zeka ve Gelecek Zirvesi',
    'Doğa Yürüyüşü ve Çevre Temizliği',
    'Girişimcilik 101 Atölyesi',
    'Kariyer Sohbetleri: Teknoloji Sektörü'
  ];
  
  v_event_descs text[] := ARRAY[
    'Alanında uzman konuşmacıların katılacağı, yapay zekanın farklı sektörlere etkilerinin konuşulacağı büyük zirve. Etkinlik sonunda networking imkanı da olacaktır.',
    'Hem spor yapacağımız hem de çevremizi temizleyeceğimiz bu etkinliğe herkesi bekliyoruz. Gerekli tüm ekipmanlar tarafımızdan karşılanacaktır.',
    'Kendi işini kurmak isteyenler için temel kavramlar ve ilk adımların anlatılacağı uygulamalı atölye. Kontenjan sınırlıdır.',
    'Teknoloji sektöründe kariyer yapmak isteyen gençler için deneyim paylaşımı ve soru-cevap etkinliği. Başarılı yazılımcılarla bir araya geliyoruz.'
  ];
  
  v_event_locations text[] := ARRAY['Ana Konferans Salonu', 'Belgrad Ormanı', 'İnovasyon Merkezi', 'Öğrenci Merkezi'];
  v_event_categories text[] := ARRAY['talk', 'trip', 'workshop', 'talk'];

BEGIN
  -- 1) Kullanıcıları Oluştur
  FOR i IN 1..10 LOOP
    v_user_id := gen_random_uuid();
    v_users := array_append(v_users, v_user_id);
    
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at)
    VALUES (
      v_user_id,
      'test_user' || i || '@fikirforum.com',
      '$2a$10$abcdefghijklmnopqrstuv',
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated',
      now() - (i || ' days')::interval
    );

    INSERT INTO public.profiles (id, email, full_name, university_id, university_name, department, university_year, gender, role, created_at)
    VALUES (
      v_user_id,
      'test_user' || i || '@fikirforum.com',
      v_names[i],
      (i % 5) + 1,
      'Örnek Üniversitesi ' || ((i % 5) + 1),
      'Örnek Bölüm',
      (i % 4 + 1) || '. Sınıf',
      CASE WHEN i % 2 = 0 THEN 'female' ELSE 'male' END,
      'user',
      now() - (i || ' days')::interval
    );
  END LOOP;

  -- 2) 6 Tartışma Başlığı (Söz Sende)
  FOR i IN 1..6 LOOP
    v_q_id := gen_random_uuid();
    v_question_ids := array_append(v_question_ids, v_q_id);
    
    INSERT INTO public.weekly_questions (id, title, description, is_active, created_by, created_at)
    VALUES (
      v_q_id,
      v_topics_title[i],
      v_topics_desc[i],
      true,
      v_users[1],
      now() - (i || ' hours')::interval
    );

    -- 3) Her başlığa 5'er yorum
    FOR j IN 1..5 LOOP
      v_c_id := gen_random_uuid();
      v_comment_ids := array_append(v_comment_ids, v_c_id);
      
      INSERT INTO public.question_comments (id, question_id, user_id, content, created_at)
      VALUES (
        v_c_id,
        v_q_id,
        v_users[((i+j) % 10) + 1],
        v_comments[i][j],
        now() - ((i*10 + j) || ' minutes')::interval
      );
    END LOOP;
  END LOOP;

  -- 4) Yorumlara rastgele beğeniler (Her yorum için 2-3 beğeni)
  FOR i IN 1..array_length(v_comment_ids, 1) LOOP
    FOR j IN 1..(2 + (i % 2)) LOOP
      INSERT INTO public.comment_likes (comment_id, user_id, created_at)
      VALUES (
        v_comment_ids[i],
        v_users[((i+j*3) % 10) + 1],
        now()
      ) ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;

  -- 5) 4 Etkinlik
  -- Önce bir organizasyon oluşturalım
  v_org_id := gen_random_uuid();
  INSERT INTO public.organizations (id, name, logo_url, description)
  VALUES (
    v_org_id, 
    'FikirForum Topluluğu', 
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=150', 
    'Gençlik, eğitim ve gelişim odaklı bir öğrenci kulübü.'
  )
  ON CONFLICT DO NOTHING;

  FOR i IN 1..4 LOOP
    v_event_id := gen_random_uuid();
    INSERT INTO public.events (id, title, description, location, event_date, is_recurring, max_capacity, created_by, is_published, organization_id, category, created_at)
    VALUES (
      v_event_id,
      v_event_titles[i],
      v_event_descs[i],
      v_event_locations[i],
      now() + (i || ' days')::interval,
      false,
      50,
      v_users[1],
      true,
      v_org_id,
      v_event_categories[i],
      now() - (i || ' hours')::interval
    );
  END LOOP;

END $$;
