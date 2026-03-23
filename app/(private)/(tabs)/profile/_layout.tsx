import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function ProfileLayout() {
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
      <Stack.Screen name="users/[id]" options={{ title: "Profile" }} />
      <Stack.Screen name="edit" options={{ title: "Edit Profile" }} />
      <Stack.Screen
        name="emergency-contacts"
        options={{ title: "Emergency Contacts" }}
      />
      <Stack.Screen name="points" options={{ title: "Points History" }} />
    </Stack>
  );
}
