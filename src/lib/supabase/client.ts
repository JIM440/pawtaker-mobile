import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Database } from './types';

// SecureStore is not available on web (getValueWithKeyAsync is native-only). Use localStorage on web.
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) => Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null),
        setItem: (key: string, value: string) => {
          if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

// Loaded from .env.local (Expo injects EXPO_PUBLIC_* at build time)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/** Stable key so sign-out can wipe SecureStore / localStorage reliably (see `performSignOut`). */
export const SUPABASE_AUTH_STORAGE_KEY = 'pawtaker.supabase.auth';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
