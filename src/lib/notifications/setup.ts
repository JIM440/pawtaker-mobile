export {
  configureNotificationHandler,
  registerForPushNotificationsAsync,
  registerAndSavePushToken,
  removeSavedPushToken,
  savePushToken,
} from "./push";

/** @deprecated Use `registerAndSavePushToken` from `@/src/lib/notifications/push`. */
export async function setupNotifications(): Promise<string | null> {
  const { registerForPushNotificationsAsync } = await import("./push");
  return registerForPushNotificationsAsync();
}
