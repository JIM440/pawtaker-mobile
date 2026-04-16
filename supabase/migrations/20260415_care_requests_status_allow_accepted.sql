-- accept_care_request sets care_requests.status = 'accepted'.
-- Older DBs may still have care_requests_status_check allowing only e.g. 'open'.

ALTER TABLE public.care_requests
  DROP CONSTRAINT IF EXISTS care_requests_status_check;

-- If your project used a different constraint name, drop it manually, e.g.:
-- ALTER TABLE public.care_requests DROP CONSTRAINT IF EXISTS your_status_check_name;
