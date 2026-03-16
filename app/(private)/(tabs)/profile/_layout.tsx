import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" options={{ headerShown: true, title: 'Edit Profile' }} />
      <Stack.Screen name="emergency-contacts" options={{ headerShown: true, title: 'Emergency Contacts' }} />
      <Stack.Screen name="points" options={{ headerShown: true, title: 'Points History' }} />
    </Stack>
  );
}
