import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform, AppState } from "react-native";

import { supabase } from "@/src/lib/supabase/client";

let lastRegisteredToken: string | null = null;
let handlerConfigured = false;

/** Call once at app startup (e.g. root layout). */
export function configureNotificationHandler(): void {
  if (handlerConfigured) return;
  handlerConfigured = true;

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
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1A3C5E",
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      return null;
    }

    const projectId = getEasProjectId();
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;
    lastRegisteredToken = token;
    return token;
  } catch (e) {
    console.warn("[push] registerForPushNotificationsAsync", e);
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
  const token = await registerForPushNotificationsAsync();
  if (!token) return;
  await savePushToken(userId, token);
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
