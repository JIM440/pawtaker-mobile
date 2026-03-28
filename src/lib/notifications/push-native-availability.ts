import { NativeModules, Platform, TurboModuleRegistry } from "react-native";

/**
 * Avoid importing `expo-notifications` / `expo-device` JS when the current
 * binary did not link their native modules (web, misconfigured run, or a stale
 * dev client). Those packages' entry files eagerly load native code and throw.
 */
export function shouldLoadExpoPushStack(): boolean {
  if (Platform.OS !== "ios" && Platform.OS !== "android") return false;

  const nm = NativeModules as Record<string, unknown>;

  const hasDevice = nm.ExpoDevice != null;
  const hasPush =
    nm.ExpoPushTokenManager != null || nm.ExponentPushTokenManager != null;

  if (hasDevice && hasPush) return true;

  try {
    const get = TurboModuleRegistry.get;
    if (typeof get !== "function") return false;
    const device = get.call(TurboModuleRegistry, "ExpoDevice");
    const push =
      get.call(TurboModuleRegistry, "ExpoPushTokenManager") ??
      get.call(TurboModuleRegistry, "ExponentPushTokenManager");
    return device != null && push != null;
  } catch {
    return false;
  }
}
