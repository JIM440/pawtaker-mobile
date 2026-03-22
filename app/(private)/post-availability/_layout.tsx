import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";

/**
 * Post availability flow — full-screen stack (no tab bar).
 */
export default function PostAvailabilityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...stackPerfScreenOptions }}>
      <Stack.Screen name="index" options={{ title: "My Availability" }} />
      <Stack.Screen name="[id]" options={{ title: "Availability" }} />
    </Stack>
  );
}
