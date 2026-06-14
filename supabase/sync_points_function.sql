-- ============================================================
-- Sync All User Points Function
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_all_user_points()
RETURNS json AS $$
DECLARE
    updated_count int;
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

    GET DIAGNOSTICS updated_count = ROW_COUNT;

    RETURN json_build_object(
        'success', true,
        'message', 'Puanlar başarıyla senkronize edildi.',
        'updated_rows', updated_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access to admins only (optional, but safer)
-- For now, allow authenticated users if we check admin role in the app
GRANT EXECUTE ON FUNCTION public.sync_all_user_points() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_all_user_points() TO service_role;
