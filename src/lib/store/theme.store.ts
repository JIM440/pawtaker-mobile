import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: (Appearance.getColorScheme() ?? 'light') as 'light' | 'dark',
      setTheme: (theme) => {
        const resolved = theme === 'system'
          ? ((Appearance.getColorScheme() ?? 'light') as 'light' | 'dark')
          : theme;
        set({ theme, resolvedTheme: resolved });
      },
    }),
    {
      name: 'pawtaker-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);
