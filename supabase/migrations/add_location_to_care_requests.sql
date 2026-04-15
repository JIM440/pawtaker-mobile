-- Location snapshot on care_requests + users.zip_code + distance RPCs

ALTER TABLE care_requests
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS city text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS zip_code text;

UPDATE care_requests cr
SET
  latitude = u.latitude,
  longitude = u.longitude,
  city = u.city
FROM users u
WHERE cr.owner_id = u.id
  AND cr.latitude IS NULL
  AND u.latitude IS NOT NULL
  AND u.longitude IS NOT NULL;

DROP FUNCTION IF EXISTS public.search_nearby_requests(double precision, double precision, double precision, text);
DROP FUNCTION IF EXISTS public.search_nearby_requests(real, real, real, text);
DROP FUNCTION IF EXISTS public.search_nearby_requests(float, float, float, text);

CREATE OR REPLACE FUNCTION public.search_nearby_requests(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision,
  care_type_filter text DEFAULT NULL
)
RETURNS TABLE (
  request_id uuid,
  owner_id uuid,
  owner_name text,
  owner_avatar text,
  owner_city text,
  pet_id uuid,
  pet_name text,
  pet_species text,
  care_type text,
  start_date date,
  end_date date,
  points_offered integer,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS request_id,
    r.owner_id,
    u.full_name AS owner_name,
    u.avatar_url AS owner_avatar,
    COALESCE(r.city, u.city) AS owner_city,
    r.pet_id,
    p.name AS pet_name,
    p.species AS pet_species,
    r.care_type,
    r.start_date,
    r.end_date,
    r.points_offered,
    (6371 * acos(
      LEAST(1.0::double precision, cos(radians(user_lat)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(r.latitude)))
    )) AS distance_km
  FROM care_requests r
  JOIN users u ON u.id = r.owner_id
  JOIN pets p ON p.id = r.pet_id
  WHERE
    r.status = 'open'
    AND r.latitude IS NOT NULL
    AND r.longitude IS NOT NULL
    AND (care_type_filter IS NULL OR r.care_type = care_type_filter)
    AND (6371 * acos(
      LEAST(1.0::double precision, cos(radians(user_lat)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(r.latitude)))
    )) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

DROP FUNCTION IF EXISTS public.search_nearby_takers(double precision, double precision, double precision);
DROP FUNCTION IF EXISTS public.search_nearby_takers(real, real, real);
DROP FUNCTION IF EXISTS public.search_nearby_takers(float, float, float);

CREATE OR REPLACE FUNCTION public.search_nearby_takers(
  user_lat double precision,
  user_lng double precision,
  radius_km double precision
)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  city text,
  zip_code text,
  bio text,
  is_verified boolean,
  experience_years numeric,
  accepted_species text[],
  hourly_points integer,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tp.user_id,
    u.full_name,
    u.avatar_url,
    u.city,
    u.zip_code,
    u.bio,
    u.is_verified,
    tp.experience_years,
    tp.accepted_species,
    tp.hourly_points,
    (6371 * acos(
      LEAST(1.0::double precision, cos(radians(user_lat)) * cos(radians(u.latitude)) *
      cos(radians(u.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(u.latitude)))
    )) AS distance_km
  FROM taker_profiles tp
  JOIN users u ON u.id = tp.user_id
  WHERE
    u.kyc_status = 'approved'
    AND u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL
    AND (6371 * acos(
      LEAST(1.0::double precision, cos(radians(user_lat)) * cos(radians(u.latitude)) *
      cos(radians(u.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(u.latitude)))
    )) <= radius_km
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Batch distance from snapshotted request coordinates (server-side only; used by home feed)
CREATE OR REPLACE FUNCTION public.distances_for_requests(
  user_lat double precision,
  user_lng double precision,
  request_ids uuid[]
)
RETURNS TABLE (
  request_id uuid,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id AS request_id,
    (6371 * acos(
      LEAST(1.0::double precision, cos(radians(user_lat)) * cos(radians(r.latitude)) *
      cos(radians(r.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(r.latitude)))
    )) AS distance_km
  FROM care_requests r
  WHERE
    r.id = ANY(request_ids)
    AND r.latitude IS NOT NULL
    AND r.longitude IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION public.distances_for_users(
  user_lat double precision,
  user_lng double precision,
  user_ids uuid[]
)
RETURNS TABLE (
  user_id uuid,
  distance_km double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id AS user_id,
    (6371 * acos(
      LEAST(1.0::double precision, cos(radians(user_lat)) * cos(radians(u.latitude)) *
      cos(radians(u.longitude) - radians(user_lng)) +
      sin(radians(user_lat)) * sin(radians(u.latitude)))
    )) AS distance_km
  FROM users u
  WHERE
    u.id = ANY(user_ids)
    AND u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.search_nearby_requests(double precision, double precision, double precision, text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.search_nearby_takers(double precision, double precision, double precision) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.distances_for_requests(double precision, double precision, uuid[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.distances_for_users(double precision, double precision, uuid[]) TO authenticated, anon;
