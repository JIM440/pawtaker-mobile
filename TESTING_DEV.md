# PawTaker Mobile — 14-Day Manual Testing Checklist (Developers)

For Google Play Console **closed testing** requirements for newly created personal developer accounts.

- Must have **at least 12 testers** opted-in for the **last 14 days continuously**.
- Reference: [Play Console Help — App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)

### How to use

Use the square checkbox style below:

- ☐ = not tested
- ☑ = tested

Do Day 1 → Day 14 in order.

---

## Day 1 — Basic Flow

- ☐ Create/login to an account (external test account)
- ☐ Create pet profile (photos + notes)
- ☐ Browse care requests in Home
- ☐ Open a request and start chat
- ☐ Confirm navigation + no crashes

---

## Day 2 — Requests + Offers

- ☐ Post a new care request (future start date)
- ☐ Verify request appears in Home after refresh
- ☐ Open request details and verify fields (care type, dates/times, points)
- ☐ Apply to request and confirm message/proposal appears

---

## Day 3 — Availability + Contract Discovery

- ☐ Complete availability profile (taker)
- ☐ Send an offer from request detail → offer screen
- ☐ Owner accepts offer and contract appears in My Care
- ☐ Open contract detail and validate core metadata

---

## Day 4 — Check-ins + Attachments

- ☐ During active contract, open My Care → Check-in
- ☐ Upload photo + short note and submit
- ☐ Attempt blocked explicit image-like hints and confirm prevention
- ☐ Confirm allowed uploads still succeed

---

## Day 5 — Messaging + Blocks + Moderation (Chat)

- ☐ Send text message in chat
- ☐ Send image/video/document attachment in chat
- ☐ Verify explicit text is allowed in chat (no text restriction)
- ☐ Delete your own message (soft-delete)
- ☐ Block a user from chat actions menu (`...`)
- ☐ Confirm blocked user/taker disappear from Home and chat actions are disabled as expected
- ☐ Unblock and confirm visibility returns

---

## Day 6 — Reporting (User + Request)

- ☐ Report a user from chat actions menu (`...`)
- ☐ Confirm report modal is consistent with block modal style + char limit
- ☐ Verify `reports` row inserted with expected `reason` + `details`
- ☐ Report pet request from request/apply pages
- ☐ Verify correct `reports` insertion payload

---

## Day 7 — Reviews Flow

- ☐ Submit review after contract completion (rating + comment)
- ☐ Verify review appears on public profile → Reviews
- ☐ Trigger review navigation from deep link (if available)
- ☐ Try invalid review submit paths and confirm friendly validation

---

## Day 8 — Notifications (In-app + Push)

- ☐ Confirm push token registration inserts/updates `push_tokens`
- ☐ Trigger a non-message notification type and verify in-app toast
- ☐ Trigger message-type notification and confirm it does NOT show foreground in-app toast
- ☐ Confirm push arrives on device
- ☐ Tap push and confirm deep link navigation

---

## Day 9 — Home Search + Filters

- ☐ Search on Home and verify results include BOTH takers and requests (while typing)
- ☐ Apply care-type filters and verify both lists update correctly
- ☐ Apply distance slider and verify it filters correctly when coordinates exist
- ☐ Verify cleared search restores expected feed

---

## Day 10 — Location/Distance Consistency

- ☐ Update profile city/zip and confirm latitude/longitude update (or backfill)
- ☐ Verify request-card distance/location uses request snapshot AFTER start date; BEFORE start date uses owner location
- ☐ Verify card distance displays consistently (no “0.0 km” unless same-town fallback applies)
- ☐ Confirm distance does not disappear in cards but remains visible near location

---

## Day 11 — Profile + Actions Menus

- ☐ Open public profile from Home
- ☐ Use profile `...` menu and confirm actions:
  - ☐ Send request
  - ☐ Open chat
  - ☐ Block/unblock
  - ☐ Report user
- ☐ Verify modal behaviors and character limits

---

## Day 12 — Content Moderation (Text + Image Hints)

- ☐ Try explicit text in pet bio/special needs and confirm it is blocked
- ☐ Try explicit hint filenames/URIs in pet add/edit and confirm it is blocked
- ☐ Confirm chat explicit text still sends
- ☐ Confirm chat attachment explicit hints are blocked

---

## Day 13 — Contract + Termination Edge Cases

- ☐ Open contract detail for both owner + taker views
- ☐ Terminate before start date and verify UI messaging
- ☐ Terminate after start date and verify contract completion + My Care state
- ☐ Confirm action menus update with realtime contract row updates

---

## Day 14 — Regression Sweep

- ☐ Re-run at least one item from Days 1–13 per major area:
  - ☐ Auth/KYC
  - ☐ Home feed/search
  - ☐ Requests/offers/contracts
  - ☐ Chat blocks/reports
  - ☐ Push delivery
  - ☐ Reviews/check-ins
- ☐ Confirm no broken routes for:
  - ☐ `/(private)/contract/[id]`
  - ☐ `/(private)/review/[id]`
- ☐ Final sanity: app install → login → key flows → exit

