-- Notifications triggers
-- Automatically creates `public.notifications` rows when key domain events happen.

-- 1) Pet added -> notify available takers who accepted this species
create or replace function public.notify_pet_added()
returns trigger
language plpgsql
as $$
declare
  owner_name text;
begin
  select coalesce(u.full_name, 'A pet owner') into owner_name
  from public.users u
  where u.id = new.owner_id;

  insert into public.notifications (user_id, type, title, body, data, read)
  select
    tp.user_id,
    'pet_added'::text,
    'New pet added'::text,
    format('%s added %s to PawTaker.', owner_name, new.name)::text,
    jsonb_build_object(
      'pet_id', new.id,
      'species', new.species
    )::jsonb,
    false
  from public.taker_profiles tp
  where coalesce((tp.availability_json->>'available')::boolean, false) = true
    and tp.accepted_species is not null
    and new.species = any(tp.accepted_species);

  return new;
end;
$$;

drop trigger if exists trg_notify_pet_added on public.pets;
create trigger trg_notify_pet_added
after insert on public.pets
for each row
execute function public.notify_pet_added();

-- 2) Availability posted/updated -> notify owners of pets matching accepted species
create or replace function public.notify_availability_posted()
returns trigger
language plpgsql
as $$
declare
  taker_name text;
begin
  -- Avoid spamming on no-op updates
  if tg_op = 'UPDATE' then
    if coalesce((old.availability_json->>'available')::boolean, false)
      = coalesce((new.availability_json->>'available')::boolean, false)
      and old.accepted_species is not distinct from new.accepted_species
    then
      return new;
    end if;
  end if;

  if coalesce((new.availability_json->>'available')::boolean, false) is not true then
    return new;
  end if;

  select coalesce(u.full_name, 'A taker') into taker_name
  from public.users u
  where u.id = new.user_id;

  insert into public.notifications (user_id, type, title, body, data, read)
  select distinct
    p.owner_id,
    'availability_posted'::text,
    'New availability posted'::text,
    format('%s is now available to care for pets like yours.', taker_name)::text,
    jsonb_build_object(
      'taker_id', new.user_id
    )::jsonb,
    false
  from public.pets p
  where p.species = any(coalesce(new.accepted_species, '{}'::text[]))
    and p.owner_id <> new.user_id;

  return new;
end;
$$;

drop trigger if exists trg_notify_availability_posted on public.taker_profiles;
create trigger trg_notify_availability_posted
after insert or update on public.taker_profiles
for each row
execute function public.notify_availability_posted();

-- 3) Review received -> notify the reviewee
create or replace function public.notify_review_received()
returns trigger
language plpgsql
as $$
declare
  reviewer_name text;
begin
  select coalesce(u.full_name, 'Someone') into reviewer_name
  from public.users u
  where u.id = new.reviewer_id;

  insert into public.notifications (user_id, type, title, body, data, read)
  values (
    new.reviewee_id,
    'review_received'::text,
    'New review received'::text,
    format('%s left you a review.', reviewer_name)::text,
    jsonb_build_object(
      'review_id', new.id,
      'rating', new.rating
    )::jsonb,
    false
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_review_received on public.reviews;
create trigger trg_notify_review_received
after insert on public.reviews
for each row
execute function public.notify_review_received();

-- 4) Message created (proposal/agreement/image) -> notify the other thread participants
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
      notif_body := 'You received a request related to pet care.';
    when 'agreement' then
      notif_title := 'Offer accepted';
      notif_body := 'An offer related to pet care was accepted.';
    when 'image' then
      notif_title := 'New photo shared';
      notif_body := 'A photo was shared in your conversation.';
    else
      notif_title := 'New message';
      notif_body := 'You received a new message.';
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

drop trigger if exists trg_notify_message_event on public.messages;
create trigger trg_notify_message_event
after insert on public.messages
for each row
execute function public.notify_message_event();

-- 5) KYC rejected -> notify the user (for Resubmit button)
create or replace function public.notify_kyc_rejected()
returns trigger
language plpgsql
as $$
begin
  if new.kyc_status = 'rejected'
    and (old.kyc_status is distinct from new.kyc_status)
  then
    insert into public.notifications (user_id, type, title, body, data, read)
    values (
      new.id,
      'kyc_rejected'::text,
      'KYC rejected'::text,
      'Your verification was rejected. Please resubmit your KYC.',
      jsonb_build_object('kyc_status', new.kyc_status)::jsonb,
      false
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_kyc_rejected on public.users;
create trigger trg_notify_kyc_rejected
after update of kyc_status on public.users
for each row
execute function public.notify_kyc_rejected();

