import { Stack } from "expo-router";

const ForgotPasswordLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="new-password" />
      <Stack.Screen name="confirm-password" />
    </Stack>
  );
};

export default ForgotPasswordLayout;
