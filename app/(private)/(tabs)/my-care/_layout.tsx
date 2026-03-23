import { stackPerfScreenOptions } from '@/src/constants/navigation';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function MyCareLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...stackPerfScreenOptions,
        ...(Platform.OS === 'ios'
          ? { animation: 'ios' as any, gestureEnabled: true }
          : {}),
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="contract/[id]" options={{ headerShown: false, title: 'Contract' }} />
      <Stack.Screen name="checkin" options={{ headerShown: false, title: 'Check-in' }} />
      <Stack.Screen name="review/[id]" options={{ headerShown: false, title: 'Review' }} />
    </Stack>
  );
}
