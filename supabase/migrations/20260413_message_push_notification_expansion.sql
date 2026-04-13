-- Expand chat notification trigger coverage for message flows.
-- Ensures push notifications are generated for text/video/file messages too.

create or replace function public.notify_message_event()
returns trigger
language plpgsql
as $$
declare
  req_id text;
  notif_title text;
  notif_body text;
  sender_name text;
  sender_avatar text;
begin
  if new.type not in ('proposal', 'agreement', 'image', 'text', 'video', 'file') then
    return new;
  end if;

  select t.request_id::text into req_id
  from public.threads t
  where t.id = new.thread_id;

  select coalesce(u.full_name, 'Someone'), nullif(trim(u.avatar_url), '')
    into sender_name, sender_avatar
  from public.users u
  where u.id = new.sender_id;

  case new.type
    when 'proposal' then
      notif_title := 'Pet-sitting request';
      notif_body := 'You received a request related to pet care.';
    when 'agreement' then
      notif_title := 'Offer accepted';
      notif_body := 'An offer related to pet care was accepted.';
    when 'image' then
      notif_title := format('%s shared a photo', sender_name);
      notif_body := 'Tap to view the shared image.';
    when 'video' then
      notif_title := format('%s shared a video', sender_name);
      notif_body := 'Tap to view the shared video.';
    when 'file' then
      notif_title := format('%s shared a document', sender_name);
      notif_body := 'Tap to open the shared document.';
    else
      notif_title := coalesce(nullif(trim(sender_name), ''), 'New message');
      notif_body := coalesce(nullif(trim(new.content), ''), 'You received a new message.');
  end case;

  insert into public.notifications (user_id, type, title, body, data, read)
  select
    other_user_id,
    'chat'::text,
    notif_title::text,
    notif_body::text,
    jsonb_build_object(
      'threadId', new.thread_id,
      'messageType', new.type,
      'requestId', req_id,
      'sender_id', new.sender_id,
      'sender_name', sender_name,
      'sender_avatar_url', sender_avatar
    )::jsonb,
    false
  from (
    select unnest(t.participant_ids) as other_user_id
    from public.threads t
    where t.id = new.thread_id
  ) participants
  where participants.other_user_id <> new.sender_id;

  return new;
end;
$$;
