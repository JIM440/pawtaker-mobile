-- Structured owner preferences for a care request (no longer only in `description`).

ALTER TABLE public.care_requests
  ADD COLUMN IF NOT EXISTS yard_type text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS energy_level text,
  ADD COLUMN IF NOT EXISTS preferred_days text[];

COMMENT ON COLUMN public.care_requests.yard_type IS 'Owner preference from launch wizard (e.g. fenced yard).';
COMMENT ON COLUMN public.care_requests.age_range IS 'Preferred pet age range label from launch wizard.';
COMMENT ON COLUMN public.care_requests.energy_level IS 'Preferred energy level label from launch wizard.';
COMMENT ON COLUMN public.care_requests.preferred_days IS 'Weekday labels e.g. Sa, Su from launch wizard.';
