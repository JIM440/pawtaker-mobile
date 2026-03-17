import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  syncResolvedTheme: () => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return (Appearance.getColorScheme() ?? 'light') as 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),
      setTheme: (theme) => {
        const resolved = theme === 'system' ? getSystemTheme() : theme;
        set({ theme, resolvedTheme: resolved });
      },
      syncResolvedTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          set({ resolvedTheme: getSystemTheme() });
        }
      },
    }),
    {
      name: 'pawtaker-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// Subscribe to system appearance so resolvedTheme updates when theme is 'system'
if (typeof Appearance?.addChangeListener === 'function') {
  Appearance.addChangeListener(() => {
    useThemeStore.getState().syncResolvedTheme();
  });
}
