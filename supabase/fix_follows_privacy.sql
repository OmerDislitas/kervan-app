-- ============================================================
-- Follow System Privacy Fix
-- ============================================================

-- Update RLS for follows table to restrict visibility
-- Only the follower or the followed person can see the relationship record.

DROP POLICY IF EXISTS "Herkes takip listelerini gorebilir" ON public.follows;

CREATE POLICY "Kullanicilar sadece kendi takip bilgilerini gorebilir"
  ON public.follows FOR SELECT
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id
  );

-- Ensure other policies are still correct (though they usually are)
-- INSERT: auth.uid() = follower_id
-- DELETE: auth.uid() = follower_id

-- Cache Yenile
NOTIFY pgrst, 'reload schema';
