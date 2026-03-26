-- Gallery images for pets (carousel in feed, etc.). `avatar_url` remains the cover / first image.
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';

UPDATE public.pets
SET photo_urls = ARRAY[avatar_url]::text[]
WHERE avatar_url IS NOT NULL
  AND cardinality(photo_urls) = 0;
