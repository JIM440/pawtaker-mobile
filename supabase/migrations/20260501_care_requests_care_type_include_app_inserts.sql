-- Mobile app inserts legacy DB labels via careTypeForCareRequestDb:
-- daytime → sitting, playwalk → walking, overnight → boarding, vacation → vacation.
-- If 20260428 was applied without sitting/walking, inserts failed the CHECK.

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
