-- Two-party agreement termination
-- Adds terminate_requested_by and terminate_requested_at to contracts.
-- Termination flow:
--   1. Party A requests → terminate_requested_by = A, status stays active/signed
--   2. Party A can cancel (reactivate) → terminate_requested_by = NULL
--   3. Party B confirms → status = 'completed' (terminate_requested_by stays as audit trail)
-- DB trigger fires in-app notifications for each state transition.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS terminate_requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS terminate_requested_at timestamptz;

-- Notify: termination_requested / termination_reactivated / termination_accepted
CREATE OR REPLACE FUNCTION public.notify_contract_termination_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name  text;
  v_other_id    uuid;
BEGIN
  -- Case 1: termination requested (NULL → value)
  IF OLD.terminate_requested_by IS NULL AND NEW.terminate_requested_by IS NOT NULL THEN
    v_other_id := CASE
      WHEN NEW.terminate_requested_by = NEW.owner_id THEN NEW.taker_id
      ELSE NEW.owner_id
    END;

    SELECT coalesce(u.full_name, 'Your partner') INTO v_actor_name
    FROM public.users u WHERE u.id = NEW.terminate_requested_by;

    INSERT INTO public.notifications (user_id, type, title, body, data, read)
    VALUES (
      v_other_id,
      'termination_requested',
      'Agreement termination requested',
      format('%s has requested to end the care agreement.', v_actor_name),
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id
      ),
      false
    );
    RETURN NEW;
  END IF;

  -- Case 2: reactivated — requester cancelled (value → NULL, status not completed)
  IF OLD.terminate_requested_by IS NOT NULL
    AND NEW.terminate_requested_by IS NULL
    AND NEW.status <> 'completed' THEN

    v_other_id := CASE
      WHEN OLD.terminate_requested_by = NEW.owner_id THEN NEW.taker_id
      ELSE NEW.owner_id
    END;

    SELECT coalesce(u.full_name, 'Your partner') INTO v_actor_name
    FROM public.users u WHERE u.id = OLD.terminate_requested_by;

    INSERT INTO public.notifications (user_id, type, title, body, data, read)
    VALUES (
      v_other_id,
      'termination_reactivated',
      'Agreement reactivated',
      format('%s cancelled the termination request.', v_actor_name),
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id
      ),
      false
    );
    RETURN NEW;
  END IF;

  -- Case 3: other party confirmed — status → completed while terminate_requested_by was set
  IF NEW.status = 'completed'
    AND OLD.status IS DISTINCT FROM 'completed'
    AND OLD.terminate_requested_by IS NOT NULL THEN

    INSERT INTO public.notifications (user_id, type, title, body, data, read)
    VALUES (
      OLD.terminate_requested_by,
      'termination_accepted',
      'Agreement terminated',
      'The other party confirmed the termination.',
      jsonb_build_object(
        'contract_id', NEW.id,
        'request_id', NEW.request_id
      ),
      false
    );
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_contract_termination ON public.contracts;
CREATE TRIGGER trg_notify_contract_termination
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_contract_termination_events();
