import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { Stack } from "expo-router";

export default function OfferLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, ...stackPerfScreenOptions }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
