-- User blocking (chat / privacy).
-- Creates a simple blocklist table with RLS and helper view.

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.users(id) on delete cascade,
  blocked_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

alter table public.user_blocks enable row level security;

-- Only the blocker can manage their blocklist.
drop policy if exists "user_blocks_select_own" on public.user_blocks;
create policy "user_blocks_select_own"
on public.user_blocks
for select
to authenticated
using (auth.uid() = blocker_id);

drop policy if exists "user_blocks_insert_own" on public.user_blocks;
create policy "user_blocks_insert_own"
on public.user_blocks
for insert
to authenticated
with check (auth.uid() = blocker_id);

drop policy if exists "user_blocks_delete_own" on public.user_blocks;
create policy "user_blocks_delete_own"
on public.user_blocks
for delete
to authenticated
using (auth.uid() = blocker_id);

-- Convenience view for "is blocked" checks (client can query).
create or replace view public.my_blocked_users as
select blocked_id
from public.user_blocks
where blocker_id = auth.uid();

grant select on public.my_blocked_users to authenticated;
