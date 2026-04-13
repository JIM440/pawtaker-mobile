-- Termination is now single-party (no mutual acceptance).
-- We keep the terminate_requested_by / terminate_requested_at columns for audit + points logic,
-- but we remove the two-party termination notification trigger which no longer applies.

DROP TRIGGER IF EXISTS trg_notify_contract_termination ON public.contracts;
DROP FUNCTION IF EXISTS public.notify_contract_termination_events();

