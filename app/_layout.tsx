import '../global.css';
import '../src/lib/i18n';

import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from '@expo-google-fonts/roboto';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
} from '@expo-google-fonts/roboto';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/lib/i18n';
import { supabase } from '../src/lib/supabase/client';
import { useAuthStore } from '../src/lib/store/auth.store';
import { useThemeStore } from '../src/lib/store/theme.store';

// Keep native splash visible until auth and fonts are ready
if (Platform.OS !== 'web') {
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
  const { session, isLoading, setSession, setLoading } = useAuthStore();
  const router = useRouter();

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

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ready = fontsLoaded && !isLoading;

  useEffect(() => {
    if (!ready) return;
    if (Platform.OS !== 'web') SplashScreen.hideAsync();
    if (session) {
      router.replace('/(private)/(tabs)');
    } else {
      router.replace('/(auth)/welcome');
    }
  }, [ready, session]);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(private)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
      </I18nextProvider>
    </QueryClientProvider>
  );
}
