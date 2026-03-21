import { Stack } from "expo-router";
import { Platform } from "react-native";

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        ...(Platform.OS !== "web" && { animation: "slide_from_right" }),
      }}
    >
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="signup/verify" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="forgot-password/verify" />
      <Stack.Screen name="forgot-password/new-password" />
      <Stack.Screen name="forgot-password/confirm-password" />
    </Stack>
  );
}
