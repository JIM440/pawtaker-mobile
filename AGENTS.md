# PawTaker Mobile — Codex Guidelines

## Project Overview
Community P2P pet-sitting mobile app. Points-based (no money). 33 screens, 5 tabs.
Owner: Jim (mobile).

- **Stack:** Expo ~54, React 19, React Native 0.81.5, TypeScript strict
- **Routing:** Expo Router v6 (file-based)
- **Styling:** NativeWind v4 (Tailwind CSS v3.4 for RN)
- **Data:** Supabase (PostgreSQL + Realtime + Auth + Storage)
- **State:** Zustand (persisted to AsyncStorage)
- **Server state:** TanStack React Query v5
- **i18n:** react-i18next + expo-localization (EN + FR)
- **Images:** Cloudinary (upload via `src/lib/cloudinary/upload.ts`)

---

## Folder Conventions

```
app/                        # Expo Router route files ONLY — thin shells, no business logic
src/
  features/<feature>/       # All domain logic for a feature
    components/             # Feature-specific components
    hooks/                  # Custom hooks (data fetching, form logic)
    services/               # Business logic functions
    types.ts                # Feature-scoped TypeScript interfaces
  shared/
    components/
      ui/                   # Primitive building blocks (Button, TextField, etc.)
      cards/                # Composite card components
      forms/                # Form-specific components
      feedback/             # Empty states, error states, skeletons
      skeletons/            # Loading skeleton variants
    hooks/                  # Cross-feature hooks
  lib/
    store/                  # Zustand stores (xxx.store.ts)
    supabase/               # client.ts, types.ts, errors.ts, google-auth.ts
    i18n/                   # index.ts + locales/en.json + locales/fr.json
    notifications/          # push.ts, in-app.ts, usePushRegistration.ts
    cloudinary/             # upload.ts
    contracts/              # ensureCareContract.ts, request-eligibility.ts
    location/               # geocode.ts, useLocationGate.ts, useLocationBackfill.ts
    kyc/                    # kyc-gate.ts
    points/                 # carePoints.ts
    auth/                   # perform-sign-out.ts
    blocks/                 # user-blocks.ts
    datetime/               # localDate.ts, request-date-time-format.ts
    messages/               # get-or-create-thread.ts
    pets/                   # parsePetNotes.ts, petGalleryUrls.ts
    user/                   # displayName.ts
  constants/                # Design tokens only (colors.ts, typography.ts, navigation.ts, etc.)
supabase/
  migrations/               # 23+ SQL migration files (source of truth for DB schema)
  functions/                # Edge functions (push notifications)
```

---

## File Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase` named export
- Hooks: `useXxx.ts`
- Stores: `xxx.store.ts`
- Services: `xxx.service.ts` or descriptive `verb-noun.ts`

---

## Import Aliases
Use `@/` mapped to `src/` (tsconfig.json).

```ts
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/lib/store/auth.store';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase/client';
```

---

## Navigation Structure

```
app/
  _layout.tsx                     # Root: QueryClient, i18n, theme, session guard
  (auth)/
    _layout.tsx                   # Onboarding gate
    onboarding/index.tsx
    welcome.tsx
    login.tsx
    signup/index.tsx, profile.tsx, verify.tsx
    forgot-password/index.tsx, verify.tsx, new-password.tsx, confirm-password.tsx
  (private)/
    _layout.tsx                   # KYC prompt, push registration, Realtime setup
    (tabs)/
      _layout.tsx                 # Bottom tab bar
      (home)/index.tsx            # Pet feed & taker discovery
      (home)/notifications.tsx    # In-app notification list
      (home)/search.tsx           # Location-based taker search
      my-care/index.tsx           # Contracts given/received
      my-care/checkin.tsx         # Submit photo check-ins
      my-care/contract/[id].tsx   # Contract detail & signing
      my-care/review/[id].tsx     # Rate & review post-care
      post/index.tsx              # Modal trigger
      post/choose.tsx             # Select request vs availability
      messages/index.tsx          # Thread list
      messages/[threadId].tsx     # Chat detail & proposals
      profile/index.tsx           # Current user profile
      profile/edit.tsx            # Edit bio, avatar, details
      profile/settings.tsx        # Theme, language, account
      profile/emergency-contacts.tsx
      profile/points.tsx          # Points history & balance
      profile/users/[id].tsx      # View another user's profile
    kyc/index.tsx
    pets/add.tsx, [id].tsx, [id]/edit.tsx
    post-requests/index.tsx, [id].tsx
    post-availability/index.tsx, [id].tsx
    offer/[id].tsx
```

**Rules:**
- Auth guard lives in `app/_layout.tsx` via `Stack.Protected` — do NOT add per-screen guards.
- KYC prompt/gate is in `app/(private)/_layout.tsx`.
- Tab performance options: use `tabPerfScreenOptions` from `src/constants/navigation.ts`.

---

## Database Schema (Key Tables)

### `users`
`id, email, full_name, avatar_url, bio, city, latitude, longitude`
`kyc_status: 'not_submitted' | 'pending' | 'submitted' | 'approved' | 'rejected'`
`points_balance, points_alltime_high, care_given_count, care_received_count`
`is_verified, is_email_verified, is_deactivated, is_admin`
`language, theme_pref, auth_type, has_had_pet`

### `pets`
`id, owner_id, name, species, breed, yard_type, age_range, energy_level`
`has_special_needs, special_needs_description, age_years, weight_kg`
`photo_urls (text[]), notes`

### `care_requests`
`id, owner_id, pet_id, taker_id`
`care_type: 'daytime' | 'playwalk' | 'overnight' | 'vacation'`
`status: 'open' | ... (default 'open')`
`start_date, end_date, start_time, end_time, points_offered`

### `contracts`
`id, request_id, owner_id, taker_id`
`signed_owner, signed_taker (boolean)`
`status: 'draft' | 'signed' | 'active' | 'completed'`

### `check_ins`
`id, contract_id, taker_id, photo_urls (text[]), note, checked_in_at`

### `reviews`
Links contracts → ratings & written feedback.

### `threads`
`id, participant_ids (uuid[]), request_id, last_message_at, last_message_preview, last_sender_id`

### `messages`
`id, thread_id, sender_id, content, type, read_at, created_at`

### `taker_profiles`
`user_id, availability_json, accepted_species (text[])`

### `notifications`
`user_id, type, title, body, data (jsonb), read, created_at`

### `pet_likes`
`user_id, pet_id, care_request_id`

### `user_blocks`
`user_id, blocked_user_id`

### `push_tokens`
`user_id, token, device_id, platform`

---

## Supabase Patterns

```ts
// Always use the typed client
import { supabase } from '@/lib/supabase/client';

// React Query + Supabase
const { data, isLoading } = useQuery({
  queryKey: ['feed'],
  queryFn: () => supabase.from('care_requests').select('*').eq('status', 'open'),
});

// Realtime subscription (cleanup on unmount)
useEffect(() => {
  const channel = supabase
    .channel('threads')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'threads' }, handler)
    .subscribe();
  return () => void supabase.removeChannel(channel);
}, []);
```

React Query global config (in root `_layout.tsx`):
- `staleTime`: 5 minutes
- `retry`: 2
- `refetchOnWindowFocus`: false

---

## Zustand Stores

| Store | File | Key State | Persisted |
|-------|------|-----------|-----------|
| Auth | `auth.store.ts` | `user`, `session`, `profile`, `isInRecoveryFlow`, `onboardingSeen` | `onboardingSeen` |
| Theme | `theme.store.ts` | `theme`, `resolvedTheme` | `theme` |
| Language | `language.store.ts` | `language` | `language` |
| Toast | `toast.store.ts` | `showToast`, `dismissToast` | No |
| KYC | `kyc.store.ts` | Document type, file URIs | No |
| KYC Gate | `kyc-gate.store.ts` | Blocks posting if KYC not approved | No |
| Signup | `signup.store.ts` | Multi-step signup form state | No |
| Forgot Password | `forgotPassword.store.ts` | Password reset flow state | No |

```ts
const { user, session, profile } = useAuthStore();
const { theme } = useThemeStore();
const { showToast } = useToastStore();
```

---

## Feature Hooks Pattern

Hooks in `src/features/<feature>/hooks/` follow this pattern:

```ts
export function useThreads() {
  const { session } = useAuthStore();
  const [threads, setThreads] = useState<ThreadWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    // supabase query
  }, [session?.user.id]);

  useEffect(() => { void fetchThreads(); }, [fetchThreads]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(...).on(...).subscribe();
    return () => void supabase.removeChannel(channel);
  }, [session?.user.id, fetchThreads]);

  return { threads, loading, error, refetch: fetchThreads };
}
```

---

## Features Overview

| Feature | Path | What it does |
|---------|------|-------------|
| auth | `src/features/auth/` | Signup, login, OTP verify, password recovery, onboarding |
| feed | `src/features/feed/` | Browse available takers & open care requests |
| home | `src/features/home/` | Home tab action menu (quick taker actions) |
| messages | `src/features/messages/` | Real-time threads, chat, proposal messages |
| my-care | `src/features/my-care/` | Active contracts, check-ins, post-care reviews |
| notifications | `src/features/notifications/` | In-app + push notifications, deep-link routing |
| pets | `src/features/pets/` | Add, edit, delete pets; photo gallery |
| post | `src/features/post/` | Create care requests & availability posts |
| profile | `src/features/profile/` | User profile, bio, reviews, settings, points |
| requests | `src/features/requests/` | View care requests from other users |
| search | `src/features/search/` | Location-based taker discovery |
| kyc | `src/features/kyc/` | ID verification flow |

---

## Shared Component Library

### UI Primitives (`src/shared/components/ui/`)
- **Inputs**: `TextField`, `Input`, `OtpInput`, `DateTimeField`, `SearchField`
- **Selectors**: `ChipSelector`, `DaySelector`, `CareTypeSelector`, `PetKindSelector`, `RadioGroup`
- **Buttons**: `Button` — variants: `primary | secondary | outline | ghost | danger | inverse`
- **Display**: `AppText`, `Badge`, `StarRatingInput`, `RatingSummary`, `AppSwitch`
- **Modals**: `FeedbackModal`, `ImageViewerModal`
- **Layout**: `Card`, `Skeleton`, `StepProgress`, `TabBar`, `PetGridTile`, `RangeSlider`
- **Notifications**: `NotificationToast`, `ToastHost`
- **User**: `ProfileAvatar`, `UserAvatar`, `NetworkStatusBar`

### Cards (`src/shared/components/cards/`)
`PetCard`, `PetCardBase`, `ProfilePetCard`, `LikedPetCard`, `TakerCard`
`CaretakerInfo`, `ReviewCard`, `NotificationCard`, `AvailabilityPreviewCard`

### Feedback States (`src/shared/components/feedback/`)
`DataState`, `EmptyState`, `ErrorState`, `IllustratedEmptyState`, `ResourceMissingState`

### Skeletons (`src/shared/components/skeletons/`)
Variants for: Feed, MyCard, Profile, Notifications, PetSelect, DetailScreen (9 total)

### Layout (`src/shared/components/`)
`BackHeader`, `PageContainer`

---

## NativeWind Usage

Always use `className` prop with Tailwind utility classes.

```tsx
<View className="flex-1 bg-background px-4">
  <Text className="text-text-primary text-lg font-semibold">Hello</Text>
</View>
```

Custom color tokens are in `tailwind.config.js` and match `src/constants/colors.ts`.

**Do not use `StyleSheet.create`** — use NativeWind className exclusively.

---

## Colour Tokens

| Token | Usage |
|-------|-------|
| `primary` | #1A3C5E — main brand |
| `primaryLight` | #4A90D9 — lighter brand |
| `accent` | #F5A623 — highlights |
| `success` | #27AE60 |
| `warning` | #E67E22 |
| `danger` | #C0392B |
| `background` | #F8F9FA |
| `surface` | #FFFFFF |
| `textPrimary` | #1A1A2E |
| `textSecondary` | #6B7280 |
| `border` | #E5E7EB |

Light/dark mode variants are defined in `src/constants/colors.ts` and matched in `tailwind.config.js`.

---

## i18n

```ts
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// t('auth.login.title'), t('common.save'), t('errors.required')
```

Key namespaces in `src/lib/i18n/locales/en.json`:
- `common.*` — labels: save, cancel, loading, error, back, etc.
- `auth.{login,signup,welcome,forgotPassword}.*`
- `feed.title`, `myCare.title`, `post.title`, `messages.title`, `profile.title`
- `home.sendRequest.*`
- `pet.detail.*`
- `errors.*` — validation & error messages
- `notFound.*`
- `app.name` → "PawTaker"

Always add new keys to BOTH `en.json` and `fr.json`. Check existing keys before creating new ones.

Device language auto-detected via `expo-localization`. Falls back to EN if unsupported.

---

## Gates & Guards

| Gate | File | What it blocks |
|------|------|----------------|
| Auth guard | `app/_layout.tsx` (`Stack.Protected`) | All private routes — no session |
| KYC gate | `src/lib/kyc/kyc-gate.ts` + `kyc-gate.store.ts` | Posting until KYC approved |
| Location gate | `src/lib/location/useLocationGate.ts` | Taker/feed features without coordinates |
| Recovery flow | `auth.store.ts` (`isInRecoveryFlow`) | Normal nav during password reset |

---

## Business Rules

- **Points system**: Owners spend points; takers earn points. Formula in `src/lib/points/carePoints.ts`.
- **Care types**: `daytime | playwalk | overnight | vacation` — each maps to different point costs.
- **Contracts**: Must be signed by both parties (`signed_owner`, `signed_taker`) before status → `active`.
- **Check-ins**: Takers submit photo + note during active contracts via `my-care/checkin`.
- **Reviews**: Only after contract reaches `completed` status.
- **Blocking**: `src/lib/blocks/user-blocks.ts` — blocked users don't appear in feed or messages.
- **Message soft-delete**: Users can delete their own messages (migration `20260511_messages_delete_own.sql`).
- **Notifications**: 14+ types trigger via Postgres triggers (see migrations). Push via Supabase Edge Function.

---

## Notification Types
`pet_added`, `availability_posted`, `review_received`, `kyc_approved`, `kyc_rejected`,
`care_request_received`, `contract_signed`, `contract_active`, `contract_completed`,
`check_in_received`, `message_received`, `proposal_received`, `proposal_accepted`, `proposal_declined`

Deep-link routing is handled by `src/features/notifications/notificationNavigation.ts`.

---

## Key File Paths

| Purpose | Path |
|---------|------|
| Root layout | `app/_layout.tsx` |
| Private shell | `app/(private)/_layout.tsx` |
| Tabs shell | `app/(private)/(tabs)/_layout.tsx` |
| Supabase client | `src/lib/supabase/client.ts` |
| Supabase types | `src/lib/supabase/types.ts` |
| Auth store | `src/lib/store/auth.store.ts` |
| i18n setup | `src/lib/i18n/index.ts` |
| EN locale | `src/lib/i18n/locales/en.json` |
| FR locale | `src/lib/i18n/locales/fr.json` |
| Color tokens | `src/constants/colors.ts` |
| Navigation constants | `src/constants/navigation.ts` |
| Pet kinds | `src/constants/pet-kinds.ts` |
| Input limits | `src/constants/input-limits.ts` |
| Points formula | `src/lib/points/carePoints.ts` |
| Notification routing | `src/features/notifications/notificationNavigation.ts` |
| Get/create thread | `src/lib/messages/get-or-create-thread.ts` |
| Eligibility check | `src/lib/contracts/request-eligibility.ts` |

---

## Environment Variables

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```

---

## What NOT to do

- Do NOT add business logic inside `app/` route files — keep them thin shells.
- Do NOT add per-screen auth guards — the root layout handles this.
- Do NOT use `StyleSheet.create` — use NativeWind `className`.
- Do NOT hardcode colors — use Tailwind tokens from `tailwind.config.js`.
- Do NOT hardcode strings — use `t()` from i18n.
- Do NOT duplicate i18n keys — check `en.json` before adding new ones.
- Do NOT create new Zustand stores for ephemeral state — use `useState` or React Query.
- Do NOT skip adding keys to both `en.json` and `fr.json`.
