import { create } from 'zustand';

type SignupStore = {
  // Step 1 — Credentials
  fullName: string;
  email: string;
  password: string;

  // Step 3 — Profile
  displayName: string;
  location: string;
  bio: string;

  // Setters
  setCredentials: (fullName: string, email: string, password: string) => void;
  setProfile: (displayName: string, location: string, bio: string) => void;
  clearSignup: () => void;
};

export const useSignupStore = create<SignupStore>((set) => ({
  fullName: '',
  email: '',
  password: '',
  displayName: '',
  location: '',
  bio: '',

  setCredentials: (fullName, email, password) =>
    set({ fullName, email, password }),

  setProfile: (displayName, location, bio) =>
    set({ displayName, location, bio }),

  clearSignup: () =>
    set({
      fullName: '',
      email: '',
      password: '',
      displayName: '',
      location: '',
      bio: '',
    }),
}));
