import { navigateForNotificationPayload } from "@/src/features/notifications/notificationNavigation";
import { useAuthStore } from "@/src/lib/store/auth.store";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus, Platform } from "react-native";

import {
  registerAndSavePushToken,
} from "./push";

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
  const responseSub = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web" || !userId) return;

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
    if (Platform.OS === "web" || !userId) return;

    let alive = true;
    void (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (!alive || !last?.notification) return;
        const { type, data } = parsePushData(
          last.notification.request.content.data,
        );
        if (type) {
          setTimeout(() => {
            navigateForNotificationPayload(router, { type, data });
          }, 400);
        }
      } catch {
        /* ignore */
      }
    })();

    responseSub.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { type, data } = parsePushData(
          response.notification.request.content.data,
        );
        if (type) {
          navigateForNotificationPayload(router, { type, data });
        }
      },
    );

    return () => {
      alive = false;
      if (responseSub.current) {
        responseSub.current.remove();
        responseSub.current = null;
      }
    };
  }, [userId, router]);
}
