import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React, { useEffect, useRef, useState } from "react";
import {
  NativeModules,
  Platform,
  StyleSheet,
  TurboModuleRegistry,
  View,
} from "react-native";
import { AppText } from "./AppText";

type BannerState = "offline" | "online" | null;

export function NetworkStatusBar() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [state, setState] = useState<BannerState>(null);
  const prevOnline = useRef<boolean | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    // In Expo Go (or when the app hasn't been rebuilt), the NetInfo native module
    // may not exist. Importing `@react-native-community/netinfo` will throw at
    // module init time, so we must check native availability first.
    const hasNativeNetInfo =
      Boolean((NativeModules as any)?.RNCNetInfo) ||
      Boolean((TurboModuleRegistry as any)?.get?.("RNCNetInfo"));
    if (!hasNativeNetInfo) return;

    const clearTimer = () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      // `require()` must be guarded; the module can throw at init.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const NetInfo = require("@react-native-community/netinfo").default;
      unsubscribe = NetInfo.addEventListener((netState: any) => {
        const online =
          netState.isConnected !== false && netState.isInternetReachable !== false;

        if (prevOnline.current === null) {
          prevOnline.current = online;
          if (!online) setState("offline");
          return;
        }

        if (!online) {
          clearTimer();
          setState("offline");
        } else if (prevOnline.current === false && online) {
          setState("online");
          clearTimer();
          hideTimerRef.current = setTimeout(() => {
            setState(null);
            hideTimerRef.current = null;
          }, 5000);
        }

        prevOnline.current = online;
      });
    } catch {
      // Native module missing or not linked — skip banner.
      return () => {
        cancelled = true;
        clearTimer();
        unsubscribe?.();
      };
    }

    return () => {
      cancelled = true;
      clearTimer();
      unsubscribe?.();
    };
  }, []);

  if (!state) return null;

  const isOffline = state === "offline";
  return (
    <View
      pointerEvents="none"
      style={[
        styles.container,
        {
          backgroundColor: isOffline
            ? colors.surfaceContainer
            : colors.primaryContainer,
          borderTopColor: colors.outlineVariant,
        },
      ]}
    >
      <AppText
        variant="body"
        color={isOffline ? colors.onSurfaceVariant : colors.onPrimaryContainer}
        style={styles.text}
      >
        {isOffline ? "No internet connection" : "Back online"}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3000,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
