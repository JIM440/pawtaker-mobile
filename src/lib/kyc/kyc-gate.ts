import {
  useAuthStore,
  type UserProfile,
} from "@/src/lib/store/auth.store";
import { useKycGateStore } from "@/src/lib/store/kyc-gate.store";

/** High-level UI bucket for KYC gating (approved = no modal). */
export type KycUiState = "approved" | "needs_verification" | "pending_review";

/**
 * Map profile `kyc_status` to a small set of UI states.
 * - needs_verification: user must (re)submit KYC
 * - pending_review: submitted / under review — show “wait” messaging only
 */
export function getKycUiState(
  kycStatus: UserProfile["kyc_status"] | null | undefined,
): KycUiState {
  if (kycStatus === "approved") {
    return "approved";
  }
  if (
    kycStatus === "not_submitted" ||
    kycStatus === "rejected" ||
    kycStatus == null
  ) {
    return "needs_verification";
  }
  // pending, submitted — waiting on review
  return "pending_review";
}

export function isKycApproved(
  kycStatus: UserProfile["kyc_status"] | null | undefined,
): boolean {
  return getKycUiState(kycStatus) === "approved";
}

/**
 * If the user cannot proceed without approved KYC, opens the global KYC modal and returns `true` (caller should abort the action).
 */
export function blockIfKycNotApproved(): boolean {
  const profile = useAuthStore.getState().profile;
  if (isKycApproved(profile?.kyc_status)) {
    return false;
  }
  useKycGateStore.getState().requestOpen();
  return true;
}
