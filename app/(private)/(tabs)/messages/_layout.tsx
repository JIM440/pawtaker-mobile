import { stackPerfScreenOptions } from '@/src/constants/navigation';
import { Stack } from 'expo-router';

export default function MessagesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...stackPerfScreenOptions }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[threadId]" options={{ headerShown: false }} />
    </Stack>
  );
}
