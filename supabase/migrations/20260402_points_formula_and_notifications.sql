-- Point formula (single source of truth for DB; matches `src/lib/points/carePoints.ts`):
--   Points for one completed agreement = duration_units(care_type) × rate(care_type)
--   Play/Walk:  rate 1 pt — units = inclusive calendar days (1 session per day in range)
--   Daytime:    rate 2 pts — units = inclusive calendar days (1 per day)
--   Overnight:  rate 4 pts — units = max(1, inclusive_days − 1) nights
--   Vacation:   rate 5 pts — units = inclusive calendar days (1 per day)
-- Ledger:
--   taker:  +pts (care_given),  owner: −pts (care_received)
--   User balance trend = care given − care received (same as `points_balance` updates).

CREATE OR REPLACE FUNCTION public.compute_care_points_for_request(
  p_care_type text,
  p_start date,
  p_end date
)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  inc integer;
  k text;
  units integer;
  rate integer;
BEGIN
  IF p_start IS NULL OR p_end IS NULL THEN
    RETURN 1;
  END IF;

  inc := (p_end::date - p_start::date) + 1;
  IF inc < 1 THEN
    inc := 1;
  END IF;

  k := lower(trim(coalesce(p_care_type, '')));

  IF k IN ('walking', 'walk', 'playwalk', 'play_walk') THEN
    rate := 1;
    units := inc;
  ELSIF k IN ('boarding', 'overnight') THEN
    rate := 4;
    units := GREATEST(1, inc - 1);
  ELSIF k IN ('vacation', 'trip') THEN
    rate := 5;
    units := inc;
  ELSIF k IN ('sitting', 'daytime', 'day') THEN
    rate := 2;
    units := inc;
  ELSE
    rate := 2;
    units := inc;
  END IF;

  RETURN GREATEST(1, units * rate);
END;
$$;

-- Refactor points trigger to use shared formula (keeps parity with app TS).
CREATE OR REPLACE FUNCTION public.trg_apply_contract_completion_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pts integer;
  v_req record;
BEGIN
  IF NEW.status IS DISTINCT FROM 'completed' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = 'completed' THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.point_transactions pt
    WHERE pt.contract_id = NEW.id
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  SELECT cr.care_type, cr.start_date, cr.end_date
  INTO v_req
  FROM public.care_requests cr
  WHERE cr.id = NEW.request_id;

  IF NOT FOUND OR v_req.start_date IS NULL OR v_req.end_date IS NULL THEN
    RETURN NEW;
  END IF;

  v_pts := public.compute_care_points_for_request(
    v_req.care_type,
    v_req.start_date::date,
    v_req.end_date::date
  );

  INSERT INTO public.point_transactions (user_id, amount, type, description, contract_id)
  VALUES
    (NEW.taker_id, v_pts, 'care_given', 'Care completed (points earned)', NEW.id),
    (NEW.owner_id, -v_pts, 'care_received', 'Care completed (points for care received)', NEW.id);

  UPDATE public.users u
  SET
    points_balance = u.points_balance + v_pts,
    care_given_count = u.care_given_count + 1,
    points_alltime_high = GREATEST(COALESCE(u.points_alltime_high, 0), u.points_balance + v_pts)
  WHERE u.id = NEW.taker_id;

  UPDATE public.users u
  SET
    points_balance = u.points_balance - v_pts,
    care_received_count = u.care_received_count + 1
  WHERE u.id = NEW.owner_id;

  RETURN NEW;
END;
$$;

-- In-app notifications when a contract is completed (termination / end of care).
-- Push: hook Database Webhook on `public.notifications` INSERT → Edge Function → Expo.
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

  v_pts := public.compute_care_points_for_request(
    v_req.care_type,
    v_req.start_date::date,
    v_req.end_date::date
  );

  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES
    (
      NEW.taker_id,
      'contract_completed'::text,
      'Care agreement completed'::text,
      format('You earned %s points for caring for %s.', v_pts, pet_name)::text,
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id,
        'pet_id', v_req.pet_id,
        'role', 'taker',
        'points', v_pts
      )::jsonb,
      false
    ),
    (
      NEW.owner_id,
      'contract_completed'::text,
      'Care agreement completed'::text,
      format('Your agreement for %s ended. %s points were recorded for this care.', pet_name, v_pts)::text,
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id,
        'pet_id', v_req.pet_id,
        'role', 'owner',
        'points', v_pts
      )::jsonb,
      false
    );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contracts_notify_completed ON public.contracts;

CREATE TRIGGER contracts_notify_completed
  AFTER INSERT OR UPDATE OF status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contract_completed();

-- Reviews: notify reviewee (rating received) + reviewer (confirmation). Push via same webhook.
CREATE OR REPLACE FUNCTION public.notify_review_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  reviewer_name text;
  reviewee_name text;
  r text;
BEGIN
  SELECT coalesce(u.full_name, 'Someone') INTO reviewer_name
  FROM public.users u
  WHERE u.id = NEW.reviewer_id;

  SELECT coalesce(u.full_name, 'Someone') INTO reviewee_name
  FROM public.users u
  WHERE u.id = NEW.reviewee_id;

  r := round(NEW.rating::numeric, 1)::text;

  INSERT INTO public.notifications (user_id, type, title, body, data, read)
  VALUES
    (
      NEW.reviewee_id,
      'review_received'::text,
      format('New rating — %s stars', r)::text,
      format('%s rated you %s out of 5.', reviewer_name, r)::text,
      jsonb_build_object(
        'review_id', NEW.id,
        'rating', NEW.rating,
        'reviewer_id', NEW.reviewer_id,
        'contract_id', NEW.contract_id
      )::jsonb,
      false
    ),
    (
      NEW.reviewer_id,
      'review_submitted'::text,
      'Rating posted'::text,
      format('You rated %s %s out of 5.', reviewee_name, r)::text,
      jsonb_build_object(
        'review_id', NEW.id,
        'rating', NEW.rating,
        'reviewee_id', NEW.reviewee_id,
        'contract_id', NEW.contract_id
      )::jsonb,
      false
    );

  RETURN NEW;
END;
$$;
