import { Colors } from "@/src/constants/colors";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { router, Stack, usePathname } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

export default function AuthLayout() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const session = useAuthStore((s) => s.session);
  const onboardingSeen = useAuthStore((s) => s.onboardingSeen);
  const authHydrated = useAuthStore((s) => s._hasHydrated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const pathname = usePathname();

  /** Onboarding gate only — auth vs app is handled by Stack.Protected in root `_layout`. */
  useEffect(() => {
    if (!authHydrated || isLoading) return;
    if (session) return;

    if (!onboardingSeen) {
      const path = pathname.split("?")[0] ?? "";
      if (!path.startsWith("/onboarding")) {
        router.replace("/(auth)/onboarding");
      }
    }
  }, [session, onboardingSeen, authHydrated, isLoading, pathname]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
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
