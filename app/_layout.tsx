import "../global.css";
import "../src/lib/i18n";

import { supabase } from "@/src/lib/supabase/client";
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from "@expo-google-fonts/roboto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import i18n from "../src/lib/i18n";
import { useAuthStore } from "../src/lib/store/auth.store";
import { useLanguageStore } from "../src/lib/store/language.store";
import { useThemeStore } from "../src/lib/store/theme.store";

// Keep native splash visible until fonts load, theme + language are rehydrated from AsyncStorage
// and applied, auth store is rehydrated, and session bootstrap finishes (see `ready`).
if (Platform.OS !== "web") {
  SplashScreen.preventAutoHideAsync();
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  const { resolvedTheme, _hasHydrated: themeHydrated } = useThemeStore();
  const { language, _hasHydrated: langHydrated } = useLanguageStore();
  const {
    isLoading,
    session,
    onboardingSeen,
    setSession,
    setProfile,
    setLoading,
    fetchProfile,
    _hasHydrated: authHydrated,
  } = useAuthStore();
  const segments = useSegments();

  // Keep i18n in sync when user changes language after startup (persist middleware also hydrates on launch).
  useEffect(() => {
    if (!langHydrated) return;
    void i18n.changeLanguage(language);
  }, [language, langHydrated]);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Bootstrap auth session once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        void fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const ready =
    fontsLoaded && !isLoading && themeHydrated && langHydrated && authHydrated;

  // Hide splash only after persisted theme/language are applied (see stores) and other gates pass.
  useLayoutEffect(() => {
    if (!ready) return;
    if (Platform.OS !== "web") void SplashScreen.hideAsync();
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const currentGroup = segments[0];
    const inAuth = currentGroup === "(auth)";
    const inPrivate = currentGroup === "(private)";

    if (!session) {
      if (!onboardingSeen) {
        if (!inAuth || segments[1] !== "onboarding") {
          router.replace("/(auth)/onboarding");
        }
        return;
      }
      if (inPrivate) {
        router.replace("/(private)/(tabs)");
      }
      return;
    }

    if (inAuth) {
      router.replace("/(private)/(tabs)");
    }
  }, [ready, session, onboardingSeen, segments]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(private)" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
        </I18nextProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
