# App structure and screens (Expo Router)

This document describes how the PawTaker mobile app is organized and where almost every **route / page** lives on disk. Routing uses **[Expo Router](https://docs.expo.dev/router/introduction/)** (file-based) under the `app/` directory.

## Top-level layout

| File | Role |
| ---- | ---- |
| `app/_layout.tsx` | Root layout: fonts, splash, i18n, React Query, auth bootstrap, `Stack` with `Stack.Protected` for `(auth)` vs `(private)`. |
| `app/+not-found.tsx` | Fallback when no route matches. |

**Auth vs app:** Only one branch mounts at a time (see root `Stack.Protected`):

- **`(auth)`** — signed-out users (and password recovery while session exists).
- **`(private)`** — signed-in app (tabs + modal stacks for flows that hide the tab bar).

---

## Folder map (mental model)

```
app/
├── _layout.tsx                 # Root
├── +not-found.tsx
├── (auth)/                     # Public / pre-login flows
│   ├── _layout.tsx             # Auth stack shell
│   ├── onboarding/
│   ├── welcome.tsx
│   ├── login.tsx
│   ├── signup/
│   └── forgot-password/
└── (private)/                  # Logged-in app
    ├── _layout.tsx             # Private stack + KYC prompt + push registration
    ├── (tabs)/                 # Main tab bar (Home, My care, Post, Messages, Profile)
    ├── kyc/
    ├── pets/
    ├── post-requests/
    ├── post-availability/
    └── offer/
```

---

## `(auth)` — authentication and onboarding

**Layout:** `app/(auth)/_layout.tsx` — `Stack` with screens: `onboarding`, `welcome`, `login`, `signup`, `forgot-password`.

**Layout:** `app/(auth)/onboarding/_layout.tsx` (nested stack for onboarding).

| Typical `href` (Expo Router) | File | Notes |
| ----------------------------- | ---- | ----- |
| `/(auth)/onboarding` | `app/(auth)/onboarding/index.tsx` | First-run onboarding carousel. |
| `/(auth)/welcome` | `app/(auth)/welcome.tsx` | Welcome / entry to sign in or sign up. |
| `/(auth)/login` | `app/(auth)/login.tsx` | Email/password + social entry points. |

### Sign up (nested stack)

**Layout:** `app/(auth)/signup/_layout.tsx`

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(auth)/signup` | `app/(auth)/signup/index.tsx` | Sign-up form. |
| `/(auth)/signup/verify` | `app/(auth)/signup/verify.tsx` | OTP / email verification step. |
| `/(auth)/signup/profile` | `app/(auth)/signup/profile.tsx` | Profile details after sign-up; updates `users` row. |

### Forgot password (nested stack)

**Layout:** `app/(auth)/forgot-password/_layout.tsx`

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(auth)/forgot-password` | `app/(auth)/forgot-password/index.tsx` | Start recovery flow. |
| `/(auth)/forgot-password/verify` | `app/(auth)/forgot-password/verify.tsx` | Verify code. |
| `/(auth)/forgot-password/new-password` | `app/(auth)/forgot-password/new-password.tsx` | Set new password. |
| `/(auth)/forgot-password/confirm-password` | `app/(auth)/forgot-password/confirm-password.tsx` | Confirm password; clears recovery gate and navigates home. |

---

## `(private)` — main application

**Layout:** `app/(private)/_layout.tsx` — `SafeAreaView`, `KycGlobalPrompt`, `Stack` registering tab root and full-screen flows.

**Stack screens (from layout):** `(tabs)`, `post-requests`, `post-availability`, `offer`, `kyc/index`, `pets/add`, `pets/[id]`, `pets/[id]/edit`.

### KYC (full screen, outside tabs)

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/kyc` | `app/(private)/kyc/index.tsx` | Document + selfie upload; inserts `kyc_submissions`, updates `users.kyc_status`. |

### Pets (stack under private)

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/pets/add` | `app/(private)/pets/add.tsx` | Add a pet. |
| `/(private)/pets/[id]` | `app/(private)/pets/[id].tsx` | Pet detail. |
| `/(private)/pets/[id]/edit` | `app/(private)/pets/[id]/edit.tsx` | Edit pet. |

**Layout:** `app/(private)/pets/_layout.tsx` — nests the pets routes if present (stack for pet segment).

### Post a care request (wizard)

**Layout:** `app/(private)/post-requests/_layout.tsx`

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/post-requests` | `app/(private)/post-requests/index.tsx` | Create / list flow entry (wizard). |
| `/(private)/post-requests/[id]` | `app/(private)/post-requests/[id].tsx` | Request detail / related screen by id. |

### Post availability (wizard)

**Layout:** `app/(private)/post-availability/_layout.tsx`

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/post-availability` | `app/(private)/post-availability/index.tsx` | Availability posting flow. |
| `/(private)/post-availability/[id]` | `app/(private)/post-availability/[id].tsx` | Detail or edit by id. |

### Offer

**Layout:** `app/(private)/offer/_layout.tsx`

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/offer/[id]` | `app/(private)/offer/[id].tsx` | Offer detail / apply flow for a specific offer id. |

---

## `(private)/(tabs)` — bottom tab bar

**Layout:** `app/(private)/(tabs)/_layout.tsx` — `Tabs` with five entries:

1. **`(home)`** — feed
2. **`my-care`** — care / contracts hub
3. **`post`** — center “+” opens modal; routes to `post-requests` or `post-availability` stacks above
4. **`messages`** — threads list + conversation
5. **`profile`** — own profile and nested settings

---

### Tab: Home (`(home)`)

**Layout:** `app/(private)/(tabs)/(home)/_layout.tsx` — `Stack`: `index`, `notifications`, `search`.

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/(tabs)/(home)` | `app/(private)/(tabs)/(home)/index.tsx` | Main feed / home. |
| `/(private)/(tabs)/(home)/notifications` | `app/(private)/(tabs)/(home)/notifications.tsx` | Notifications list (search, unread/read state, pull-to-refresh, deep-link navigation). |
| `/(private)/(tabs)/(home)/search` | `app/(private)/(tabs)/(home)/search.tsx` | Search. |

**Current behavior note:** foreground notification UX is handled via notification helpers under `src/lib/notifications/**` and a toast component at `src/shared/components/ui/NotificationToast.tsx`.

---

### Tab: My care (`my-care`)

**Layout:** `app/(private)/(tabs)/my-care/_layout.tsx` — `Stack`: `index`, `contract/[id]`, `checkin`, `review/[id]`.

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/(tabs)/my-care` | `app/(private)/(tabs)/my-care/index.tsx` | My care overview / list. |
| `/(private)/(tabs)/my-care/contract/[id]` | `app/(private)/(tabs)/my-care/contract/[id].tsx` | Single contract. |
| `/(private)/(tabs)/my-care/checkin` | `app/(private)/(tabs)/my-care/checkin.tsx` | Check-in flow. |
| `/(private)/(tabs)/my-care/review/[id]` | `app/(private)/(tabs)/my-care/review/[id].tsx` | Leave a review for id. |

---

### Tab: Post (`post`)

**Layout:** `app/(private)/(tabs)/post/_layout.tsx` — `Stack`: `index`, `choose`.  
Heavy wizards live under `/(private)/post-requests` and `/(private)/post-availability` (tab bar hidden there).

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/(tabs)/post` | `app/(private)/(tabs)/post/index.tsx` | Default post tab screen (if navigated directly). |
| `/(private)/(tabs)/post/choose` | `app/(private)/(tabs)/post/choose.tsx` | Choose what to post (used from tab stack). |

---

### Tab: Messages (`messages`)

**Layout:** `app/(private)/(tabs)/messages/_layout.tsx` — `Stack`: `index`, `[threadId]`.

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/(tabs)/messages` | `app/(private)/(tabs)/messages/index.tsx` | Thread list. |
| `/(private)/(tabs)/messages/[threadId]` | `app/(private)/(tabs)/messages/[threadId].tsx` | Single conversation. |

**Current behavior note:** thread list previews rely on denormalized thread fields (`last_message_preview`, `last_sender_id`) and render semantic preview chips for media/doc links (e.g. Photo / Document) instead of raw URLs.

---

### Tab: Profile (`profile`)

**Layout:** `app/(private)/(tabs)/profile/_layout.tsx` — `Stack`: `index`, `users/[id]`, `edit`, `emergency-contacts`, `points`.  
Additional sibling routes are still picked up by the file system (e.g. `settings.tsx`).

| Typical `href` | File | Notes |
| -------------- | ---- | ----- |
| `/(private)/(tabs)/profile` | `app/(private)/(tabs)/profile/index.tsx` | Own profile. |
| `/(private)/(tabs)/profile/users/[id]` | `app/(private)/(tabs)/profile/users/[id].tsx` | Another user’s public profile. |
| `/(private)/(tabs)/profile/edit` | `app/(private)/(tabs)/profile/edit.tsx` | Edit own profile. |
| `/(private)/(tabs)/profile/settings` | `app/(private)/(tabs)/profile/settings.tsx` | App / account settings. |
| `/(private)/(tabs)/profile/emergency-contacts` | `app/(private)/(tabs)/profile/emergency-contacts.tsx` | Emergency contacts. |
| `/(private)/(tabs)/profile/points` | `app/(private)/(tabs)/profile/points.tsx` | Points history. |

---

## Shared UI and business logic (not routes)

These are important for structure but are **not** separate pages:

| Area | Location (examples) |
| ---- | -------------------- |
| Feature UI | `src/features/**` |
| Shared components | `src/shared/**` |
| Stores (Zustand) | `src/lib/store/**` |
| Supabase client & types | `src/lib/supabase/**` |
| Notifications (push registration, foreground handling, unread count helpers) | `src/lib/notifications/**` |
| KYC gating helpers | `src/lib/kyc/**` |
| i18n | `src/lib/i18n/**` |
| Constants (colors, navigation) | `src/constants/**` |

---

## Keeping this in sync

When you add or move a file under `app/`, update this document (or regenerate from `glob app/**/*.tsx`). The **source of truth for URLs** is always the `app/` tree plus each segment’s `_layout.tsx` `Stack.Screen` / `Tabs.Screen` names.
