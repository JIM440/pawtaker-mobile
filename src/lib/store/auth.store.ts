import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client';

// Covers both types.ts columns and auth.md trigger-added columns
export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  points_balance: number;
  is_verified: boolean;
  is_email_verified?: boolean;
  has_had_pet?: boolean;
  kyc_status: 'not_submitted' | 'pending' | 'submitted' | 'approved' | 'rejected';
  is_admin?: boolean;
  language: string;
  created_at: string;
  updated_at: string;
};

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  onboardingSeen: boolean;
  _hasHydrated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOnboardingSeen: (onboardingSeen: boolean) => void;
  setHasHydrated: (state: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  signOut: () => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null,
      onboardingSeen: false,
      _hasHydrated: false,
      isLoading: true,
      setUser: (user) => set({ user }),
      setSession: (session) =>
        set((state) => ({
          session,
          user: session?.user ?? null,
        })),
      setProfile: (profile) => set({ profile }),
      setOnboardingSeen: (onboardingSeen) => set({ onboardingSeen }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setLoading: (isLoading) => set({ isLoading }),

      fetchProfile: async (userId: string) => {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (!error && data) {
          set({ profile: data as unknown as UserProfile });
        }
      },

      signOut: () => set({ user: null, session: null, profile: null }),
      clearAuth: () => set({ user: null, session: null, profile: null }),
    }),
    {
      name: 'pawtaker-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        onboardingSeen: state.onboardingSeen,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
