CREATE UNIQUE INDEX IF NOT EXISTS contracts_request_id_unique
  ON public.contracts (request_id);

CREATE OR REPLACE FUNCTION public.accept_care_request(
  p_request_id uuid,
  p_owner_id uuid,
  p_taker_id uuid
)
RETURNS TABLE(
  contract_id uuid,
  accepted boolean,
  accepted_taker_id uuid,
  request_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.care_requests%ROWTYPE;
  v_contract_id uuid;
  v_contract_taker_id uuid;
BEGIN
  SELECT *
  INTO v_request
  FROM public.care_requests
  WHERE id = p_request_id
    AND owner_id = p_owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Care request not found';
  END IF;

  IF v_request.status <> 'open' THEN
    SELECT c.id, c.taker_id
    INTO v_contract_id, v_contract_taker_id
    FROM public.contracts c
    WHERE c.request_id = p_request_id
    LIMIT 1;

    RETURN QUERY
    SELECT
      v_contract_id,
      FALSE,
      COALESCE(v_contract_taker_id, v_request.taker_id),
      v_request.status;
    RETURN;
  END IF;

  UPDATE public.care_requests
  SET status = 'accepted',
      taker_id = p_taker_id
  WHERE id = p_request_id
    AND owner_id = p_owner_id;

  INSERT INTO public.contracts (
    request_id,
    owner_id,
    taker_id,
    signed_owner,
    signed_taker,
    status
  )
  VALUES (
    p_request_id,
    p_owner_id,
    p_taker_id,
    FALSE,
    FALSE,
    'draft'
  )
  ON CONFLICT (request_id) DO NOTHING
  RETURNING id, taker_id
  INTO v_contract_id, v_contract_taker_id;

  IF v_contract_id IS NULL THEN
    SELECT c.id, c.taker_id
    INTO v_contract_id, v_contract_taker_id
    FROM public.contracts c
    WHERE c.request_id = p_request_id
    LIMIT 1;
  END IF;

  IF v_contract_taker_id IS DISTINCT FROM p_taker_id THEN
    UPDATE public.care_requests
    SET status = 'accepted',
        taker_id = v_contract_taker_id
    WHERE id = p_request_id;

    RETURN QUERY
    SELECT
      v_contract_id,
      FALSE,
      v_contract_taker_id,
      'accepted'::text;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_contract_id,
    TRUE,
    p_taker_id,
    'accepted'::text;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_care_request(uuid, uuid, uuid) TO authenticated;
