-- App sends canonical keys via `careTypeForCareRequestDb` (sitting/walking/boarding/vacation).
-- Widen CHECK so legacy DBs that only allowed 3 values, or future direct API use, stay valid.

ALTER TABLE public.care_requests
  DROP CONSTRAINT IF EXISTS care_requests_care_type_check;

ALTER TABLE public.care_requests
  ADD CONSTRAINT care_requests_care_type_check CHECK (
    lower(trim(care_type)) IN (
      'sitting',
      'daytime',
      'day',
      'walking',
      'walk',
      'playwalk',
      'play_walk',
      'boarding',
      'overnight',
      'vacation',
      'trip'
    )
  );
