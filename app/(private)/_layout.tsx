import { Colors } from "@/src/constants/colors";
import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { KycGlobalPrompt } from "@/src/shared/components/kyc/KycGlobalPrompt";
import { router, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Private (authenticated) app shell: tabs + detail screens.
 * Native: slide_from_right so tab → detail feels like a push, not a full reload.
 * Web: navigation will still feel like page loads (Expo Router web limitation).
 */
export default function PrivateLayout() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const session = useAuthStore((s) => s.session);
  const guestMode = useAuthStore((s) => s.guestMode);
  const authHydrated = useAuthStore((s) => s._hasHydrated);
  const isLoading = useAuthStore((s) => s.isLoading);

  /** Only runs while this layout is mounted — not during welcome → login navigation. */
  useEffect(() => {
    if (!authHydrated || isLoading) return;
    if (!session && !guestMode) {
      router.replace("/welcome");
    }
  }, [session, guestMode, authHydrated, isLoading]);

  return (
    <SafeAreaView
      className={`flex-1`}
      style={{ backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <StatusBar style={resolvedTheme === "light" ? "dark" : "light"} />
      <KycGlobalPrompt />
      <Stack
        screenOptions={{
          headerShown: false,
          ...stackPerfScreenOptions,
          ...(Platform.OS !== "web" && { animation: "slide_from_right" }),
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="post-requests" options={{ headerShown: false }} />
        <Stack.Screen name="post-availability" options={{ headerShown: false }} />
        <Stack.Screen name="offer" options={{ headerShown: false }} />
        <Stack.Screen name="kyc" options={{ headerShown: false }} />
        <Stack.Screen name="takers/[id]" options={{ title: "Taker" }} />
        <Stack.Screen name="pets/add" options={{ title: "Add Pet" }} />
        <Stack.Screen name="pets/[id]" options={{ title: "Pet Profile" }} />
        <Stack.Screen name="pets/[id]/edit" options={{ title: "Edit Pet" }} />
        {/* Home stack: (tabs)/(home)/notifications, search — nested in (tabs) */}
        <Stack.Screen
          name="(tabs)/(home)/notifications"
          options={{ title: "Notifications" }}
        />
        <Stack.Screen
          name="(tabs)/(home)/search"
          options={{ title: "Search" }}
        />
        <Stack.Screen
          name="(tabs)/profile/users/[id]"
          options={{ title: "Profile" }}
        />
      </Stack>
    </SafeAreaView>
  );
}
