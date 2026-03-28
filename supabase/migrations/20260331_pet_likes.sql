-- Liked pets (My Care → Liked tab + feed heart). One row per (user, pet).

create table if not exists public.pet_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  /** Request the user had in view when liking (optional, for context). */
  care_request_id uuid null references public.care_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, pet_id)
);

create index if not exists pet_likes_user_id_idx on public.pet_likes (user_id);
create index if not exists pet_likes_pet_id_idx on public.pet_likes (pet_id);

alter table public.pet_likes enable row level security;

drop policy if exists "pet_likes_select_own" on public.pet_likes;
create policy "pet_likes_select_own"
on public.pet_likes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "pet_likes_insert_own_not_own_pet" on public.pet_likes;
create policy "pet_likes_insert_own_not_own_pet"
on public.pet_likes
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.pets p
    where p.id = pet_id and p.owner_id is distinct from auth.uid()
  )
);

drop policy if exists "pet_likes_delete_own" on public.pet_likes;
create policy "pet_likes_delete_own"
on public.pet_likes
for delete
to authenticated
using (auth.uid() = user_id);
