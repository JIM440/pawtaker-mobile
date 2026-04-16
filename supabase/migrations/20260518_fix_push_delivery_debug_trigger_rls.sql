-- Fix push debug trigger writes under RLS.
-- The notifications trigger may insert rows on behalf of another user
-- (for example, sender creates a message and recipient gets the notification),
-- so the debug trigger must run with elevated privileges.

create or replace function public.log_notification_insert_for_push()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.push_delivery_debug (
    notification_id,
    user_id,
    stage,
    detail
  )
  values (
    new.id,
    new.user_id,
    'notification_inserted',
    jsonb_build_object(
      'type', new.type,
      'title', new.title
    )
  );

  return new;
end;
$$;
