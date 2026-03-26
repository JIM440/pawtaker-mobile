-- Gallery images for pets (carousel in feed); ordered URLs only (see later migration dropping legacy avatar_url).
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

UPDATE public.pets
SET photo_urls = ARRAY[avatar_url]::text[]
WHERE avatar_url IS NOT NULL
  AND cardinality(photo_urls) = 0;
