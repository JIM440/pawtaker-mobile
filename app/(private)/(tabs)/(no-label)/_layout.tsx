import { Stack } from "expo-router";

export default function NoLabelGroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="search" />
      <Stack.Screen name="users/[id]" />
    </Stack>
  );
}
