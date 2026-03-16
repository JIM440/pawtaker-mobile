import { Stack } from 'expo-router';

export default function PostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="choose" />
      <Stack.Screen name="request/index" />
      <Stack.Screen name="request/pet" options={{ headerShown: true, title: 'Select Pet' }} />
      <Stack.Screen name="request/details" options={{ headerShown: true, title: 'Care Details' }} />
      <Stack.Screen name="request/publish" options={{ headerShown: true, title: 'Review & Publish' }} />
      <Stack.Screen name="availability" options={{ headerShown: true, title: 'My Availability' }} />
    </Stack>
  );
}
