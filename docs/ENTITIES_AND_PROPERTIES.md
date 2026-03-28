# Entities and properties (data model)

This document lists each **database entity** (Supabase `public` table) and its **properties** as typed in the app. It reflects the current structure in `src/lib/supabase/types.ts`.

**Conventions**

- **UUIDs** and **timestamps** (`timestamptz`) arrive from PostgREST as `string`.
- **Dates** (`date`) are ISO strings like `YYYY-MM-DD`.
- **Times** (`time`) are strings from the API.
- **`numeric`** columns are typed as `number` in TypeScript.
- **`jsonb`** is typed as `Json` (arbitrary JSON).

---

## Entity index

| Entity (table)       | Purpose (short)                          |
| -------------------- | ---------------------------------------- |
| `users`              | Account / profile, KYC state, points     |
| `pets`               | Pets owned by a user                     |
| `pet_likes`          | User liked a pet (optional care request) |
| `care_requests`      | Request for pet care                     |
| `contracts`          | Agreement between owner and taker        |
| `check_ins`          | Taker check-in on a contract             |
| `reviews`            | Rating after a contract                  |
| `messages`           | Message in a thread                      |
| `threads`            | Conversation between participants        |
| `user_blocks`        | Block relationship between users         |
| `taker_profiles`     | Taker availability and preferences       |
| `notifications`      | In-app notifications                     |
| `emergency_contacts` | Emergency contact for a user             |
| `kyc_submissions`    | KYC document submission                  |
| `point_transactions` | Points ledger entries                    |
| `reports`            | User reports                             |
| `push_tokens`        | Device push notification tokens          |

---

## `users`

| Property              | Type      | Notes |
| --------------------- | --------- | ----- |
| `id`                  | `string`  | User id (UUID) |
| `email`               | `string`  | |
| `full_name`           | `string \| null` | |
| `avatar_url`          | `string \| null` | |
| `bio`                 | `string \| null` | |
| `city`                | `string \| null` | |
| `latitude`            | `number \| null` | |
| `longitude`           | `number \| null` | |
| `auth_type`           | `string`  | |
| `has_had_pet`         | `boolean` | |
| `is_verified`         | `boolean` | |
| `is_admin`            | `boolean` | |
| `is_email_verified`   | `boolean` | |
| `is_deactivated`      | `boolean` | |
| `kyc_status`          | union     | `'not_submitted' \| 'pending' \| 'submitted' \| 'approved' \| 'rejected'` |
| `points_balance`      | `number`  | |
| `points_alltime_high` | `number`  | |
| `care_given_count`    | `number`  | |
| `care_received_count` | `number`  | |
| `language`            | `string`  | |
| `theme_pref`          | `string`  | |
| `created_at`          | `string`  | |
| `updated_at`          | `string`  | |

---

## `pets`

| Property                    | Type      | Notes |
| --------------------------- | --------- | ----- |
| `id`                        | `string`  | |
| `owner_id`                  | `string`  | FK → `users.id` (logical) |
| `name`                      | `string`  | |
| `species`                   | `string`  | |
| `breed`                     | `string \| null` | |
| `yard_type`                 | `string \| null` | |
| `age_range`                 | `string \| null` | |
| `energy_level`              | `string \| null` | |
| `has_special_needs`         | `boolean` | |
| `special_needs_description` | `string \| null` | |
| `age_years`                 | `number \| null` | DB `numeric` |
| `weight_kg`                 | `number \| null` | DB `numeric` |
| `photo_urls`                | `string[] \| null` | Ordered gallery URLs |
| `notes`                     | `string \| null` | |
| `created_at`                | `string`  | |

---

## `pet_likes`

| Property           | Type      | Notes |
| ------------------ | --------- | ----- |
| `user_id`          | `string`  | |
| `pet_id`           | `string`  | |
| `care_request_id`  | `string \| null` | Optional link to a request |
| `created_at`       | `string`  | |

---

## `care_requests`

| Property          | Type      | Notes |
| ----------------- | --------- | ----- |
| `id`              | `string`  | |
| `owner_id`        | `string`  | |
| `pet_id`          | `string`  | |
| `taker_id`        | `string \| null` | |
| `care_type`       | `string`  | e.g. `daytime`, `playwalk`, `overnight`, `vacation` (DB `text`) |
| `status`          | `string`  | default `open` (DB `text`) |
| `start_date`      | `string`  | DB `date` |
| `end_date`        | `string`  | DB `date` |
| `start_time`      | `string \| null` | DB `time` |
| `end_time`        | `string \| null` | DB `time` |
| `points_offered`  | `number`  | DB `integer`, default 0 |
| `created_at`      | `string`  | |

---

## `contracts`

| Property        | Type      | Notes |
| --------------- | --------- | ----- |
| `id`            | `string`  | |
| `request_id`    | `string`  | → `care_requests` |
| `owner_id`      | `string`  | |
| `taker_id`      | `string`  | |
| `signed_owner`  | `boolean` | default false |
| `signed_taker`  | `boolean` | |
| `status`        | `string`  | default `draft` (DB `text`) |
| `created_at`    | `string`  | |

---

## `check_ins`

| Property         | Type      | Notes |
| ---------------- | --------- | ----- |
| `id`             | `string`  | |
| `contract_id`    | `string`  | |
| `taker_id`       | `string`  | |
| `photo_urls`     | `string[]` | DB `text[]`, default `{}` |
| `note`           | `string \| null` | |
| `checked_in_at`  | `string`  | |

---

## `reviews`

| Property       | Type      | Notes |
| -------------- | --------- | ----- |
| `id`           | `string`  | |
| `contract_id`  | `string`  | |
| `reviewer_id`  | `string`  | |
| `reviewee_id`  | `string`  | |
| `rating`       | `number`  | DB `numeric` |
| `comment`      | `string \| null` | |
| `created_at`   | `string`  | |

---

## `messages`

| Property     | Type      | Notes |
| ------------ | --------- | ----- |
| `id`         | `string`  | |
| `thread_id`  | `string`  | |
| `sender_id`  | `string`  | |
| `content`    | `string`  | |
| `type`       | `string`  | default `text`; app may use e.g. `proposal` |
| `metadata`   | `Json \| null` | DB `jsonb` |
| `read_at`    | `string \| null` | |
| `created_at` | `string`  | |

---

## `threads`

| Property            | Type      | Notes |
| ------------------- | --------- | ----- |
| `id`                | `string`  | |
| `participant_ids`   | `string[]` | |
| `request_id`        | `string \| null` | Optional link to `care_requests` |
| `last_message_at`   | `string \| null` | |
| `created_at`        | `string`  | |

---

## `user_blocks`

| Property      | Type     | Notes |
| ------------- | -------- | ----- |
| `blocker_id`  | `string` | User who blocked |
| `blocked_id`  | `string` | User who is blocked |
| `created_at`  | `string` | |

---

## `taker_profiles`

| Property              | Type      | Notes |
| --------------------- | --------- | ----- |
| `id`                  | `string`  | |
| `user_id`             | `string`  | |
| `accepted_species`    | `string[]` | DB `text[]`, default `{}` |
| `max_pets`            | `number`  | DB `integer`, default 1 |
| `availability_json` | `Json`    | DB `jsonb`, default `{}` |
| `hourly_points`       | `number`  | DB `integer`, default 0 |
| `experience_years`    | `number`  | DB `numeric`, default 0 |
| `created_at`          | `string`  | |

---

## `notifications`

| Property     | Type      | Notes |
| ------------ | --------- | ----- |
| `id`         | `string`  | |
| `user_id`    | `string`  | Recipient |
| `type`       | `string`  | |
| `title`      | `string`  | |
| `body`       | `string`  | |
| `data`       | `Json \| null` | DB `jsonb` |
| `read`       | `boolean` | default false |
| `created_at` | `string`  | |

---

## `emergency_contacts`

| Property        | Type      | Notes |
| --------------- | --------- | ----- |
| `id`            | `string`  | |
| `user_id`       | `string`  | |
| `name`          | `string`  | |
| `phone`         | `string`  | |
| `relationship`  | `string \| null` | |
| `created_at`    | `string`  | |

---

## `kyc_submissions`

| Property          | Type      | Notes |
| ----------------- | --------- | ----- |
| `id`              | `string`  | |
| `user_id`         | `string`  | |
| `document_type`   | `string`  | e.g. passport / license / national id (app enums may vary) |
| `front_url`       | `string`  | |
| `back_url`        | `string \| null` | |
| `selfie_url`      | `string \| null` | |
| `status`          | `string`  | default `pending` (DB `text`) |
| `reviewer_notes`  | `string \| null` | |
| `submitted_at`    | `string \| null` | |
| `reviewed_at`     | `string \| null` | |

---

## `point_transactions`

| Property       | Type      | Notes |
| -------------- | --------- | ----- |
| `id`           | `string`  | |
| `user_id`      | `string`  | |
| `amount`       | `number`  | |
| `type`         | `string`  | DB `text` (earn / spend / etc. per product) |
| `description`  | `string`  | |
| `contract_id`  | `string \| null` | |
| `created_at`   | `string`  | |

---

## `reports`

| Property            | Type      | Notes |
| ------------------- | --------- | ----- |
| `id`                | `string`  | |
| `reporter_id`       | `string`  | |
| `reported_user_id`  | `string`  | |
| `reason`            | `string`  | |
| `details`           | `string \| null` | |
| `status`            | `string`  | default `open` (DB `text`) |
| `created_at`        | `string`  | |

---

## `push_tokens`

| Property     | Type     | Notes |
| ------------ | -------- | ----- |
| `id`         | `string` | |
| `user_id`    | `string` | |
| `token`      | `string` | |
| `platform`   | `string` | e.g. `ios` / `android` |
| `created_at` | `string` | |

---

## Keeping this in sync

When the Supabase schema changes, regenerate or update `src/lib/supabase/types.ts`, then align this document with the `Row` shape for each table.
