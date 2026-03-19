import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: ThemeMode) => void;
  syncResolvedTheme: () => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return (Appearance.getColorScheme() ?? 'light') as 'light' | 'dark';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: getSystemTheme(),
      _hasHydrated: false,
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
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'pawtaker-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        state?.syncResolvedTheme();
      },
    }
  )
);

// Subscribe to system appearance so resolvedTheme updates when theme is 'system'
if (typeof Appearance?.addChangeListener === 'function') {
  Appearance.addChangeListener(() => {
    useThemeStore.getState().syncResolvedTheme();
  });
}
