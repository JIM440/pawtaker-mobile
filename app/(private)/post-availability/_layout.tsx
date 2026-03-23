import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";
import { Platform } from "react-native";

/**
 * Post availability flow — full-screen stack (no tab bar).
 */
export default function PostAvailabilityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...stackPerfScreenOptions,
        ...(Platform.OS === "ios"
          ? { animation: "ios" as any, gestureEnabled: true }
          : {}),
      }}
    >
      <Stack.Screen name="index" options={{ title: "My Availability" }} />
      <Stack.Screen name="[id]" options={{ title: "Availability" }} />
    </Stack>
  );
}
