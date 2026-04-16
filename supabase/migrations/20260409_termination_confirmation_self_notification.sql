-- Two-party termination: also notify the confirming party when they complete termination.

CREATE OR REPLACE FUNCTION public.notify_contract_termination_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_name  text;
  v_other_id    uuid;
  v_confirmer_id uuid;
BEGIN
  -- Case 1: termination requested (NULL -> value)
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

  -- Case 2: requester cancelled their own pending termination
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

  -- Case 3: other party confirmed -> requester gets accepted, confirmer gets confirmation
  IF NEW.status = 'completed'
    AND OLD.status IS DISTINCT FROM 'completed'
    AND OLD.terminate_requested_by IS NOT NULL THEN

    v_confirmer_id := CASE
      WHEN OLD.terminate_requested_by = NEW.owner_id THEN NEW.taker_id
      ELSE NEW.owner_id
    END;

    INSERT INTO public.notifications (user_id, type, title, body, data, read)
    VALUES
      (
        OLD.terminate_requested_by,
        'termination_accepted',
        'Agreement terminated',
        'The other party confirmed the termination.',
        jsonb_build_object(
          'contract_id', NEW.id,
          'request_id', NEW.request_id
        ),
        false
      ),
      (
        v_confirmer_id,
        'termination_confirmed',
        'Agreement terminated',
        'You confirmed the termination.',
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
