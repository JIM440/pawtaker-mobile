-- Clearer in-app notification copy for chat-related message events.
create or replace function public.notify_message_event()
returns trigger
language plpgsql
as $$
declare
  req_id text;
  notif_title text;
  notif_body text;
begin
  if new.type not in ('proposal', 'agreement', 'image') then
    return new;
  end if;

  select t.request_id::text into req_id
  from public.threads t
  where t.id = new.thread_id;

  case new.type
    when 'proposal' then
      notif_title := 'Pet-sitting request';
      notif_body := 'Someone asked you to help with their pet care. Open messages to respond.';
    when 'agreement' then
      notif_title := 'Offer accepted';
      notif_body := 'An offer was accepted. Open messages for details.';
    when 'image' then
      notif_title := 'New photo in chat';
      notif_body := 'A photo was shared in your conversation.';
    else
      notif_title := 'New message';
      notif_body := 'You have a new message.';
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
      'requestId', req_id
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
