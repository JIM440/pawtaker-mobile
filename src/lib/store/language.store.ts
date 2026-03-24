import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import i18n from '../i18n';

type Language = 'en' | 'fr';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
      _hasHydrated: false,
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'pawtaker-language',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        const markHydrated = () => {
          if (state) state.setHasHydrated(true);
          else useLanguageStore.getState().setHasHydrated(true);
        };
        if (!state) {
          markHydrated();
          return;
        }
        // Wait for i18n to apply persisted language before marking hydrated (splash waits on this).
        void i18n.changeLanguage(state.language).finally(markHydrated);
      },
    }
  )
);
