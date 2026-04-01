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

  const nm = NativeModules as Record<string, unknown>;
  const hasDevice = nm.ExpoDevice != null;
  const hasPush =
    nm.ExpoPushTokenManager != null || nm.ExponentPushTokenManager != null;

  console.log("[push-avail] NativeModules check — hasDevice:", hasDevice, "hasPush:", hasPush);

  if (hasDevice && hasPush) return true;

  try {
    const get = TurboModuleRegistry.get;
    if (typeof get !== "function") {
      console.log("[push-avail] TurboModuleRegistry.get not a function");
      return false;
    }
    const device = get.call(TurboModuleRegistry, "ExpoDevice");
    const push =
      get.call(TurboModuleRegistry, "ExpoPushTokenManager") ??
      get.call(TurboModuleRegistry, "ExponentPushTokenManager");
    console.log("[push-avail] TurboModule check — device:", device != null, "push:", push != null);
    return device != null && push != null;
  } catch (e) {
    console.log("[push-avail] TurboModuleRegistry threw:", e);
    return false;
  }
}
