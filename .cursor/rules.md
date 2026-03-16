# PawTaker Mobile — Cursor Rules

See CLAUDE.md at the project root for full guidelines.

## Quick Reference

### Stack
- Expo Router v6, React Native 0.81.5, NativeWind v4, Supabase, Zustand, React Query, react-i18next

### Component Pattern
```tsx
// src/features/<feature>/components/MyComponent.tsx
import { View, Text } from 'react-native';

interface MyComponentProps {
  title: string;
}

export function MyComponent({ title }: MyComponentProps) {
  return (
    <View className="bg-surface rounded-2xl p-4">
      <Text className="text-text-primary font-semibold">{title}</Text>
    </View>
  );
}
```

### Service Pattern
```ts
// src/features/<feature>/services/<feature>.service.ts
import { supabase } from '@/lib/supabase/client';

export async function getFeedRequests() {
  const { data, error } = await supabase
    .from('care_requests')
    .select('*, pets(*), users(*)')
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}
```

### Hook Pattern
```ts
// src/features/<feature>/hooks/useXxx.ts
import { useQuery } from '@tanstack/react-query';
import { getFeedRequests } from '../services/feed.service';

export function useFeed() {
  return useQuery({
    queryKey: ['feed', 'requests'],
    queryFn: getFeedRequests,
  });
}
```

### Do NOT
- Put business logic in `app/` route files
- Use StyleSheet.create (use NativeWind className instead)
- Hardcode colors (use className tokens or Colors constants)
- Add auth guards to individual screens (handled in app/_layout.tsx)
