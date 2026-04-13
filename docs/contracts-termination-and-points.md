# Care agreements: end dates, termination, and points

This document describes product rules implemented in the database trigger `trg_apply_contract_completion_points` (see `supabase/migrations/20260330_contract_completion_points.sql` and `20260416_contract_completion_points_by_termination.sql`) and in `completeExpiredContractsForUser` (`src/lib/contracts/complete-expired-contracts.ts`).

## Single-party termination

Ending an agreement early uses `contracts.terminate_requested_by` / `terminate_requested_at` (added in `20260512_contracts_two_party_termination.sql`, but the two-party notification trigger is removed in `20260417_remove_two_party_termination_notifications.sql`).

When a user ends an agreement, the app immediately sets:

- `contracts.status = 'completed'`
- `contracts.terminate_requested_by = <actor_user_id>`
- `contracts.terminate_requested_at = now()`

There is **no mutual acceptance** step.

## Points when `status` becomes `completed`

| How the agreement ended | `terminate_requested_by` at completion | Points |
|-------------------------|----------------------------------------|--------|
| Scheduled end date reached (automatic completion) | `NULL` (client clears termination fields when auto-completing) | Caregiver earns full formula points. Owner is **not** debited. |
| Owner ends **before** service starts (`now < start_date`) | Owner’s user id | **0 points** (no point transfer). |
| Owner ends **after** service starts (`now >= start_date`) | Owner’s user id | Caregiver earns full formula points. Owner is **not** debited. |
| Caregiver ends at any time | Caregiver’s user id | **0 points** (no point transfer; owner keeps/gets points back). |

Natural expiry always clears `terminate_requested_by` in the same update as `status = 'completed'`, so the trigger treats it like a normal completion with full points—even if a termination had been requested earlier.

## Related UI

The contract screen (`app/(private)/(tabs)/my-care/contract/[id].tsx`) surfaces the termination confirmation modal. Copy for the termination rules lives under `myCare.contract.*` in locale files and is reused in booking confirmation.

## Termination notifications

When a contract is ended by a user, notifications include the actor's name:

- "`<Name>` ended the agreement for `<Pet>`..."
- If points are awarded, the message includes the awarded amount.
- If points are not awarded (owner before start date, or taker-initiated end), the message explicitly says no points were awarded/recorded.

This behavior is implemented in `supabase/migrations/20260419_caregiver_only_points.sql` by overriding `notify_contract_completed()` and `trg_apply_contract_completion_points()`.
