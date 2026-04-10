import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function ChatLayout() {
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
      <Stack.Screen name="[threadId]" options={{ headerShown: false }} />
    </Stack>
  );
}
