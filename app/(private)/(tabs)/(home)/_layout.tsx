import { Stack } from "expo-router";

/** Home tab stack: feed, notifications, and search live together (no separate tab). */
export default function HomeStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="search" />
    </Stack>
  );
}
