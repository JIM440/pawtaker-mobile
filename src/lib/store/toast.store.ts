import { create } from "zustand";

import type React from "react";

export type ToastVariant = "success" | "error" | "info" | "default";

export type ToastOptions = {
  id?: string;
  variant?: ToastVariant;
  message: React.ReactNode;
  durationMs?: number;
};

type ToastState = {
  toast: {
    id: string;
    variant: ToastVariant;
    message: React.ReactNode;
  } | null;
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
};

let toastTimeout: ReturnType<typeof setTimeout> | null = null;

export const useToastStore = create<ToastState>()((set) => ({
  toast: null,
  showToast: ({ id, variant = "default", message, durationMs = 3000 }) => {
    const toastId = id ?? `${Date.now()}`;

    if (toastTimeout) clearTimeout(toastTimeout);

    set({
      toast: {
        id: toastId,
        variant,
        message,
      },
    });

    toastTimeout = setTimeout(() => {
      set({ toast: null });
      toastTimeout = null;
    }, durationMs);
  },
  hideToast: () => {
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = null;
    set({ toast: null });
  },
}));

