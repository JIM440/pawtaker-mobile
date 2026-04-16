-- Points on contract completion depend on how the agreement ended:
--   • Scheduled end (request period over): caregiver earns full formula points.
--     Client clears terminate_requested_* when auto-completing (see complete-expired-contracts.ts).
--   • Early termination — pet owner requested: full points after both parties confirm
--     (terminate_requested_by = owner_id at completion).
--   • Early termination — caregiver requested: no point transfer
--     (terminate_requested_by = taker_id at completion).
--
-- See docs/contracts-termination-and-points.md

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
  rate integer;
  units integer;
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

  -- Termination-based rules:
  -- - Before service starts: owner can cancel freely (0 points).
  -- - After service starts:
  --    • Owner ends: caregiver gets full points.
  --    • Caregiver ends: 0 points (owner keeps / gets points back).
  IF NEW.terminate_requested_by IS NOT NULL THEN
    -- Caregiver ended at any time -> 0 points
    IF NEW.terminate_requested_by = NEW.taker_id THEN
      RETURN NEW;
    END IF;

    -- Owner ended before start date -> 0 points
    IF NEW.terminate_requested_by = NEW.owner_id
      AND now()::date < v_req.start_date::date THEN
      RETURN NEW;
    END IF;
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
