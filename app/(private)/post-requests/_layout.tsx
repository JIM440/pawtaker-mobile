import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";

/**
 * Launch care request flow — full-screen stack (no tab bar).
 */
export default function PostRequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...stackPerfScreenOptions }}>
      <Stack.Screen name="index" options={{ title: "Request Care" }} />
      <Stack.Screen name="[id]" options={{ title: "Request" }} />
    </Stack>
  );
}
