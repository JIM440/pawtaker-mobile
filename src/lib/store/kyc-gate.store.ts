import { create } from "zustand";

/**
 * Increment `requestNonce` to ask `KycGlobalPrompt` (in private layout) to show the KYC modal.
 */
export const useKycGateStore = create<{
  requestNonce: number;
  requestOpen: () => void;
}>((set) => ({
  requestNonce: 0,
  requestOpen: () =>
    set((s) => ({
      requestNonce: s.requestNonce + 1,
    })),
}));
