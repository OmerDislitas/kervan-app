-- Sosyal etkileşim bildirimleri tablosu (yanıt, beğeni)
CREATE TABLE IF NOT EXISTS public.notifications (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type        text        NOT NULL,   -- 'comment-reply' | 'comment-like'
  title       text        NOT NULL,
  body        text        NOT NULL,
  data        jsonb       NOT NULL DEFAULT '{}',
  is_read     boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_id_idx
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Kullanıcı kendi bildirimlerini okundu olarak işaretleyebilir
CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Oturum açmış herhangi bir kullanıcı başka kullanıcılara bildirim oluşturabilir
CREATE POLICY "notifications_insert_authenticated"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Kullanıcı kendi bildirimlerini silebilir
CREATE POLICY "notifications_delete_own"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);
