-- Point system: on contract completion, compute points from linked care_request
-- (care_type + date span) and update taker / owner balances + point_transactions.
-- Formula (matches app `src/lib/points/carePoints.ts`):
--   pts = duration_units × rate
--   playwalk: rate 1, units = inclusive calendar days
--   daytime: rate 2, units = inclusive calendar days
--   overnight: rate 4, units = max(1, inclusive_days - 1) nights
--   vacation: rate 5, units = inclusive calendar days

UPDATE public.care_requests
SET care_type = CASE lower(trim(care_type))
  WHEN 'walking' THEN 'playwalk'
  WHEN 'sitting' THEN 'daytime'
  WHEN 'boarding' THEN 'overnight'
  ELSE care_type
END
WHERE lower(trim(care_type)) IN ('walking', 'sitting', 'boarding');

CREATE OR REPLACE FUNCTION public.trg_apply_contract_completion_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pts integer;
  v_req record;
  k text;
  inc integer;
  units integer;
  rate integer;
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

  inc := (v_req.end_date::date - v_req.start_date::date) + 1;
  IF inc < 1 THEN
    inc := 1;
  END IF;

  k := lower(trim(coalesce(v_req.care_type, '')));

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

  v_pts := GREATEST(1, units * rate);

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

DROP TRIGGER IF EXISTS contracts_apply_points_after_complete ON public.contracts;

CREATE TRIGGER contracts_apply_points_after_complete
  AFTER INSERT OR UPDATE OF status ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_apply_contract_completion_points();
