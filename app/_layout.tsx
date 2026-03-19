import "../global.css";
import "../src/lib/i18n";

import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold, useFonts
} from "@expo-google-fonts/roboto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { Platform } from "react-native";
import i18n from "../src/lib/i18n";
import { useAuthStore } from "../src/lib/store/auth.store";
import { useLanguageStore } from "../src/lib/store/language.store";
import { useThemeStore } from "../src/lib/store/theme.store";
import { supabase } from "../src/lib/supabase/client";

// Keep native splash visible until auth and fonts are ready
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
  const { resolvedTheme } = useThemeStore();
  const { language } = useLanguageStore();
  const { session, isLoading, setSession, setLoading, fetchProfile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  });

  // Bootstrap auth session once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ready = fontsLoaded && !isLoading;

  useEffect(() => {
    if (!ready) return;
    if (Platform.OS !== "web") SplashScreen.hideAsync();

    if (!session) {
      router.replace("/(auth)/welcome");
      return;
    }

    // Session exists — fetch profile to determine where to send the user
    fetchProfile(session.user.id).then(() => {
      const profile = useAuthStore.getState().profile;

      // Email not yet verified (check Supabase auth + optional DB field)
      const emailVerified =
        !!session.user.email_confirmed_at || !!profile?.is_email_verified;

      if (!emailVerified) {
        router.replace("/(auth)/signup/verify");
      } else if (!profile?.city) {
        // Profile not complete
        router.replace("/(auth)/signup/profile");
      } else if (
        !profile?.kyc_status ||
        profile.kyc_status === "not_submitted"
      ) {
        // KYC not started
        router.replace("/(auth)/kyc/submit");
      } else if (profile.kyc_status === "pending" || profile.kyc_status === "submitted") {
        // KYC waiting for admin
        router.replace("/(auth)/kyc/pending");
      } else {
        // Fully onboarded
        router.replace("/(private)/(tabs)");
      }
    });
  }, [ready, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(private)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={resolvedTheme === "dark" ? "light" : "dark"} />
      </I18nextProvider>
    </QueryClientProvider>
  );
}
