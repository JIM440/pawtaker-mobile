-- Temporary push delivery diagnostics so we can tell whether a notification:
-- 1) was inserted into public.notifications
-- 2) reached the webhook / Edge Function
-- 3) found device tokens
-- 4) was accepted or rejected by Expo

create table if not exists public.push_delivery_debug (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid null references public.notifications (id) on delete cascade,
  user_id uuid null references public.users (id) on delete set null,
  stage text not null,
  detail jsonb null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_delivery_debug_notification_id
  on public.push_delivery_debug (notification_id, created_at desc);

create index if not exists idx_push_delivery_debug_user_id
  on public.push_delivery_debug (user_id, created_at desc);

alter table public.push_delivery_debug enable row level security;

drop policy if exists "push_delivery_debug_select_own" on public.push_delivery_debug;

create policy "push_delivery_debug_select_own"
  on public.push_delivery_debug
  for select
  to authenticated
  using (auth.uid() = user_id);

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

drop trigger if exists trg_log_notification_insert_for_push on public.notifications;

create trigger trg_log_notification_insert_for_push
after insert on public.notifications
for each row
execute function public.log_notification_insert_for_push();
