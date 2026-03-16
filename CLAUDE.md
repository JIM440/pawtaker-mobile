# PawTaker Mobile — Claude Code Guidelines

## Project Overview
Community P2P pet-sitting mobile app. Points-based (no money). 33 screens, 5 tabs.
- **Stack:** Expo ~54, React 19, React Native 0.81.5, TypeScript strict
- **Routing:** Expo Router v6 (file-based)
- **Styling:** NativeWind v4 (Tailwind CSS v3.4 for RN)
- **Data:** Supabase (PostgreSQL + Realtime + Auth + Storage)
- **State:** Zustand (persist to AsyncStorage)
- **Server state:** TanStack React Query v5
- **i18n:** react-i18next + expo-localization (EN + FR)

## Owner
- Mobile: Jim

## Folder Conventions
- `app/` — Expo Router route files ONLY (thin, no business logic)
- `src/features/<feature>/` — all feature logic
- `src/shared/` — cross-feature components, hooks, utils
- `src/lib/` — external client setup (supabase, store, i18n)
- `src/constants/` — design tokens only

## File Naming
- Files: `kebab-case.tsx`
- Components: `PascalCase` named export
- Hooks: `useXxx.ts`
- Services: `xxx.service.ts`

## Import Aliases
Use `@/` alias mapped to `src/` (see tsconfig.json).
```ts
import { Button } from '@/shared/components/ui/Button';
import { useAuthStore } from '@/lib/store/auth.store';
import { Colors } from '@/constants/colors';
```

## NativeWind Usage
Always use `className` prop with Tailwind utility classes.
Custom color tokens are in `tailwind.config.js` and match `src/constants/colors.ts`.
```tsx
<View className="flex-1 bg-background px-4">
  <Text className="text-text-primary text-lg font-semibold">Hello</Text>
</View>
```

## Supabase Patterns
```ts
// Always use typed client
import { supabase } from '@/lib/supabase/client';

// React Query + Supabase
const { data } = useQuery({
  queryKey: ['feed'],
  queryFn: () => supabase.from('care_requests').select('*').eq('status', 'open'),
});

// Auth guard is in app/_layout.tsx — do NOT add per-screen guards
```

## Zustand Stores
```ts
// Auth store — user + session
import { useAuthStore } from '@/lib/store/auth.store';
const { user, session } = useAuthStore();

// Theme / language stores persist to AsyncStorage automatically
```

## i18n
```ts
import { useTranslation } from 'react-i18next';
const { t } = useTranslation();
// Keys: auth.login.title, feed.title, errors.required, etc.
// See src/lib/i18n/locales/en.json for all keys
```

## Colour Tokens
| Token | Hex |
|-------|-----|
| primary | #1A3C5E |
| primaryLight | #4A90D9 |
| accent | #F5A623 |
| success | #27AE60 |
| warning | #E67E22 |
| danger | #C0392B |
| background | #F8F9FA |
| surface | #FFFFFF |
| textPrimary | #1A1A2E |
| textSecondary | #6B7280 |
| border | #E5E7EB |

## Screen Count
33 screens across 5 tab groups + standalone routes.
All stub screens created under `app/`. Implement business logic in `src/features/`.

## Environment Variables
Copy `.env.local` and fill in real values:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=
```
