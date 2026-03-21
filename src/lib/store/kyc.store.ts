import { create } from "zustand";

export type DocType = "passport" | "drivers_license" | "national_id";

interface KycState {
  docType: DocType | null;
  frontUri: string | null;
  backUri: string | null;
  selfieUri: string | null;

  setDocType: (docType: DocType) => void;
  setFrontUri: (uri: string | null) => void;
  setBackUri: (uri: string | null) => void;
  setSelfieUri: (uri: string | null) => void;

  /**
   * Clears all client-side KYC draft data.
   * Called after successful submission.
   */
  clearKyc: () => void;
}

export const useKycStore = create<KycState>((set) => ({
  docType: null,
  frontUri: null,
  backUri: null,
  selfieUri: null,

  setDocType: (docType) => set({ docType }),
  setFrontUri: (uri) => set({ frontUri: uri }),
  setBackUri: (uri) => set({ backUri: uri }),
  setSelfieUri: (uri) => set({ selfieUri: uri }),

  clearKyc: () => set({ docType: null, frontUri: null, backUri: null, selfieUri: null }),
}));

