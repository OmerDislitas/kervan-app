-- ============================================================
-- Social Notifications Auto-Trigger System
-- ============================================================

-- 1) Follow Notifications Trigger Function
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_name text;
  v_following_name text;
BEGIN
  -- Get the follower's full name
  SELECT COALESCE(full_name, 'Bir kullanıcı') INTO v_follower_name
  FROM public.profiles
  WHERE id = NEW.follower_id;

  -- Get the followed person's full name (for follow-accepted type)
  SELECT COALESCE(full_name, 'Bir kullanıcı') INTO v_following_name
  FROM public.profiles
  WHERE id = NEW.following_id;

  IF (TG_OP = 'INSERT') THEN
    IF (NEW.status = 'accepted') THEN
      -- Direct new follower notification
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        NEW.following_id,
        'new-follower',
        'Yeni Bir Takipçi! 👥',
        v_follower_name || ' seni takip etmeye başladı.',
        jsonb_build_object('followerId', NEW.follower_id)
      );
    ELSIF (NEW.status = 'pending') THEN
      -- Follow request notification
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        NEW.following_id,
        'follow-request',
        'Yeni Takip İsteği! 👥',
        v_follower_name || ' sana takip isteği gönderdi.',
        jsonb_build_object('followerId', NEW.follower_id)
      );
    END IF;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    -- If follow status was updated from pending to accepted
    IF (OLD.status = 'pending' AND NEW.status = 'accepted') THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        NEW.follower_id,
        'follow-accepted',
        'Takip İsteğin Kabul Edildi! 👥',
        v_following_name || ' takip isteğini kabul etti.',
        jsonb_build_object('followingId', NEW.following_id)
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate Follow trigger
DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
  AFTER INSERT OR UPDATE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();


-- 2) Comment Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_commenter_name text;
  v_parent_user_id uuid;
  v_question_owner_id uuid;
BEGIN
  -- Get the commenter's name
  SELECT COALESCE(full_name, 'Bir kullanıcı') INTO v_commenter_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF (NEW.parent_id IS NOT NULL) THEN
    -- This is a reply to another comment. Find parent comment owner.
    SELECT user_id INTO v_parent_user_id
    FROM public.question_comments
    WHERE id = NEW.parent_id;

    -- Only notify if the replier is NOT the parent comment owner
    IF (v_parent_user_id IS NOT NULL AND v_parent_user_id <> NEW.user_id) THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_parent_user_id,
        'comment-reply',
        'Yorumuna Yanıt Geldi! 💬',
        v_commenter_name || ' yorumuna yanıt yazdı.',
        jsonb_build_object('questionId', NEW.question_id, 'commentId', NEW.id)
      );
    END IF;
  ELSE
    -- This is a new top-level comment. Find the question owner.
    SELECT created_by INTO v_question_owner_id
    FROM public.weekly_questions
    WHERE id = NEW.question_id;

    -- Only notify if the commenter is NOT the question owner
    IF (v_question_owner_id IS NOT NULL AND v_question_owner_id <> NEW.user_id) THEN
      INSERT INTO public.notifications (user_id, type, title, body, data)
      VALUES (
        v_question_owner_id,
        'comment-reply',
        'Soruna Yeni Yorum! 💬',
        v_commenter_name || ' soruna yorum yaptı.',
        jsonb_build_object('questionId', NEW.question_id, 'commentId', NEW.id)
      );
    END IF;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate comment trigger
DROP TRIGGER IF EXISTS on_comment_notification ON public.question_comments;
CREATE TRIGGER on_comment_notification
  AFTER INSERT ON public.question_comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_notification();


-- 3) Comment Like Notification Trigger Function
CREATE OR REPLACE FUNCTION public.handle_comment_like_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_liker_name text;
  v_comment_owner_id uuid;
  v_question_id uuid;
BEGIN
  -- Get the liker's name
  SELECT COALESCE(full_name, 'Bir kullanıcı') INTO v_liker_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Get comment owner and question_id
  SELECT user_id, question_id INTO v_comment_owner_id, v_question_id
  FROM public.question_comments
  WHERE id = NEW.comment_id;

  -- Only notify if the liker is NOT the comment owner
  IF (v_comment_owner_id IS NOT NULL AND v_comment_owner_id <> NEW.user_id) THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      v_comment_owner_id,
      'comment-like',
      'Yorumun Beğenildi! ❤️',
      v_liker_name || ' yorumunu beğendi.',
      jsonb_build_object('questionId', v_question_id, 'commentId', NEW.comment_id)
    );
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate like trigger
DROP TRIGGER IF EXISTS on_comment_like_notification ON public.comment_likes;
CREATE TRIGGER on_comment_like_notification
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_comment_like_notification();

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
