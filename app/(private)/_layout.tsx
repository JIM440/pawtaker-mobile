import { Colors } from "@/src/constants/colors";
import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { useLocationBackfill } from "@/src/lib/location/useLocationBackfill";
import { useNotificationToast } from "@/src/lib/notifications/useNotificationToast";
import { usePushRegistration } from "@/src/lib/notifications/usePushRegistration";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { navigateForNotificationPayloadAsync } from "@/src/features/notifications/notificationNavigation";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { KycGlobalPrompt } from "@/src/shared/components/kyc/KycGlobalPrompt";
import { NotificationToast } from "@/src/shared/components/ui/NotificationToast";
import { Stack, useRouter } from "expo-router";
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
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  usePushRegistration();
  useLocationBackfill();
  const { toast, dismissToast } = useNotificationToast();

  return (
    <SafeAreaView
      className={`flex-1`}
      style={{ backgroundColor: colors.background }}
      edges={["top", "bottom"]}
    >
      <StatusBar style={resolvedTheme === "light" ? "dark" : "light"} />
      <KycGlobalPrompt />
      <NotificationToast
        notification={toast}
        onDismiss={dismissToast}
        onPress={(data) => {
          dismissToast();
          if (data?.type) {
            void navigateForNotificationPayloadAsync(
              router,
              { type: data.type, data },
              { currentUserId: userId },
            );
          }
        }}
      />
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
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="post-requests" options={{ headerShown: false }} />
        <Stack.Screen
          name="post-availability"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="offer" options={{ headerShown: false }} />
        <Stack.Screen name="kyc/index" options={{ headerShown: false }} />
        <Stack.Screen name="pets" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaView>
  );
}
