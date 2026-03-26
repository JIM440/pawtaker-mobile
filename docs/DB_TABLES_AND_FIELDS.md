# Database Tables and Fields

This document summarizes the current database model used by the mobile app, based on `src/lib/supabase/types.ts`.

## Source of truth

- `src/lib/supabase/types.ts`
- Schema: `public`

## Tables currently defined

- `users`
- `pets`
- `care_requests`
- `contracts`
- `check_ins`
- `reviews`
- `messages`
- `threads`
- `taker_profiles`
- `notifications`
- `emergency_contacts`
- `kyc_submissions`
- `point_transactions`
- `reports`
- `push_tokens`

## Table: `users`

Primary user profile and account metadata.

Fields:
- `id: string`
- `email: string`
- `full_name: string | null`
- `display_name: string | null`
- `avatar_url: string | null`
- `bio: string | null`
- `city: string | null`
- `latitude: number | null`
- `longitude: number | null`
- `auth_type: string`
- `has_had_pet: boolean`
- `is_verified: boolean`
- `is_admin: boolean`
- `is_email_verified: boolean`
- `is_deactivated: boolean`
- `kyc_status: 'not_submitted' | 'pending' | 'submitted' | 'approved' | 'rejected'`
- `points_balance: number`
- `points_alltime_high: number`
- `care_given_count: number`
- `care_received_count: number`
- `language: string`
- `theme_pref: string`
- `created_at: string`
- `updated_at: string`

## Table: `kyc_submissions`

Stores each KYC document submission per user.

Fields:
- `id: string`
- `user_id: string`
- `document_type: 'passport' | 'drivers_license' | 'national_id'`
- `front_url: string`
- `back_url: string | null`
- `selfie_url: string | null`
- `status: 'pending' | 'approved' | 'rejected'`
- `reviewer_notes: string | null`
- `submitted_at: string`
- `reviewed_at: string | null`

## Other tables and their fields

### `pets`
- `id: string`
- `owner_id: string`
- `name: string`
- `species: string`
- `breed: string | null`
- `age_years: number | null`
- `weight_kg: number | null`
- `avatar_url: string | null`
- `notes: string | null`
- `created_at: string`

### `care_requests`
- `id: string`
- `owner_id: string`
- `pet_id: string`
- `taker_id: string | null`
- `care_type: 'sitting' | 'walking' | 'boarding'`
- `status: 'open' | 'matched' | 'active' | 'completed' | 'cancelled'`
- `start_date: string`
- `end_date: string`
- `points_offered: number`
- `description: string | null`
- `created_at: string`

### `contracts`
- `id: string`
- `request_id: string`
- `owner_id: string`
- `taker_id: string`
- `signed_owner: boolean`
- `signed_taker: boolean`
- `status: 'draft' | 'signed' | 'active' | 'completed'`
- `created_at: string`

### `check_ins`
- `id: string`
- `contract_id: string`
- `taker_id: string`
- `photo_urls: string[]`
- `note: string | null`
- `checked_in_at: string`

### `reviews`
- `id: string`
- `contract_id: string`
- `reviewer_id: string`
- `reviewee_id: string`
- `rating: number`
- `comment: string | null`
- `created_at: string`

### `messages`
- `id: string`
- `thread_id: string`
- `sender_id: string`
- `content: string`
- `type: 'text' | 'proposal' | 'agreement' | 'image'`
- `metadata: Json | null`
- `read_at: string | null`
- `created_at: string`

### `threads`
- `id: string`
- `participant_ids: string[]`
- `request_id: string | null`
- `last_message_at: string | null`
- `created_at: string`

### `taker_profiles`
- `id: string`
- `user_id: string`
- `accepted_species: string[]`
- `max_pets: number`
- `availability_json: Json`
- `hourly_points: number`
- `experience_years: number`
- `created_at: string`

### `notifications`
- `id: string`
- `user_id: string`
- `type: string`
- `title: string`
- `body: string`
- `data: Json | null`
- `read: boolean`
- `created_at: string`

### `emergency_contacts`
- `id: string`
- `user_id: string`
- `name: string`
- `phone: string`
- `relationship: string | null`
- `created_at: string`

### `point_transactions`
- `id: string`
- `user_id: string`
- `amount: number`
- `type: 'earn' | 'spend' | 'bonus' | 'refund'`
- `description: string`
- `contract_id: string | null`
- `created_at: string`

### `reports`
- `id: string`
- `reporter_id: string`
- `reported_user_id: string`
- `reason: string`
- `details: string | null`
- `status: 'open' | 'reviewed' | 'resolved'`
- `created_at: string`

### `push_tokens`
- `id: string`
- `user_id: string`
- `token: string`
- `platform: 'ios' | 'android'`
- `created_at: string`

## Notes

- All field types above are TypeScript/Supabase client types from the app code.
- `Relationships` are currently typed as `never[]` in `types.ts` (no explicit FK metadata in this generated file).
