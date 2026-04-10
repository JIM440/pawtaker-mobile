-- Proposal (pet-sitting) notifications: sender display name + avatar in payload,
-- correct deep-link target (post-requests vs post-availability), and stop
-- broadcasting pet_added to every matching taker (keep owner self-confirmation only).

CREATE OR REPLACE FUNCTION public.notify_pet_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Owner-only confirmation is handled by notify_pet_added_owner_confirmation().
  -- Do not notify all takers when a pet is added.
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_message_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_id text;
  care_owner_id uuid;
  sender_name text;
  sender_avatar text;
  notif_title text;
  notif_body text;
BEGIN
  IF NEW.type NOT IN ('proposal', 'agreement', 'image') THEN
    RETURN NEW;
  END IF;

  SELECT t.request_id::text, cr.owner_id
  INTO req_id, care_owner_id
  FROM public.threads t
  LEFT JOIN public.care_requests cr ON cr.id = t.request_id
  WHERE t.id = NEW.thread_id;

  SELECT COALESCE(u.full_name, 'Someone'), u.avatar_url
  INTO sender_name, sender_avatar
  FROM public.users u
  WHERE u.id = NEW.sender_id;

  CASE NEW.type
    WHEN 'proposal' THEN
      notif_title := 'Pet-sitting request';
      notif_body := format('%s asked you to help with their pet care.', sender_name);
    WHEN 'agreement' THEN
      notif_title := 'Offer accepted';
      notif_body := 'An offer was accepted. Open messages for details.';
    WHEN 'image' THEN
      notif_title := 'New photo in chat';
      notif_body := 'A photo was shared in your conversation.';
    ELSE
      notif_title := 'New message';
      notif_body := 'You have a new message.';
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  SELECT
    p.other_user_id,
    'chat'::text,
    notif_title,
    notif_body,
    JSONB_STRIP_NULLS(
      JSONB_BUILD_OBJECT(
        'threadId', NEW.thread_id,
        'messageType', NEW.type,
        'requestId', req_id,
        'sender_id', NEW.sender_id,
        'sender_name', sender_name,
        'sender_avatar_url', sender_avatar,
        'care_owner_id', care_owner_id,
        'offer_detail_path',
        CASE
          WHEN req_id IS NULL OR care_owner_id IS NULL THEN NULL
          WHEN p.other_user_id = care_owner_id THEN 'post-availability'
          ELSE 'post-requests'
        END
      )
    )::jsonb,
    false
  FROM (
    SELECT unnest(t.participant_ids) AS other_user_id
    FROM public.threads t
    WHERE t.id = NEW.thread_id
  ) p
  WHERE p.other_user_id IS DISTINCT FROM NEW.sender_id;

  RETURN NEW;
END;
$$;
