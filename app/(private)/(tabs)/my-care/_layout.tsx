import { Stack } from 'expo-router';

export default function MyCareLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="contract/[id]" options={{ headerShown: false, title: 'Contract' }} />
      <Stack.Screen name="checkin" options={{ headerShown: false, title: 'Check-in' }} />
      <Stack.Screen name="review/[id]" options={{ headerShown: false, title: 'Review' }} />
    </Stack>
  );
}
