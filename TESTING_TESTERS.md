# PawTaker Mobile — 14-Day Manual Testing Checklist (Testers)

This document is for **normal testers** who just use the app (no database checks needed).

For Google Play Console **closed testing** for newly created personal developer accounts:

- Must have at least 12 testers opted-in for the last 14 days continuously.
- Reference: [Play Console Help — App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)

---

## How to use

- ☐ = not tested
- ☑ = tested

Do Day 1 → Day 14 in order.

---

## Day 1 — Basic Setup (5 minutes)

- ☐ Create/login to an account
- ☐ Create a new pet profile
- ☐ Browse available care requests in Home
- ☐ Open a request and send a first chat message
- ☐ Confirm the app works smoothly (no crashes)

---

## Day 2 — Request + Application

- ☐ Post a new care request
- ☐ See your request appear in Home (after refresh)
- ☐ Open request details and make sure info looks correct
- ☐ Apply to a request

---

## Day 3 — Availability + Contract

- ☐ Complete your availability profile (as a taker)
- ☐ From a request, accept/send an offer
- ☐ Verify a contract appears in My Care
- ☐ Open the contract screen

---

## Day 4 — Check-in

- ☐ During an active contract, open My Care → Check-in
- ☐ Upload a photo and add a short note
- ☐ Submit check-in successfully

---

## Day 5 — Chat + Blocking

- ☐ Send text in chat
- ☐ Send an image or document in chat (if supported)
- ☐ Block a user from the chat menu (`...`)
- ☐ Confirm you no longer see them in relevant lists
- ☐ Unblock and confirm you see them again

---

## Day 6 — Reporting

- ☐ Report a user from the chat menu (`...`)
- ☐ Submit a report reason
- ☐ Report a pet request from its details / apply page

---

## Day 7 — Reviews

- ☐ When you have a completed contract, submit a review (stars + comment)
- ☐ Verify the review appears on the other person’s profile

---

## Day 8 — Notifications (Push)

- ☐ Confirm you receive push notifications
- ☐ Tap the notification and confirm it opens the correct screen
- ☐ When you get a chat message while the app is open, confirm behavior feels correct

---

## Day 9 — Home Search + Filters

- ☐ Use Home search and see matching results update
- ☐ Use filters for requests/takers
- ☐ Change distance if you have location enabled

---

## Day 10 — Location + Distance Display

- ☐ Update your city/zip in profile settings
- ☐ Refresh Home and confirm distance values update
- ☐ Confirm request cards and taker cards show location/distance clearly

---

## Day 11 — Public Profile Actions

- ☐ Open someone’s public profile from Home
- ☐ Open the `...` menu
- ☐ Confirm you can:
  - ☐ Send request
  - ☐ Open chat
  - ☐ Block/unblock
  - ☐ Report user

---

## Day 12 — Safety / Content Moderation

- ☐ Try entering disallowed text in pet profile fields (if you try this, expect a friendly block)
- ☐ Try uploading an image that contains explicit hints (expect a block)
- ☐ Confirm chat still allows sending normal text

---

## Day 13 — Contracts + Termination

- ☐ Open contract detail from My Care
- ☐ Test termination (if available)
- ☐ Confirm the contract state updates and My Care refreshes

---

## Day 14 — Final Checks

- ☐ Re-test any one or two things you previously found confusing
- ☐ Confirm the app still works end-to-end after a restart
- ☐ Confirm push + navigation still works after reinstall (if testers do reinstall)

