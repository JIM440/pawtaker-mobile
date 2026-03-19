import { Stack } from 'expo-router';

export default function PostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="requests" options={{ title: 'Request Care' }} />
      <Stack.Screen name="availability" options={{ title: 'My Availability' }} />
    </Stack>
  );
}
