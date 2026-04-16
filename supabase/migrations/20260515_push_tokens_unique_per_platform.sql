-- Enforce at most one token per user per platform (iOS + Android max two rows).

-- Keep the newest row for each (user_id, platform), delete older duplicates.
WITH ranked AS (
  SELECT
    id,
    user_id,
    platform,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, platform
      ORDER BY created_at DESC, id DESC
    ) AS rn
  FROM public.push_tokens
)
DELETE FROM public.push_tokens pt
USING ranked r
WHERE pt.id = r.id
  AND r.rn > 1;

-- Old uniqueness was (user_id, token). Keep it if present? No: we need
-- one row per platform and token may rotate.
ALTER TABLE public.push_tokens
  DROP CONSTRAINT IF EXISTS push_tokens_user_token_unique;

ALTER TABLE public.push_tokens
  ADD CONSTRAINT push_tokens_user_platform_unique
  UNIQUE (user_id, platform);
