-- Keep contract completion notifications, but make termination copy explicit:
-- "<actor name> ended the agreement ..."
-- This updates the existing notify_contract_completed trigger function.

CREATE OR REPLACE FUNCTION public.notify_contract_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pts integer;
  v_req record;
  pet_name text;
  actor_name text;
  terminated_by_owner boolean;
  terminated_by_taker boolean;
  owner_before_start boolean;
  awarded_points integer;
  taker_body text;
  owner_body text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  SELECT cr.care_type, cr.start_date, cr.end_date, cr.pet_id
  INTO v_req
  FROM public.care_requests cr
  WHERE cr.id = NEW.request_id;

  IF NOT FOUND OR v_req.start_date IS NULL OR v_req.end_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(p.name, 'Pet') INTO pet_name
  FROM public.pets p
  WHERE p.id = v_req.pet_id;

  SELECT coalesce(u.full_name, 'A user') INTO actor_name
  FROM public.users u
  WHERE u.id = NEW.terminate_requested_by;

  terminated_by_owner := NEW.terminate_requested_by IS NOT NULL
    AND NEW.terminate_requested_by = NEW.owner_id;
  terminated_by_taker := NEW.terminate_requested_by IS NOT NULL
    AND NEW.terminate_requested_by = NEW.taker_id;
  owner_before_start := terminated_by_owner AND now()::date < v_req.start_date::date;

  v_pts := public.compute_care_points_for_request(
    v_req.care_type,
    v_req.start_date::date,
    v_req.end_date::date
  );

  awarded_points := CASE
    WHEN terminated_by_taker THEN 0
    WHEN owner_before_start THEN 0
    ELSE v_pts
  END;

  IF NEW.terminate_requested_by IS NOT NULL THEN
    IF awarded_points > 0 THEN
      taker_body := format('%s ended the agreement for %s. You earned %s points.', actor_name, pet_name, awarded_points);
      owner_body := format('%s ended the agreement for %s. %s points were recorded for this care.', actor_name, pet_name, awarded_points);
    ELSE
      taker_body := format('%s ended the agreement for %s. No points were awarded.', actor_name, pet_name);
      owner_body := format('%s ended the agreement for %s. No points were recorded.', actor_name, pet_name);
    END IF;
  ELSE
    taker_body := format('You earned %s points for caring for %s.', awarded_points, pet_name);
    owner_body := format('Your agreement for %s ended. %s points were recorded for this care.', pet_name, awarded_points);
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES
    (
      NEW.taker_id,
      'contract_completed'::text,
      'Care agreement completed'::text,
      taker_body::text,
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id,
        'pet_id', v_req.pet_id,
        'role', 'taker',
        'points', awarded_points
      )::jsonb,
      false
    ),
    (
      NEW.owner_id,
      'contract_completed'::text,
      'Care agreement completed'::text,
      owner_body::text,
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id,
        'pet_id', v_req.pet_id,
        'role', 'owner',
        'points', awarded_points
      )::jsonb,
      false
    );

  RETURN NEW;
END;
$$;

