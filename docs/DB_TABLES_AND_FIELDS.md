# Database Tables and Fields

This document captures the current database structure shared on April 13, 2026 so we can reference it while making app changes.

## Notes

- This is a working schema snapshot, not a generated Supabase type file.
- Column types are written in database terms.
- `ARRAY` means a Postgres array column.
- `USER-DEFINED` means a custom Postgres type.

## Tables

### `admin_notifications`

- `id (uuid)`
- `type (text)`
- `title (text)`
- `message (text)`
- `triggered_by (uuid)`
- `reference_id (uuid)`
- `reference_type (text)`
- `is_read (boolean)`
- `created_at (timestamp with time zone)`

### `admin_push_subscriptions`

- `id (uuid)`
- `user_id (uuid)`
- `subscription (jsonb)`
- `created_at (timestamp with time zone)`

### `blogs`

- `id (uuid)`
- `slug (text)`
- `title (text)`
- `excerpt (text)`
- `content_html (text)`
- `cover_image_url (text)`
- `is_published (boolean)`
- `published_at (timestamp with time zone)`
- `created_at (timestamp with time zone)`
- `updated_at (timestamp with time zone)`

### `care_requests`

- `id (uuid)`
- `owner_id (uuid)`
- `pet_id (uuid)`
- `taker_id (uuid)`
- `care_type (text)`
- `status (text)`
- `start_date (date)`
- `end_date (date)`
- `points_offered (integer)`
- `created_at (timestamp with time zone)`
- `start_time (time without time zone)`
- `end_time (time without time zone)`

### `check_ins`

- `id (uuid)`
- `contract_id (uuid)`
- `taker_id (uuid)`
- `photo_urls (ARRAY)`
- `note (text)`
- `checked_in_at (timestamp with time zone)`

### `contracts`

- `id (uuid)`
- `request_id (uuid)`
- `owner_id (uuid)`
- `taker_id (uuid)`
- `signed_owner (boolean)`
- `signed_taker (boolean)`
- `status (text)`
- `created_at (timestamp with time zone)`

### `emergency_contacts`

- `id (uuid)`
- `user_id (uuid)`
- `name (text)`
- `phone (text)`
- `relationship (text)`
- `created_at (timestamp with time zone)`

### `kyc_submissions`

- `id (uuid)`
- `user_id (uuid)`
- `document_type (text)`
- `front_url (text)`
- `back_url (text)`
- `selfie_url (text)`
- `status (text)`
- `reviewer_notes (text)`
- `submitted_at (timestamp with time zone)`
- `reviewed_at (timestamp with time zone)`

### `messages`

- `id (uuid)`
- `thread_id (uuid)`
- `sender_id (uuid)`
- `content (text)`
- `type (text)`
- `metadata (jsonb)`
- `read_at (timestamp with time zone)`
- `created_at (timestamp with time zone)`

### `my_blocked_users`

- `blocked_id (uuid)`

### `notifications`

- `id (uuid)`
- `user_id (uuid)`
- `type (text)`
- `title (text)`
- `body (text)`
- `data (jsonb)`
- `read (boolean)`
- `created_at (timestamp with time zone)`

### `pet_likes`

- `user_id (uuid)`
- `pet_id (uuid)`
- `care_request_id (uuid)`
- `created_at (timestamp with time zone)`

### `pets`

- `id (uuid)`
- `owner_id (uuid)`
- `name (text)`
- `species (text)`
- `breed (text)`
- `age_years (numeric)`
- `weight_kg (numeric)`
- `notes (text)`
- `created_at (timestamp with time zone)`
- `photo_urls (ARRAY)`
- `yard_type (text)`
- `age_range (text)`
- `energy_level (text)`
- `has_special_needs (boolean)`
- `special_needs_description (text)`

### `point_transactions`

- `id (uuid)`
- `user_id (uuid)`
- `amount (integer)`
- `type (text)`
- `description (text)`
- `contract_id (uuid)`
- `created_at (timestamp with time zone)`

### `push_tokens`

- `id (uuid)`
- `user_id (uuid)`
- `token (text)`
- `platform (text)`
- `created_at (timestamp with time zone)`

### `reports`

- `id (uuid)`
- `reporter_id (uuid)`
- `reported_user_id (uuid)`
- `reason (text)`
- `details (text)`
- `status (text)`
- `created_at (timestamp with time zone)`

### `reviews`

- `id (uuid)`
- `contract_id (uuid)`
- `reviewer_id (uuid)`
- `reviewee_id (uuid)`
- `rating (numeric)`
- `comment (text)`
- `created_at (timestamp with time zone)`

### `taker_profiles`

- `id (uuid)`
- `user_id (uuid)`
- `accepted_species (ARRAY)`
- `max_pets (integer)`
- `availability_json (jsonb)`
- `hourly_points (integer)`
- `experience_years (numeric)`
- `created_at (timestamp with time zone)`

### `threads`

- `id (uuid)`
- `participant_ids (ARRAY)`
- `request_id (uuid)`
- `last_message_at (timestamp with time zone)`
- `created_at (timestamp with time zone)`
- `last_message_preview (text)`
- `last_sender_id (uuid)`

### `user_blocks`

- `blocker_id (uuid)`
- `blocked_id (uuid)`
- `created_at (timestamp with time zone)`

### `users`

- `id (uuid)`
- `email (text)`
- `full_name (text)`
- `display_name (text)`
- `bio (text)`
- `avatar_url (text)`
- `city (text)`
- `latitude (double precision)`
- `longitude (double precision)`
- `auth_type (text)`
- `has_had_pet (boolean)`
- `is_verified (boolean)`
- `is_admin (boolean)`
- `is_email_verified (boolean)`
- `points_balance (integer)`
- `points_alltime_high (integer)`
- `care_given_count (integer)`
- `care_received_count (integer)`
- `language (text)`
- `theme_pref (text)`
- `is_deactivated (boolean)`
- `kyc_status (USER-DEFINED)`
- `created_at (timestamp with time zone)`
- `updated_at (timestamp with time zone)`
- `push_subscription (jsonb)`
- `location_point (USER-DEFINED)`
