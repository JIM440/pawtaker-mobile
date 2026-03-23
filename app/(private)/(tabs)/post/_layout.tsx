import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";
import { Platform } from "react-native";

/**
 * Post tab: lightweight stack (modal entry from + button). Wizards live under
 * `/(private)/post-requests` and `/(private)/post-availability` so the tab bar stays hidden there.
 */
export default function PostTabLayout() {
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
      <Stack.Screen name="index" />
      <Stack.Screen name="choose" options={{ title: "Post" }} />
    </Stack>
  );
}
