import { create } from "zustand";

type ForgotPasswordState = {
  email: string;
  newPassword: string;

  setEmail: (email: string) => void;
  setNewPassword: (password: string) => void;
  clear: () => void;
};

export const useForgotPasswordStore = create<ForgotPasswordState>((set) => ({
  email: "",
  newPassword: "",

  setEmail: (email) => set({ email }),
  setNewPassword: (password) => set({ newPassword: password }),
  clear: () => set({ email: "", newPassword: "" }),
}));

