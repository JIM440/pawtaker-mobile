import Constants from "expo-constants";
import { AppState, Platform } from "react-native";

import { supabase } from "@/src/lib/supabase/client";

import { shouldLoadExpoPushStack } from "./push-native-availability";

let lastRegisteredToken: string | null = null;
let handlerConfigured = false;

type ExpoNotificationsModule = typeof import("expo-notifications");

/** Metro `import()` can expose named exports on `default` in some targets. */
function unwrapExpoNotificationsModule(
  mod: unknown,
): ExpoNotificationsModule | null {
  if (!mod || typeof mod !== "object") return null;
  const m = mod as Record<string, unknown>;
  if (typeof m.setNotificationHandler === "function") {
    return mod as ExpoNotificationsModule;
  }
  const d = m.default;
  if (
    d &&
    typeof d === "object" &&
    typeof (d as Record<string, unknown>).setNotificationHandler === "function"
  ) {
    return d as ExpoNotificationsModule;
  }
  return null;
}

/** Call once at app startup (e.g. root layout). */
export function configureNotificationHandler(): void {
  if (!shouldLoadExpoPushStack() || handlerConfigured) return;
  handlerConfigured = true;

  void import("expo-notifications")
    .then((mod) => {
      const Notifications = unwrapExpoNotificationsModule(mod);
      if (!Notifications?.setNotificationHandler) {
        handlerConfigured = false;
        return;
      }
      Notifications.setNotificationHandler({
        handleNotification: async (notification) => {
          const data = (notification.request.content.data || {}) as Record<
            string,
            unknown
          >;
          const isMessage = data?.type === "message";
          const isAppActive = AppState.currentState === "active";
          if (isMessage && isAppActive) {
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
            };
          }
          return {
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
            shouldShowBanner: true,
            shouldShowList: true,
          };
        },
      });
    })
    .catch((e) => {
      handlerConfigured = false;
      console.warn("[push] configureNotificationHandler", e);
    });
}

function getEasProjectId(): string | undefined {
  const extra = Constants.expoConfig?.extra as
    | { eas?: { projectId?: string } }
    | undefined;
  return (
    extra?.eas?.projectId ??
    (Constants as { easConfig?: { projectId?: string } }).easConfig
      ?.projectId
  );
}

/**
 * Requests permission and returns Expo push token (physical devices only).
 */
export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  console.log("[push] registerForPushNotificationsAsync called");

  if (!shouldLoadExpoPushStack()) {
    console.log("[push] STOPPED: shouldLoadExpoPushStack() = false");
    return null;
  }
  console.log("[push] shouldLoadExpoPushStack() = true");

  try {
    const [Device, mod] = await Promise.all([
      import("expo-device"),
      import("expo-notifications"),
    ]);
    const Notifications = unwrapExpoNotificationsModule(mod);
    if (!Notifications?.getExpoPushTokenAsync) {
      console.log("[push] STOPPED: could not unwrap expo-notifications module");
      return null;
    }

    console.log("[push] Device.isDevice =", Device.isDevice);
    if (!Device.isDevice) {
      console.log("[push] STOPPED: not a physical device (emulator/simulator)");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1A3C5E",
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    console.log("[push] existing permission status =", existing);
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("[push] after request, permission status =", finalStatus);
    }
    if (finalStatus !== "granted") {
      console.log("[push] STOPPED: permission not granted, status =", finalStatus);
      return null;
    }

    const projectId = getEasProjectId();
    console.log("[push] projectId =", projectId);
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;
    console.log("[push] token obtained =", token);
    lastRegisteredToken = token;
    return token;
  } catch (e) {
    console.warn("[push] registerForPushNotificationsAsync ERROR:", e);
    return null;
  }
}

export async function savePushToken(
  userId: string,
  token: string,
): Promise<boolean> {
  try {
    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        token,
        platform: Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : Platform.OS,
      },
      { onConflict: "user_id,token" },
    );
    if (error) {
      console.warn("[push] savePushToken", error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[push] savePushToken", e);
    return false;
  }
}

export async function registerAndSavePushToken(
  userId: string,
): Promise<void> {
  console.log("[push] registerAndSavePushToken called for userId =", userId);
  const token = await registerForPushNotificationsAsync();
  if (!token) {
    console.log("[push] STOPPED: no token returned");
    return;
  }
  console.log("[push] saving token to Supabase...");
  await savePushToken(userId, token);
  console.log("[push] token saved successfully");
}

/** Remove this device's token row for the user (call before sign-out). */
export async function removeSavedPushToken(userId: string): Promise<void> {
  const token = lastRegisteredToken;
  if (!token) return;
  try {
    const { error } = await supabase
      .from("push_tokens")
      .delete()
      .eq("user_id", userId)
      .eq("token", token);
    if (error) console.warn("[push] removeSavedPushToken", error);
  } catch (e) {
    console.warn("[push] removeSavedPushToken", e);
  } finally {
    lastRegisteredToken = null;
  }
}

export function getLastRegisteredPushToken(): string | null {
  return lastRegisteredToken;
}
