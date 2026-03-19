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

  // Step 4 — Declaration
  declarationAccepted: boolean;
  hasHadPet: boolean;

  // Setters
  setCredentials: (fullName: string, email: string, password: string) => void;
  setProfile: (displayName: string, location: string, bio: string) => void;
  setDeclaration: (accepted: boolean, hasHadPet: boolean) => void;
  clearSignup: () => void;
};

export const useSignupStore = create<SignupStore>((set) => ({
  fullName: '',
  email: '',
  password: '',
  displayName: '',
  location: '',
  bio: '',
  declarationAccepted: false,
  hasHadPet: false,

  setCredentials: (fullName, email, password) =>
    set({ fullName, email, password }),

  setProfile: (displayName, location, bio) =>
    set({ displayName, location, bio }),

  setDeclaration: (declarationAccepted, hasHadPet) =>
    set({ declarationAccepted, hasHadPet }),

  clearSignup: () =>
    set({
      fullName: '',
      email: '',
      password: '',
      displayName: '',
      location: '',
      bio: '',
      declarationAccepted: false,
      hasHadPet: false,
    }),
}));
