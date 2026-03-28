-- Yard type, age range, and energy level are stored on `pets` (and legacy `pets.notes` lines).
-- Pet-sourced fields removed from `care_requests`; scheduling uses dates/times on the row.

ALTER TABLE public.care_requests
  DROP COLUMN IF EXISTS yard_type,
  DROP COLUMN IF EXISTS age_range,
  DROP COLUMN IF EXISTS energy_level;
