-- In-app confirmations for the acting user: pet added, care request posted, availability profile saved.

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
    format('You added %s to your profile.', NEW.name)::text,
    jsonb_build_object(
      'pet_id', NEW.id,
      'species', NEW.species,
      'scope', 'self'
    )::jsonb,
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_pet_owner_added ON public.pets;

CREATE TRIGGER trg_notify_pet_owner_added
  AFTER INSERT ON public.pets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_pet_added_owner_confirmation();

CREATE OR REPLACE FUNCTION public.notify_care_request_owner_confirmation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES (
    NEW.owner_id,
    'care_request_posted'::text,
    'Care request posted'::text,
    'Your care request is live. Takers can see it in the feed.'::text,
    jsonb_build_object(
      'request_id', NEW.id,
      'pet_id', NEW.pet_id
    )::jsonb,
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_care_request_owner ON public.care_requests;

CREATE TRIGGER trg_notify_care_request_owner
  AFTER INSERT ON public.care_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_care_request_owner_confirmation();

CREATE OR REPLACE FUNCTION public.notify_taker_profile_saved_self()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.availability_json IS NOT DISTINCT FROM NEW.availability_json
      AND OLD.accepted_species IS NOT DISTINCT FROM NEW.accepted_species
    THEN
      RETURN NEW;
    END IF;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES (
    NEW.user_id,
    'availability_saved'::text,
    'Availability saved'::text,
    'Your availability profile has been updated.'::text,
    jsonb_build_object('user_id', NEW.user_id)::jsonb,
    false
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_taker_profile_saved_self ON public.taker_profiles;

CREATE TRIGGER trg_notify_taker_profile_saved_self
  AFTER INSERT OR UPDATE ON public.taker_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_taker_profile_saved_self();
