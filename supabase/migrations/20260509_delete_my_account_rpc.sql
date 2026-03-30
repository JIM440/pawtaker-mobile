-- Full account purge for the currently authenticated user.
-- Deletes app data (pets, KYC, chats, contracts, notifications, etc.)
-- and finally removes both public.users and auth.users records.
-- Canonical delete path: remove legacy trigger-based auth deletion.

DROP TRIGGER IF EXISTS trg_delete_auth_user_on_user_delete ON public.users;
DROP FUNCTION IF EXISTS public.delete_auth_user_on_user_delete();

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Direct user-owned rows
  DELETE FROM public.push_tokens WHERE user_id = uid;
  DELETE FROM public.notifications WHERE user_id = uid;
  DELETE FROM public.emergency_contacts WHERE user_id = uid;
  DELETE FROM public.kyc_submissions WHERE user_id = uid;
  DELETE FROM public.taker_profiles WHERE user_id = uid;
  DELETE FROM public.point_transactions WHERE user_id = uid;

  -- User relations / moderation
  DELETE FROM public.user_blocks
  WHERE blocker_id = uid OR blocked_id = uid;

  DELETE FROM public.reports
  WHERE reporter_id = uid OR reported_user_id = uid;

  -- Pets + likes
  DELETE FROM public.pet_likes
  WHERE user_id = uid
     OR pet_id IN (SELECT id FROM public.pets WHERE owner_id = uid);

  -- Chat data
  DELETE FROM public.messages
  WHERE sender_id = uid
     OR thread_id IN (
       SELECT id
       FROM public.threads
       WHERE uid = ANY(participant_ids)
     );

  DELETE FROM public.threads
  WHERE uid = ANY(participant_ids);

  -- Care flow data
  DELETE FROM public.check_ins
  WHERE taker_id = uid
     OR contract_id IN (
       SELECT id
       FROM public.contracts
       WHERE owner_id = uid OR taker_id = uid
     );

  DELETE FROM public.reviews
  WHERE reviewer_id = uid OR reviewee_id = uid;

  DELETE FROM public.contracts
  WHERE owner_id = uid
     OR taker_id = uid
     OR request_id IN (
       SELECT id
       FROM public.care_requests
       WHERE owner_id = uid OR taker_id = uid
     );

  DELETE FROM public.care_requests
  WHERE owner_id = uid
     OR taker_id = uid
     OR pet_id IN (SELECT id FROM public.pets WHERE owner_id = uid);

  DELETE FROM public.pets WHERE owner_id = uid;

  -- Identity rows last
  DELETE FROM public.users WHERE id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;
