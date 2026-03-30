import { Colors } from "@/src/constants/colors";
import { stackPerfScreenOptions } from "@/src/constants/navigation";
import { useNotificationToast } from "@/src/lib/notifications/useNotificationToast";
import { usePushRegistration } from "@/src/lib/notifications/usePushRegistration";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { navigateForNotificationPayload } from "@/src/features/notifications/notificationNavigation";
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
  usePushRegistration();
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
            navigateForNotificationPayload(router, { type: data.type, data });
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
        <Stack.Screen name="post-requests" options={{ headerShown: false }} />
        <Stack.Screen
          name="post-availability"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="offer" options={{ headerShown: false }} />
        <Stack.Screen name="kyc/index" options={{ headerShown: false }} />
        <Stack.Screen name="pets/add" options={{ title: "Add Pet" }} />
        <Stack.Screen name="pets/[id]" options={{ title: "Pet Profile" }} />
        <Stack.Screen name="pets/[id]/edit" options={{ title: "Edit Pet" }} />
      </Stack>
    </SafeAreaView>
  );
}
