# PawTaker — notifications & push (step-by-step)

This guide mirrors what worked in **`notifications-and-push.md`** (Digital Caretaker): **Expo token → `push_tokens`**, **Database Webhooks → Supabase Edge Functions → Expo Push API** (`EXPO_ACCESS_TOKEN`). It is adapted to **PawTaker**’s schema and routes.

**Your DB check:** `SELECT public.compute_care_points_for_request('daytime', '2025-01-01'::date, '2025-01-03'::date);` → **6** is correct (2 pts × 3 days).

---

## How PawTaker differs from the other project

| Topic | Digital Caretaker | PawTaker |
| ----- | ------------------- | -------- |
| In-app rows | Sometimes inserted **inside** Edge Functions | Mostly created by **Postgres triggers** (`supabase/migrations/20260325_*`, `20260402_*`) into `public.notifications` |
| Messages | Push only, **no** `notifications` row | Same intent: chat can stay **push-only**; triggers may still insert `type = 'chat'` — align product + either remove chat rows in SQL or filter in Edge |
| `push_tokens` | `onConflict: "user_id, token"` | Types use `id`, `user_id`, `token`, `platform` — add a **unique constraint** `(user_id, token)` in a migration if you use upsert like the other app |
| EAS `projectId` | Required for reliable token | Already in **`app.json`** → `extra.eas.projectId` |

---

## Phase 1 — Dependencies & Expo config

1. Install client packages: `expo-notifications` (and `expo-device` if you gate on physical device like the other project).
2. Add the plugin to **`app.json`** / **`app.config`** per [Expo Notifications](https://docs.expo.dev/push-notifications/push-notifications-setup/) for your SDK (iOS capabilities, Android default channel).
3. Confirm **`extra.eas.projectId`** stays set (you have `d925eae7-c43a-4cc9-bb9b-aa658252ad7a`) — use it in `getExpoPushTokenAsync({ projectId })`.

---

## Phase 2 — Database (`push_tokens` + RLS)

1. If **`push_tokens`** is not in migrations yet, add a migration that:
   - Creates `public.push_tokens` with at least: `id uuid PK default gen_random_uuid()`, `user_id uuid references users(id) on delete cascade`, `token text not null`, `platform text`, `created_at timestamptz default now()`.
   - Adds **`unique (user_id, token)`** so `upsert(..., { onConflict: 'user_id,token' })` matches your other app.
2. **RLS:** authenticated users can **insert/update/delete** rows where `user_id = auth.uid()`; **select** own rows (Edge Function uses **service role** and bypasses RLS).

---

## Phase 3 — App: register token & save (same pattern as §6.1–6.2 in your reference doc)

1. **`Notifications.setNotificationHandler`** — copy the pattern from your doc; for PawTaker you can suppress alerts when `data.type === 'message'` **and** `AppState` is `active` (same as Digital Caretaker).
2. **`registerForPushNotificationsAsync()`** — same flow: physical device check (optional), Android default channel, `getPermissionsAsync` / `requestPermissionsAsync`, then `getExpoPushTokenAsync({ projectId: Constants.expoConfig?.extra?.eas?.projectId })`.
3. **`savePushToken(userId, token)`** — `supabase.from('push_tokens').upsert({ user_id, token, platform: Platform.OS }, { onConflict: 'user_id,token' })` (after migration unique constraint exists).
4. **Call after login** — e.g. in `useEffect` when `user?.id` is set, and on **`AppState` → `active`** (your other repo refreshes token when returning to foreground).
5. **Logout** — delete this device’s token row(s) for `user_id` to avoid pushes to logged-out installs.

---

## Phase 4 — In-app list & Realtime (same idea as §6.3–6.4)

1. **List:** You already load `notifications` on `app/(private)/(tabs)/(home)/notifications.tsx` — keep that.
2. **Badge / home bell:** Already counts unread — refresh on focus or after Realtime event.
3. **Optional toast:** Subscribe like your **`NotificationManager`**:

   - `supabase.channel(...).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.<uuid>' }, handler)`.

4. Deduplicate with a `seenNotificationIds` ref so the same insert doesn’t toast twice if you also refetch.

---

## Phase 5 — Edge Function: push for **`notifications` INSERT** (mirror in-app to device)

Your triggers **already** insert into `notifications`. You do **not** need the function to insert again — only **send push**.

1. Create **`supabase/functions/send-notification-push/index.ts`** (name is arbitrary).
2. **Invoke only via Database Webhook** on **`public.notifications`**, event **INSERT** (same pattern as your reference: parse `payload.record`).
3. Inside the function:
   - Create Supabase client with **`SUPABASE_SERVICE_ROLE_KEY`** (same snippet as §6.5 in your doc).
   - Read `record.user_id`, `record.title`, `record.body`, `record.type`, `record.data`, `record.id`.
   - Optional: **`user_notification_preferences`** later — PawTaker may not have this table yet; skip v1 or add a small table.
   - `select('token').from('push_tokens').eq('user_id', record.user_id)`.
   - Build Expo messages: `{ to, title, body, data: { type: record.type, notificationId: record.id, ...record.data }, sound: 'default', priority: 'high' }`.
   - `POST https://exp.host/--/api/v2/push/send` with header **`Authorization: Bearer EXPO_ACCESS_TOKEN`** (same as your working project).
4. **Deploy:** `supabase functions deploy send-notification-push --no-verify-jwt` if the webhook uses a service role header instead of JWT (common for webhooks).

---

## Phase 6 — Edge Function: push for **`messages` INSERT** (push only)

Same as your **`send-message-push`**: webhook on **`messages`**, resolve recipients from **`threads.participant_ids`** minus `sender_id`, load tokens, POST to Expo, **`data.type: 'message'`**, include `threadId` from `threads` / message metadata.

**Do not** insert `notifications` here if you want parity with “messages = push only” — but your DB trigger **`notify_message_event`** may still insert in-app rows; remove or adjust that trigger if you want zero chat rows in the bell.

---

## Phase 7 — Secrets & webhooks (Supabase Dashboard)

1. **Edge Function secrets:** `EXPO_ACCESS_TOKEN` (Expo dashboard), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (often auto-injected; confirm in Supabase docs for your CLI version).
2. **Database → Webhooks:**
   - **Webhook A:** table **`notifications`**, **Insert** → URL `https://<project-ref>.supabase.co/functions/v1/send-notification-push`  
     Headers: **`Authorization: Bearer <SERVICE_ROLE_KEY>`** (same approach as your `webhooks.md` note).
   - **Webhook B:** table **`messages`**, **Insert** → `.../send-message-push` (if you ship Phase 6).

---

## Phase 8 — Notification tap routing (PawTaker routes)

In **`addNotificationResponseReceivedListener`** / cold start (`getLastNotificationResponseAsync`), `switch (data.type)` and map to Expo Router, for example:

| `data.type` (from `notifications.data` or Edge payload) | Example route |
| ------------------------------------------------------ | ------------- |
| `chat` | `/(private)/(tabs)/messages/[threadId]` with `params.threadId` from `data.threadId` |
| `contract_completed` | `/(private)/(tabs)/my-care/contract/[id]` with `data.contract_id` |
| `review_received` / `review_submitted` | Profile or review screen using `data.review_id` / `data.contract_id` |
| `kyc_rejected` | `/(private)/(tabs)/profile/edit` or settings |
| Default | `/(private)/(tabs)/(home)/notifications` |

Keep **`data.notificationId`** on every push from the `notifications` webhook so you can deep-link and mark read.

---

## Phase 9 — Testing order

1. SQL: insert a test row into `notifications` for your user → list updates (+ Realtime if enabled).
2. Register app on a **physical device** → confirm row in `push_tokens`.
3. Deploy Edge Function + webhook → insert another `notifications` row → device should get a **system** notification.
4. `messages` webhook: send a chat message → push only (and verify foreground suppression if you implemented it).

---

## What you never run manually

- **Postgres trigger functions** (`notify_*`, `trg_apply_*`) — fired by inserts/updates.
- **Edge Functions** — invoked by **webhooks**, not by the mobile app (except if you add a rare admin tool).

---

## Quick reference — files to add or replace in PawTaker

| Piece | Suggested location |
| ----- | ------------------ |
| Token + handler | Replace stub `src/lib/notifications/setup.ts` or add `src/lib/notifications/push.ts` like your `lib/pushNotifications.ts` |
| Hook | `src/lib/notifications/usePushNotifications.ts` (pattern from your §6.2) |
| Optional Realtime toast | Small component mounted in `app/_layout.tsx` (private stack) |
| Edge Functions | `supabase/functions/send-notification-push/`, `supabase/functions/send-message-push/` |

This document is **PawTaker-specific**; keep **`notifications-and-push.md`** as the detailed pattern reference from the project that already works in production.
