import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { removeSavedPushToken } from "@/src/lib/notifications/push";
import { supabase, SUPABASE_AUTH_STORAGE_KEY } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useForgotPasswordStore } from "@/src/lib/store/forgotPassword.store";
import { useKycStore } from "@/src/lib/store/kyc.store";
import { useSignupStore } from "@/src/lib/store/signup.store";

/** Legacy Supabase default storage key pattern (before explicit `storageKey`). */
function legacySupabaseAuthKeys(): string[] {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) return [];
  try {
    const host = new URL(url).hostname;
    const projectRef = host.split(".")[0];
    if (projectRef) {
      return [`sb-${projectRef}-auth-token`];
    }
  } catch {
    /* ignore */
  }
  return [];
}

/**
 * Deletes Supabase session keys from SecureStore/localStorage and clears client auth state.
 * Use from Settings (sign out) or when stuck (e.g. cannot reach Settings). Safe when already signed out.
 */
export async function wipeAuthStorageAndClientState(): Promise<void> {
  const uid = useAuthStore.getState().user?.id;
  if (uid) {
    try {
      await removeSavedPushToken(uid);
    } catch {
      /* non-blocking */
    }
  }

  try {
    await supabase.auth.signOut({ scope: "global" });
  } catch (e) {
    console.warn("[auth] supabase.auth.signOut", e);
  }

  const keysToRemove = new Set<string>([
    SUPABASE_AUTH_STORAGE_KEY,
    ...legacySupabaseAuthKeys(),
  ]);

  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {
          /* ignore */
        }
      });
    }
  } else {
    for (const k of keysToRemove) {
      try {
        await SecureStore.deleteItemAsync(k);
      } catch {
        /* key may not exist */
      }
    }
  }

  useAuthStore.getState().clearAuth();
  useSignupStore.getState().clearSignup();
  useKycStore.getState().clearKyc();
  useForgotPasswordStore.getState().clear();
}

/** Alias: full sign-out (clears SecureStore + client state). */
export async function performSignOut(): Promise<void> {
  await wipeAuthStorageAndClientState();
}
