-- Ensure termination audit columns exist before triggers reference NEW.terminate_requested_*.
-- Fixes: migration order had 20260416–20260419 (functions using terminate_requested_by) lexically
-- before 20260512 (ADD COLUMN). Remote DBs that applied the April migrations but not May 20260512
-- hit PostgreSQL 42703: "record new has no field terminate_requested_by" on contract completion.

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS terminate_requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS terminate_requested_at timestamptz;
