import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";
import { Platform } from "react-native";

/**
 * Launch care request flow — full-screen stack (no tab bar).
 */
export default function PostRequestsLayout() {
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
      <Stack.Screen name="index" options={{ title: "Request Care" }} />
      <Stack.Screen name="[id]" options={{ title: "Request" }} />
    </Stack>
  );
}
