-- App-level RPC endpoints for DB-first mobile screens.
-- Apply with Supabase migration tooling or run in SQL the .

-- HOME FEED ENDPOINT
create or replace function public.get_home_feed(
  p_user_id uuid,
  p_search text default null,
  p_filter text default 'all'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requests jsonb := '[]'::jsonb;
  v_takers jsonb := '[]'::jsonb;
  v_my_pets jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', cr.id,
        'owner_id', cr.owner_id,
        'pet_id', cr.pet_id,
        'care_type', cr.care_type,
        'status', cr.status,
        'start_date', cr.start_date,
        'end_date', cr.end_date,
        'points_offered', cr.points_offered,
        'description', cr.description,
        'pet', jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'species', p.species,
          'breed', p.breed,
          'avatar_url', p.avatar_url,
          'notes', p.notes
        ),
        'owner', jsonb_build_object(
          'id', u.id,
          'full_name', nullif(trim(u.full_name), ''),
          'city', u.city
        )
      )
    ),
    '[]'::jsonb
  )
  into v_requests
  from public.care_requests cr
  join public.pets p on p.id = cr.pet_id
  join public.users u on u.id = cr.owner_id
  where cr.status = 'open'
    and cr.owner_id <> p_user_id
    and (
      p_search is null or trim(p_search) = '' or
      lower(coalesce(p.name, '')) like '%' || lower(trim(p_search)) || '%' or
      lower(coalesce(p.breed, '')) like '%' || lower(trim(p_search)) || '%' or
      lower(coalesce(u.city, '')) like '%' || lower(trim(p_search)) || '%'
    );

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'name', nullif(trim(u.full_name), ''),
        'avatar', u.avatar_url,
        'location', u.city,
        'rating', 0,
        'species', 'Pets',
        'distance', '0km',
        'status', 'available'
      )
    ),
    '[]'::jsonb
  )
  into v_takers
  from public.users u
  where u.id <> p_user_id
    and u.kyc_status = 'approved'
    and (p_filter in ('all', 'takers'));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'species', p.species,
        'breed', p.breed,
        'avatar_url', p.avatar_url,
        'notes', p.notes
      )
    ),
    '[]'::jsonb
  )
  into v_my_pets
  from public.pets p
  where p.owner_id = p_user_id;

  return jsonb_build_object(
    'requests', v_requests,
    'takers', v_takers,
    'my_pets', v_my_pets
  );
end;
$$;

grant execute on function public.get_home_feed(uuid, text, text) to authenticated;

-- MY CARE DASHBOARD ENDPOINT
create or replace function public.get_my_care_dashboard(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_care jsonb := null;
  v_care_given_rows jsonb := '[]'::jsonb;
  v_care_received_rows jsonb := '[]'::jsonb;
  v_liked_pets jsonb := '[]'::jsonb;
  v_stats jsonb := '{}'::jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  with active_contract as (
    select c.*
    from public.contracts c
    where (c.owner_id = p_user_id or c.taker_id = p_user_id)
      and c.status = 'active'
    order by c.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'contract_id', c.id,
    'request_id', c.request_id,
    'peer_id', case when c.owner_id = p_user_id then c.taker_id else c.owner_id end,
    'pet_name', p.name,
    'care_type', cr.care_type,
    'start_date', cr.start_date,
    'end_date', cr.end_date
  )
  into v_active_care
  from active_contract c
  left join public.care_requests cr on cr.id = c.request_id
  left join public.pets p on p.id = cr.pet_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'person_name', nullif(trim(u.full_name), ''),
        'person_avatar', u.avatar_url,
        'pet', p.name,
        'care_type', cr.care_type,
        'date', c.created_at
      )
    ),
    '[]'::jsonb
  )
  into v_care_given_rows
  from public.contracts c
  left join public.users u on u.id = c.owner_id
  left join public.care_requests cr on cr.id = c.request_id
  left join public.pets p on p.id = cr.pet_id
  where c.taker_id = p_user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'person_name', nullif(trim(u.full_name), ''),
        'person_avatar', u.avatar_url,
        'pet', p.name,
        'care_type', cr.care_type,
        'date', c.created_at
      )
    ),
    '[]'::jsonb
  )
  into v_care_received_rows
  from public.contracts c
  left join public.users u on u.id = c.taker_id
  left join public.care_requests cr on cr.id = c.request_id
  left join public.pets p on p.id = cr.pet_id
  where c.owner_id = p_user_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', cr.id,
        'request_id', cr.id,
        'pet_name', p.name,
        'pet_type', p.species,
        'breed', p.breed,
        'image_source', p.avatar_url,
        'bio', p.notes,
        'seeking_start', cr.start_date,
        'seeking_end', cr.end_date
      )
    ),
    '[]'::jsonb
  )
  into v_liked_pets
  from public.care_requests cr
  left join public.pets p on p.id = cr.pet_id
  where cr.status = 'open'
    and cr.owner_id <> p_user_id;

  select jsonb_build_object(
    'points', coalesce(u.points_balance, 0),
    'care_given', coalesce((select count(*) from public.contracts c where c.taker_id = p_user_id), 0),
    'care_received', coalesce((select count(*) from public.contracts c where c.owner_id = p_user_id), 0)
  )
  into v_stats
  from public.users u
  where u.id = p_user_id;

  return jsonb_build_object(
    'active_care', v_active_care,
    'care_given_rows', v_care_given_rows,
    'care_received_rows', v_care_received_rows,
    'liked_pets', v_liked_pets,
    'stats', coalesce(v_stats, '{}'::jsonb)
  );
end;
$$;

grant execute on function public.get_my_care_dashboard(uuid) to authenticated;

-- PROFILE BUNDLE ENDPOINT
create or replace function public.get_profile_bundle(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile jsonb := '{}'::jsonb;
  v_pets jsonb := '[]'::jsonb;
  v_availability jsonb := null;
  v_reviews jsonb := '[]'::jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'unauthorized';
  end if;

  select to_jsonb(u.*) into v_profile
  from public.users u
  where u.id = p_user_id;

  select coalesce(jsonb_agg(to_jsonb(p.*)), '[]'::jsonb)
  into v_pets
  from public.pets p
  where p.owner_id = p_user_id;

  select to_jsonb(tp.*)
  into v_availability
  from public.taker_profiles tp
  where tp.user_id = p_user_id
  limit 1;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'rating', r.rating,
        'comment', r.comment,
        'created_at', r.created_at,
        'reviewer', jsonb_build_object(
          'id', u.id,
          'full_name', nullif(trim(u.full_name), ''),
          'avatar_url', u.avatar_url
        )
      )
    ),
    '[]'::jsonb
  )
  into v_reviews
  from public.reviews r
  left join public.users u on u.id = r.reviewer_id
  where r.reviewee_id = p_user_id;

  return jsonb_build_object(
    'profile', coalesce(v_profile, '{}'::jsonb),
    'pets', v_pets,
    'availability', v_availability,
    'reviews', v_reviews
  );
end;
$$;

grant execute on function public.get_profile_bundle(uuid) to authenticated;
