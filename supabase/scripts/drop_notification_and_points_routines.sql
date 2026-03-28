-- =============================================================================
-- PawTaker — DROP notification + contract points routines (triggers + functions)
-- =============================================================================
-- Use this when you need to tear down and recreate DB logic without dropping
-- data tables (`notifications`, `contracts`, `users`, etc.).
--
-- AFTER running this script, recreate objects by applying migrations in order
-- (see comments at bottom) or paste the contents of each migration file.
--
-- NEVER run this on production without a backup and a plan to re-apply migrations.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Triggers first (they reference functions)
-- -----------------------------------------------------------------------------

DROP TRIGGER IF EXISTS contracts_notify_completed ON public.contracts;
DROP TRIGGER IF EXISTS contracts_apply_points_after_complete ON public.contracts;

DROP TRIGGER IF EXISTS trg_notify_pet_added ON public.pets;
DROP TRIGGER IF EXISTS trg_notify_availability_posted ON public.taker_profiles;
DROP TRIGGER IF EXISTS trg_notify_review_received ON public.reviews;
DROP TRIGGER IF EXISTS trg_notify_message_event ON public.messages;
DROP TRIGGER IF EXISTS trg_notify_kyc_rejected ON public.users;

-- -----------------------------------------------------------------------------
-- 2) Functions (order: dependents before compute_care_points_for_request)
-- -----------------------------------------------------------------------------

-- Depends on compute_care_points_for_request
DROP FUNCTION IF EXISTS public.trg_apply_contract_completion_points();
DROP FUNCTION IF EXISTS public.notify_contract_completed();

DROP FUNCTION IF EXISTS public.compute_care_points_for_request(text, date, date);

-- Standalone notify_* (no compute_care_points dependency)
DROP FUNCTION IF EXISTS public.notify_pet_added();
DROP FUNCTION IF EXISTS public.notify_availability_posted();
DROP FUNCTION IF EXISTS public.notify_review_received();
DROP FUNCTION IF EXISTS public.notify_message_event();
DROP FUNCTION IF EXISTS public.notify_kyc_rejected();

-- =============================================================================
-- RECREATE — run migrations in this exact order (filename sort = chronological):
-- =============================================================================
--   1. 20260324_add_app_endpoints.sql
--   2. 20260325_notifications_triggers.sql
--   3. 20260326_notify_message_copy.sql      -- replaces notify_message_event body
--   4. 20260326_user_blocks.sql
--   5. 20260327_grant_api_roles_public_schema.sql
--   6. 20260328_pets_photo_urls.sql
--   7. 20260329_drop_pets_avatar_url.sql
--   8. 20260330_contract_completion_points.sql
--   9. 20260331_pet_likes.sql
--  10. 20260402_points_formula_and_notifications.sql
--
-- CLI (local dev, wipes DB and reapplies ALL migrations from scratch):
--   supabase db reset
--
-- Or: paste each migration file into Supabase SQL Editor in the same order.
-- =============================================================================

-- =============================================================================
-- RUNTIME — you do NOT call these functions manually in production.
-- PostgreSQL runs them automatically when rows change:
--   • notify_* / trg_*  → AFTER INSERT/UPDATE on the matching table
--   • Order among triggers on the SAME table is not guaranteed; avoid
--     cross-trigger assumptions (both fire in the same transaction).
--
-- Optional manual test (after migrations are applied):
--   SELECT public.compute_care_points_for_request(
--     'daytime',
--     '2025-01-01'::date,
--     '2025-01-03'::date
--   );
-- =============================================================================
