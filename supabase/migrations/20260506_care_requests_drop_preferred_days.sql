-- Scheduling is expressed by start_date / end_date / start_time / end_time only.

ALTER TABLE public.care_requests
  DROP COLUMN IF EXISTS preferred_days;
