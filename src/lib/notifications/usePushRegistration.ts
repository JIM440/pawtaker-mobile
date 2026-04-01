import { navigateForNotificationPayload } from "@/src/features/notifications/notificationNavigation";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

import { registerAndSavePushToken } from "./push";
import { shouldLoadExpoPushStack } from "./push-native-availability";

function parsePushData(
  data: unknown,
): { type: string; data: Record<string, unknown> } {
  if (!data || typeof data !== "object") {
    return { type: "", data: {} };
  }
  const o = data as Record<string, unknown>;
  const type = typeof o.type === "string" ? o.type : "";
  const nested =
    o.data && typeof o.data === "object"
      ? (o.data as Record<string, unknown>)
      : {};
  const merged = { ...nested, ...o };
  return { type, data: merged };
}

/**
 * Run inside the authenticated shell only. Registers for push after login
 * and re-syncs when the app returns to foreground.
 */
export function usePushRegistration(): void {
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const router = useRouter();
  const responseSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    console.log("[push-reg] useEffect fired — userId:", userId);
    if (!userId) {
      console.log("[push-reg] STOPPED: no userId");
      return;
    }
    if (!shouldLoadExpoPushStack()) {
      console.log("[push-reg] STOPPED: shouldLoadExpoPushStack = false");
      return;
    }

    void registerAndSavePushToken(userId);

    const onAppState = (state: AppStateStatus) => {
      if (state === "active") {
        void registerAndSavePushToken(userId);
      }
    };
    const sub = AppState.addEventListener("change", onAppState);

    return () => {
      sub.remove();
    };
  }, [userId]);

  useEffect(() => {
    if (!shouldLoadExpoPushStack() || !userId) return;

    let alive = true;

    void (async () => {
      try {
        const mod = await import("expo-notifications");
        const Notifications =
          mod && typeof mod === "object" && "getLastNotificationResponseAsync" in mod
            ? (mod as typeof import("expo-notifications"))
            : (mod as { default?: typeof import("expo-notifications") }).default;
        if (
          !Notifications ||
          typeof Notifications.getLastNotificationResponseAsync !== "function" ||
          typeof Notifications.addNotificationResponseReceivedListener !==
            "function"
        ) {
          return;
        }
        if (!alive) return;

        const last = await Notifications.getLastNotificationResponseAsync();
        if (!alive || !last?.notification) return;
        const { type, data } = parsePushData(
          last.notification.request.content.data,
        );
        if (type) {
          setTimeout(() => {
            if (alive) {
              navigateForNotificationPayload(router, { type, data });
            }
          }, 400);
        }

        if (!alive) return;
        const notificationSub =
          Notifications.addNotificationResponseReceivedListener((response) => {
            const { type, data } = parsePushData(
              response.notification.request.content.data,
            );
            if (type) {
              navigateForNotificationPayload(router, { type, data });
            }
          });
        if (!alive) {
          notificationSub.remove();
          return;
        }
        responseSub.current = notificationSub;
      } catch {
        /* native module missing (e.g. web mis-resolve) or dev client not rebuilt */
      }
    })();

    return () => {
      alive = false;
      if (responseSub.current) {
        responseSub.current.remove();
        responseSub.current = null;
      }
    };
  }, [userId, router]);
}
