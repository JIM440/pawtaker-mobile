import { Stack } from "expo-router";
import React from "react";

const PetsLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="add" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
};

export default PetsLayout;
