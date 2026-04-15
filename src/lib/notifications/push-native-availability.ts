import { NativeModules, Platform, TurboModuleRegistry } from "react-native";

/**
 * Avoid importing `expo-notifications` / `expo-device` JS when the current
 * binary did not link their native modules (web, misconfigured run, or a stale
 * dev client). Those packages' entry files eagerly load native code and throw.
 */
export function shouldLoadExpoPushStack(): boolean {
  console.log("[push-avail] Platform.OS =", Platform.OS);
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    console.log("[push-avail] BLOCKED: not ios/android");
    return false;
  }

  // On newer RN/Expo (bridgeless / new architecture), `NativeModules` can be empty
  // even when Expo modules are correctly linked. Instead of guessing, allow the
  // push registration code to attempt dynamic imports and handle failures there.
  console.log("[push-avail] Allowing push stack on ios/android (bridgeless-safe).");
  return true;

  const nm = NativeModules as Record<string, unknown>;
  // Module names vary across Expo / RN versions. On some builds the token manager
  // isn't exposed directly even though expo-notifications is linked.
  const hasDevice = nm.ExpoDevice != null;
  const hasPushTokenManager =
    nm.ExpoPushTokenManager != null || nm.ExponentPushTokenManager != null;
  const hasNotificationsModule =
    nm.ExpoNotifications != null ||
    nm.EXNotifications != null ||
    nm.ExpoNotificationPresenter != null ||
    nm.ExpoNotificationScheduler != null;
  const hasPush = hasPushTokenManager || hasNotificationsModule;

  console.log(
    "[push-avail] NativeModules check — hasDevice:",
    hasDevice,
    "hasPush:",
    hasPush,
    "(tokenManager:",
    hasPushTokenManager,
    "notificationsModule:",
    hasNotificationsModule,
    ")",
  );

  if (hasDevice && hasPush) return true;

  try {
    const get = TurboModuleRegistry.get;
    if (typeof get !== "function") {
      console.log("[push-avail] TurboModuleRegistry.get not a function");
      console.log("[push-avail] Available NativeModules keys:", Object.keys(nm));
      return false;
    }
    const device = get.call(TurboModuleRegistry, "ExpoDevice");
    const push =
      get.call(TurboModuleRegistry, "ExpoPushTokenManager") ??
      get.call(TurboModuleRegistry, "ExponentPushTokenManager") ??
      get.call(TurboModuleRegistry, "ExpoNotifications") ??
      get.call(TurboModuleRegistry, "EXNotifications");
    console.log(
      "[push-avail] TurboModule check — device:",
      device != null,
      "push:",
      push != null,
    );
    if (device != null && push != null) return true;

    console.log("[push-avail] Available NativeModules keys:", Object.keys(nm));
    return false;
  } catch (e) {
    console.log("[push-avail] TurboModuleRegistry threw:", e);
    console.log("[push-avail] Available NativeModules keys:", Object.keys(nm));
    return false;
  }
}
