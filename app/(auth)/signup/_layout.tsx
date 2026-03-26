import { Stack } from "expo-router";
import React from "react";

const SignupLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verify" />
      <Stack.Screen name="profile" />
    </Stack>
  );
};

export default SignupLayout;
