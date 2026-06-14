-- ============================================================
-- Puan Senkronizasyonu (v8)
-- Mevcut verileri tarayıp puanları günceller
-- ============================================================

DO $$
BEGIN
    -- Tüm profillerin puanlarını mevcut yorum ve etkinliklerine göre güncelle
    UPDATE public.profiles p
    SET points = (
      -- Yorumlardan gelen puanlar (Yorum başı 5 puan)
      COALESCE((
        SELECT count(*) * 5 
        FROM public.question_comments c 
        WHERE c.user_id = p.id
      ), 0)
      +
      -- Etkinliklerden gelen puanlar (Aktif etkinlik başı 20 puan)
      COALESCE((
        SELECT count(*) * 20 
        FROM public.event_registrations r 
        WHERE r.user_id = p.id AND r.status = 'active'
      ), 0)
    );

    RAISE NOTICE 'Puanlar başarıyla senkronize edildi.';
END $$;
