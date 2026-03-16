import { Stack } from 'expo-router';

export default function MyCareLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contract/[id]" options={{ headerShown: true, title: 'Contract' }} />
      <Stack.Screen name="checkin" options={{ headerShown: true, title: 'Check-in' }} />
      <Stack.Screen name="review/[id]" options={{ headerShown: true, title: 'Review' }} />
    </Stack>
  );
}
