-- ============================================================
-- Optimized Function to get follow counts
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_follow_counts(target_user_id uuid)
RETURNS TABLE (
  followers_count bigint,
  following_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE((SELECT p.followers_count FROM public.profiles p WHERE p.id = target_user_id), 0)::bigint as followers_count,
    COALESCE((SELECT p.following_count FROM public.profiles p WHERE p.id = target_user_id), 0)::bigint as following_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_user_follow_counts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_follow_counts(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_follow_counts(uuid) TO service_role;
