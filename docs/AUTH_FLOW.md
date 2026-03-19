# PawTaker — Authentication Flow
## How It Works From First Screen to Main App

---

## Overview

PawTaker uses **Supabase Auth** as its authentication backend. Supabase manages all the hard parts — password hashing, JWT tokens, email delivery, session refresh — so the app only needs to call simple functions like `signUp()`, `verifyOtp()`, and `signInWithPassword()`.

The auth flow has **6 steps** before a user can access the main app:

```
Welcome → Sign Up → Verify Email (OTP) → Profile → Declaration → KYC → Main App
```

---

## The Two-Table Model

This is the most important concept to understand first.

Supabase uses **two separate databases** for user data:

### `auth.users` (Supabase's internal table)
- Managed entirely by Supabase — you never write to it directly
- Stores: email, hashed password, JWT tokens, email verification state (`email_confirmed_at`), OAuth provider info
- You cannot query this table from your app code
- Created automatically when a user calls `supabase.auth.signUp()`

### `public.users` (Your application table)
- Created by you — you read and write it freely
- Stores: display name, city, bio, avatar, points balance, KYC status, preferences, and everything the app actually needs
- Linked to `auth.users` by sharing the **exact same UUID** as the primary key

```
auth.users.id  ←——— same UUID ———→  public.users.id
```

This means: when you know a user's ID from the session, you can fetch their full profile from `public.users` using that same ID.

### Why two tables?
Supabase enforces a clean separation between authentication (who you are) and application data (what your profile looks like). `auth.users` is locked down for security. `public.users` is yours to shape however the app needs.

---

## How `public.users` Gets Created Automatically

When a user signs up, Supabase creates the `auth.users` row. But `public.users` doesn't get created automatically — you need a **PostgreSQL trigger** to do it.

A trigger is a function that fires automatically when something happens in the database. Ours fires every time a new row is inserted into `auth.users`:

```sql
-- Trigger fires on every new signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

The `handle_new_user()` function then inserts a matching row into `public.users` with sensible defaults:

```
new auth.users row created
        ↓
trigger fires handle_new_user()
        ↓
public.users row inserted with:
  - id = auth.users.id (same UUID)
  - email = the email they signed up with
  - full_name = from signup form
  - kyc_status = 'not_submitted'
  - is_email_verified = false
  - points_balance = 0
  - language = 'en'
  - ... all other defaults
```

This approach is chosen over creating the `public.users` row in app code because:
- It fires **server-side** — network drops and app crashes cannot prevent it
- It works for **all auth methods** (email, Google, Apple) from one piece of code
- The app's signup code stays clean — one call, no manual inserts

---

## How Tokens Work

### What is a JWT?
When a user signs in or signs up, Supabase returns a **session** containing two tokens:

| Token | Purpose | Lifespan |
|-------|---------|---------|
| `access_token` | A JWT (JSON Web Token) that proves who the user is. Attached to every API request automatically. | 1 hour |
| `refresh_token` | A long-lived secret token used only to get a new `access_token` when it expires. | Weeks/months |

The `access_token` is a JWT — a signed string that encodes the user's ID, role, and expiry time. Supabase verifies it on every request without hitting the database.

### Where are tokens stored?
On **iOS and Android**, tokens are stored in `expo-secure-store` — an encrypted, hardware-backed key-value store on the device. Tokens are never stored in plain text.

On **web**, tokens are stored in `localStorage`.

This is configured once in `src/lib/supabase/client.ts`:

```typescript
const storage = Platform.OS === 'web'
  ? localStorage adapter
  : SecureStore adapter;

export const supabase = createClient(url, key, {
  auth: {
    storage,              // where to save tokens
    autoRefreshToken: true,  // silently refresh when access_token expires
    persistSession: true,    // survive app restarts
    detectSessionInUrl: false, // must be false for React Native
  }
});
```

### What happens automatically (you never need to manage this)

| Event | What Supabase does |
|-------|-------------------|
| User signs up or signs in | Saves `access_token` + `refresh_token` to SecureStore |
| User makes any Supabase query | Attaches `access_token` to the Authorization header |
| `access_token` expires (1 hour) | Uses `refresh_token` to silently get a new one |
| User closes and reopens the app | Reads saved tokens — user stays logged in |
| User signs out | Deletes tokens — user is logged out |

---

## The Auth State Listener

The root layout (`app/_layout.tsx`) sets up a single listener that runs for the entire lifetime of the app:

```typescript
supabase.auth.onAuthStateChange((_event, session) => {
  setSession(session); // updates Zustand store
});
```

This fires every time auth state changes:

| Event | When |
|-------|------|
| `INITIAL_SESSION` | App opens — Supabase reads saved tokens from SecureStore |
| `SIGNED_IN` | User signs in OR OTP is verified |
| `TOKEN_REFRESHED` | Access token silently renewed |
| `SIGNED_OUT` | User logs out |
| `USER_UPDATED` | User verifies email or changes password |

When `session` changes, a `useEffect` in `_layout.tsx` re-runs and decides where to navigate the user.

---

## Navigation Logic (The Smart Router)

This is what makes the auth flow resumable. If a user creates an account, gets interrupted mid-flow (phone dies, app crashes), and reopens the app — they land exactly where they left off.

```typescript
useEffect(() => {
  if (!ready) return;

  if (!session) {
    router.replace('/(auth)/welcome');   // not logged in
    return;
  }

  fetchProfile(session.user.id).then(() => {
    const profile = useAuthStore.getState().profile;
    const emailVerified = !!session.user.email_confirmed_at;

    if (!emailVerified) {
      router.replace('/(auth)/signup/verify');     // step 2
    } else if (!profile?.city) {
      router.replace('/(auth)/signup/profile');    // step 3
    } else if (profile.kyc_status === 'not_submitted') {
      router.replace('/(auth)/kyc/submit');        // step 5
    } else if (profile.kyc_status === 'pending') {
      router.replace('/(auth)/kyc/pending');       // step 6
    } else {
      router.replace('/(private)/(tabs)');         // main app ✅
    }
  });
}, [ready, session]);
```

---

## Screen-by-Screen Walkthrough

### Screen 1 — Welcome (`/(auth)/welcome`)
The landing screen. Two buttons: **Get Started** (→ signup) and **Sign In** (→ login). No auth logic here.

---

### Screen 2 — Credentials (`/(auth)/signup/credentials`)
The user enters: full name, email, password, confirm password.

**What happens:**
```typescript
supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name, has_had_pet: false } }
})
```

- Supabase creates the `auth.users` row
- The `handle_new_user` trigger fires and creates the `public.users` row
- Supabase sends an email with a **6-digit OTP code**
- The form data (name, email, password) is saved to the **Signup Zustand Store** so it survives navigation between steps
- User is sent to the OTP verification screen

**Data stored:**
- `auth.users`: email, hashed password, `email_confirmed_at = null`
- `public.users`: id, email, full_name, kyc_status = 'not_submitted', is_email_verified = false, all defaults

---

### Screen 3 — Verify Email (`/(auth)/signup/verify`)
The user enters the 6-digit code from their email.

**What happens:**
```typescript
supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
```

- Supabase validates the code
- Sets `email_confirmed_at` on `auth.users`
- The `handle_email_verified` trigger fires and sets `is_email_verified = true` on `public.users`
- `onAuthStateChange` fires `USER_UPDATED` → session updates → navigation re-runs → routes to profile screen

A **Resend** button calls:
```typescript
supabase.auth.resend({ type: 'signup', email })
```

OTP codes expire after **1 hour**.

---

### Screen 4 — Profile (`/(auth)/signup/profile`)
The user enters: display name, city, bio.

**What happens:**
- Data is saved to the **Signup Zustand Store only** — no Supabase call here
- This is intentional: the Supabase update happens only after the next screen (declaration) to make it one atomic write

---

### Screen 5 — Declaration (`/(auth)/signup/declaration`)
The user ticks 3 community standards checkboxes and optionally confirms they've had a pet before.

**What happens:**
```typescript
supabase.from('users').update({
  full_name: displayName,
  bio,
  city: location,
}).eq('id', session.user.id)
```

- `public.users` is updated with all the profile data collected in steps 3 and 4
- The Signup Zustand Store is cleared — no longer needed
- User navigates to KYC

---

### Screen 6 — KYC Submit (`/(auth)/kyc/submit`)
The user selects a document type and uploads 3 images: ID front, ID back, selfie.

**What happens (in order):**

1. Each image is compressed to 1200px wide, 80% JPEG quality using `expo-image-manipulator`
2. Each image is uploaded to Cloudinary via a direct REST API call
3. Cloudinary returns a `secure_url` and `public_id` for each image
4. A row is inserted into `kyc_submissions`:

```typescript
supabase.from('kyc_submissions').insert({
  user_id: session.user.id,
  document_type: 'passport' | 'drivers_license' | 'national_id',
  front_url: cloudinary_secure_url,
  back_url: cloudinary_secure_url,
  selfie_url: cloudinary_secure_url,
  status: 'pending',
  submitted_at: now,
})
```

5. `public.users.kyc_status` is updated to `'pending'`
6. Profile is re-fetched from Supabase → navigation re-runs → routes to KYC pending screen

---

### Screen 7 — KYC Pending (`/(auth)/kyc/pending`)
A waiting screen. The user stays here until an admin reviews and approves their KYC submission in the admin panel, changing `kyc_status` to `'approved'`. Once approved, the next time the user opens the app they are routed to the main app.

---

## Tables Created As a Result of Completing the Auth Flow

### `auth.users` (Supabase managed)
Created when: `supabase.auth.signUp()` is called.
Contains: credentials, tokens, email verification state. You never touch this directly.

---

### `public.users`
Created when: the `handle_new_user` trigger fires on signup.
Updated when: declaration screen (profile data), KYC submit (kyc_status change).

**Why it matters:** This is the core profile table. Every screen in the app that shows user data reads from here. The `kyc_status` column controls access to the main app. The `points_balance` column drives the entire P2P economy.

| Column | Set During | Purpose |
|--------|-----------|---------|
| `id` | Signup trigger | Links to `auth.users.id` |
| `email` | Signup trigger | Display + contact |
| `full_name` | Declaration screen | Shown on profile |
| `city` | Declaration screen | Used for proximity matching on feed |
| `bio` | Declaration screen | Shown on profile |
| `kyc_status` | KYC submit | Controls app access |
| `is_email_verified` | Email verified trigger | Guards profile step |
| `points_balance` | Starts at 0 | The app's currency |
| `language` | Signup trigger (default 'en') | i18n preference |
| `theme_pref` | Signup trigger (default 'system') | UI theme preference |

---

### `kyc_submissions`
Created when: KYC submit screen completes successfully.

**Why it matters:** Stores the actual KYC documents for admin review. Each submission has 3 Cloudinary image URLs (front, back, selfie) and a status (`pending → approved/rejected`). An admin reviews this table to verify user identities. The `public_id` values allow the admin to view images in Cloudinary even though they are stored with `Authenticated` access mode (not publicly accessible URLs).

| Column | Value | Purpose |
|--------|-------|---------|
| `user_id` | Current user's UUID | Links submission to user |
| `document_type` | passport / drivers_license / national_id | Type of ID provided |
| `front_url` | Cloudinary secure_url | Front of ID document |
| `back_url` | Cloudinary secure_url | Back of ID (null for passport) |
| `selfie_url` | Cloudinary secure_url | Selfie for liveness check |
| `status` | pending → approved/rejected | Admin review outcome |
| `submitted_at` | Timestamp | When submitted |
| `reviewed_at` | Timestamp | When admin acted |

---

## The Signup Zustand Store

The `signup.store.ts` is a temporary in-memory store that holds form data as the user moves through the multi-step signup flow. It is **not persisted** to AsyncStorage — if the app crashes mid-signup, it resets. But that is fine because the navigation logic re-routes them to the right step using their saved session and `public.users` data.

```
Step 1 (credentials)  → saves fullName, email, password to store
Step 2 (verify)       → reads email from store to show "code sent to [email]"
Step 3 (profile)      → saves displayName, location, bio to store
Step 4 (declaration)  → reads all store data → writes to Supabase → clears store
```

After declaration, the store is cleared with `clearSignup()`. It has served its purpose.

---

## Sign In Flow

When an existing user signs in:

```typescript
supabase.auth.signInWithPassword({ email, password })
```

1. Supabase validates credentials
2. Returns a new session (new `access_token` + `refresh_token`)
3. Tokens saved to SecureStore automatically
4. `onAuthStateChange` fires `SIGNED_IN`
5. `setSession(session)` updates Zustand
6. Navigation `useEffect` re-runs → `fetchProfile()` → routes based on `kyc_status`

No `router.push()` is needed in the login screen. The navigation is fully driven by the session state change.

---

## Sign Out Flow

```typescript
await supabase.auth.signOut(); // clears tokens from SecureStore
signOut();                     // clears session + profile from Zustand
```

1. Tokens deleted from SecureStore
2. `onAuthStateChange` fires `SIGNED_OUT`
3. `session` becomes `null` in Zustand
4. Navigation `useEffect` re-runs → `session` is null → routes to `/(auth)/welcome`

---

## Image Storage (Cloudinary)

KYC images are NOT stored in Supabase Storage. They go to **Cloudinary** for these reasons:
- Better image transformation (resize, compress, format convert)
- Dedicated CDN
- Access control via authenticated upload presets

Images are uploaded with the `pawtaker_kyc` preset which sets them to **Authenticated access mode** — the URLs are not guessable or publicly accessible. Only an admin with the API key can generate signed URLs to view them.

The Cloudinary folder structure:
```
pawtaker/
  kyc/          ← KYC documents (authenticated access)
  profiles/     ← Profile photos (public) — future
  pets/         ← Pet photos (public) — future
  checkins/     ← Check-in photos (authenticated) — future
```
