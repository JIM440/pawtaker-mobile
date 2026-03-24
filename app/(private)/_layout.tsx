import { Colors } from "@/src/constants/colors";
import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { KycGlobalPrompt } from "@/src/shared/components/kyc/KycGlobalPrompt";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Private (authenticated) app shell: tabs + detail screens.
 * Access is gated by `Stack.Protected` in root `app/_layout.tsx`.
 */
export default function PrivateLayout() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

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
            ...(Platform.OS === "ios"
              ? { animation: "ios" as any, gestureEnabled: true }
              : Platform.OS !== "web"
                ? { animation: "slide_from_right" }
                : {}),
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
