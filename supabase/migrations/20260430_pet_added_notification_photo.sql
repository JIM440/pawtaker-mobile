-- Include first gallery photo on pet_added notifications (owner + taker recipients).

CREATE OR REPLACE FUNCTION public.notify_pet_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_name text;
BEGIN
  SELECT COALESCE(u.full_name, 'A pet owner') INTO owner_name
  FROM public.users u
  WHERE u.id = NEW.owner_id;

  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  SELECT
    tp.user_id,
    'pet_added'::text,
    'New pet added'::text,
    FORMAT('%s added %s to PawTaker.', owner_name, NEW.name)::text,
    JSONB_STRIP_NULLS(
      JSONB_BUILD_OBJECT(
        'pet_id', NEW.id,
        'species', NEW.species,
        'photo_url',
        CASE
          WHEN NEW.photo_urls IS NOT NULL
            AND COALESCE(ARRAY_LENGTH(NEW.photo_urls, 1), 0) >= 1
          THEN NEW.photo_urls[1]
          ELSE NULL
        END
      )
    )::jsonb,
    false
  FROM public.taker_profiles tp
  WHERE COALESCE((tp.availability_json->>'available')::boolean, false) = true
    AND tp.accepted_species IS NOT NULL
    AND NEW.species = ANY(tp.accepted_species);

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_pet_added_owner_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES (
    NEW.owner_id,
    'pet_added'::text,
    'Pet added'::text,
    FORMAT('You added %s to your profile.', NEW.name)::text,
    JSONB_STRIP_NULLS(
      JSONB_BUILD_OBJECT(
        'pet_id', NEW.id,
        'species', NEW.species,
        'scope', 'self',
        'photo_url',
        CASE
          WHEN NEW.photo_urls IS NOT NULL
            AND COALESCE(ARRAY_LENGTH(NEW.photo_urls, 1), 0) >= 1
          THEN NEW.photo_urls[1]
          ELSE NULL
        END
      )
    )::jsonb,
    false
  );
  RETURN NEW;
END;
$$;
