-- Four canonical care types: daytime, playwalk, overnight, vacation.
-- Normalize legacy labels, then enforce CHECK. Points function uses the same four.

UPDATE public.care_requests
SET care_type = 'daytime'
WHERE lower(trim(care_type)) IN ('sitting', 'day');

UPDATE public.care_requests
SET care_type = 'playwalk'
WHERE lower(trim(care_type)) IN ('walking', 'walk', 'play_walk');

UPDATE public.care_requests
SET care_type = 'overnight'
WHERE lower(trim(care_type)) IN ('boarding');

UPDATE public.care_requests
SET care_type = 'vacation'
WHERE lower(trim(care_type)) IN ('trip');

ALTER TABLE public.care_requests
  DROP CONSTRAINT IF EXISTS care_requests_care_type_check;

ALTER TABLE public.care_requests
  ADD CONSTRAINT care_requests_care_type_check CHECK (
    lower(trim(care_type)) IN (
      'daytime',
      'playwalk',
      'overnight',
      'vacation'
    )
  );

CREATE OR REPLACE FUNCTION public.compute_care_points_for_request(
  p_care_type text,
  p_start date,
  p_end date
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  inc integer;
  k text;
  units integer;
  rate integer;
BEGIN
  IF p_start IS NULL OR p_end IS NULL THEN
    RETURN 1;
  END IF;

  inc := (p_end::date - p_start::date) + 1;
  IF inc < 1 THEN
    inc := 1;
  END IF;

  k := lower(trim(coalesce(p_care_type, '')));

  IF k = 'playwalk' THEN
    rate := 1;
    units := inc;
  ELSIF k = 'overnight' THEN
    rate := 4;
    units := GREATEST(1, inc - 1);
  ELSIF k = 'vacation' THEN
    rate := 5;
    units := inc;
  ELSIF k = 'daytime' THEN
    rate := 2;
    units := inc;
  ELSE
    rate := 2;
    units := inc;
  END IF;

  RETURN GREATEST(1, units * rate);
END;
$$;
