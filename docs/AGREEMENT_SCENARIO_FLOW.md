# Agreement Scenario Flow

## Goal

Define one consistent end-to-end care agreement flow across:

- Pet request application flow (taker applies to owner request)
- Send request flow (owner sends request to taker)
- Offer acceptance, agreement lifecycle, and review/report actions

Also ensure state consistency between feed, details, chat, contract, and notifications.

## Main Actors

- **Owner**: User who owns the pet/request.
- **Taker**: User who applies or receives a direct request.

## States

### Request state (`care_requests.status`)

- `open`: Can receive applications/offers.
- `accepted`: Agreement accepted and no longer open.
- `terminated`: Agreement ended before natural completion.

### Contract state (`contracts.status`)

- `draft`: Contract created but not fully signed.
- `signed`: One side signed.
- `active`: Both sides signed / live agreement.
- `completed`: Agreement ended (manual terminate or completion).

## Canonical Flow

1. Request is visible and actionable only while `open` and without an existing contract.
2. User opens chat / applies / sends request:
   - System reuses a single thread per user pair.
   - Request context is attached to that same thread (`request_id`) when available.
3. Owner/taker accepts offer:
   - Contract is created or reused.
   - Request moves to `accepted`.
   - Entry points stop accepting new applications.
4. During active agreement:
   - Header/actions expose `Rate & Review`, `Terminate`, `Report user`, `Block`.
5. On termination:
   - Irreversible confirmation modal.
   - Contract set to `completed`.
   - Request set to `terminated`.
6. Notifications deep-link to agreement/contract context.

## Routing Rules

- **View Offer Details** from message cards routes to:
  - Contract screen when request has a contract.
  - Request/offer details only when still open and eligible.
- **Rate & Review**:
  - Must include contract id and explicit review target user (`revieweeId`) to avoid rating the wrong user.

## Feed Visibility Rule

Requests must not appear in feed when:

- request status is not `open`, or
- a contract exists for the request.

Implementation uses both checks as a safety guard in case status data is stale.

## Approach Used

1. **Centralized guards**
   - Shared eligibility helper for request actionability.
2. **Single-thread policy**
   - Shared thread resolver reused across Go to Chat, Apply, and Send Request.
3. **Reusable detail screens**
   - Unified request/pet detail rendering to reduce UI drift.
4. **Lifecycle hardening**
   - Accept/terminate/report actions wired with modal confirmations and persistence.
5. **Navigation and notification consistency**
   - Added accepted/terminated deep-link handling.
6. **Localization completion**
   - Added missing EN/FR keys for new flow copy.

## Constraints and Decisions

- Existing database schema was preserved (reports table already existed).
- Existing thread model required backward-compatible behavior:
  - Reuse existing participant thread when present.
  - Attach request context without spawning duplicate threads.
- Some legacy/stale rows may still carry `open` status despite contract creation:
  - Feed includes a contract existence filter as a defensive gate.
- UI behavior had to stay aligned with current route structure and modal components.
- Avoided destructive data migrations in feature implementation path.

## QA Checklist (Scenario-Based)

- Owner accepts taker offer -> request disappears from feed.
- Taker can no longer apply after acceptance.
- Go to chat then apply does not create a second thread.
- Terminate shows irreversible modal and disables repeated terminate path.
- Report requires reason and inserts into `reports`.
- Rate & Review targets the correct user.
- Accepted/terminated notifications navigate to contract/agreement screen.
