-- Request copy lives on the pet (`pets.notes` bio + structured lines, `special_needs_description`).

ALTER TABLE public.care_requests
  DROP COLUMN IF EXISTS description;
