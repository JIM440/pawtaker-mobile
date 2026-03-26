-- Pets: single source of truth for images is `photo_urls` (ordered). Legacy `avatar_url` removed.
UPDATE public.pets
SET photo_urls = ARRAY[avatar_url]::text[]
WHERE avatar_url IS NOT NULL
  AND cardinality(photo_urls) = 0;

ALTER TABLE public.pets
DROP COLUMN IF EXISTS avatar_url;
