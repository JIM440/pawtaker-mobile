import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
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
