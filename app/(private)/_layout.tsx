import { Platform } from 'react-native';
import { Stack } from 'expo-router';

/**
 * Private (authenticated) app shell: tabs + detail screens.
 * Native: slide_from_right so tab → detail feels like a push, not a full reload.
 * Web: navigation will still feel like page loads (Expo Router web limitation).
 */
export default function PrivateLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS !== 'web' && { animation: 'slide_from_right' }),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="users/[id]" options={{ headerShown: true, title: 'Profile' }} />
      <Stack.Screen name="requests/[id]" options={{ headerShown: true, title: 'Request' }} />
      <Stack.Screen name="offers/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="takers/[id]" options={{ headerShown: true, title: 'Taker' }} />
      <Stack.Screen name="pets/add" options={{ headerShown: true, title: 'Add Pet' }} />
      <Stack.Screen name="pets/[id]" options={{ headerShown: true, title: 'Pet Profile' }} />
      <Stack.Screen name="pets/[id]/edit" options={{ headerShown: true, title: 'Edit Pet' }} />
      <Stack.Screen name="settings" options={{ headerShown: true, title: 'Settings' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="search" options={{ headerShown: true, title: 'Search' }} />
    </Stack>
  );
}
