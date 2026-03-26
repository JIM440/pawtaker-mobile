import { Colors } from "@/src/constants/colors";
import { getKycUiState } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { router } from "expo-router";
import { AlertTriangle, Clock, Verified } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

type KycPromptModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * KYC messaging by verification state:
 * - needs_verification (not_submitted): prompt to complete KYC
 * - rejected: verification failed — resubmit
 * - pending_review (pending / submitted): tell user to wait
 * - approved: modal not shown (caller should keep `visible` false)
 */
export function KycPromptModal({ visible, onClose }: KycPromptModalProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const profile = useAuthStore((s) => s.profile);

  const kycUiState = getKycUiState(profile?.kyc_status);
  const isPending = kycUiState === "pending_review";
  const isRejected = profile?.kyc_status === "rejected";

  if (kycUiState === "approved") {
    return null;
  }

  const goKyc = () => {
    onClose();
    router.push("/(private)/kyc" as Parameters<typeof router.push>[0]);
  };

  if (!visible) {
    return null;
  }

  const title = isPending
    ? t("feed.kycModal.pendingTitle")
    : isRejected
      ? t("feed.kycModal.rejectedTitle")
      : t("feed.kycModal.title");

  const description = isPending
    ? t("feed.kycModal.pendingDescription")
    : isRejected
      ? t("feed.kycModal.rejectedDescription")
      : t(
          "feed.kycModal.description",
          "You are not verified yet. To add pets, create pet requests, or apply for pet sitting, please complete verification.",
        );

  const icon = isPending ? (
    <Clock size={40} color={colors.primary} />
  ) : isRejected ? (
    <AlertTriangle size={40} color={colors.tertiary} />
  ) : (
    <Verified size={40} color={colors.primary} />
  );

  const primaryLabel = isPending
    ? t("feed.kycModal.pendingOk")
    : isRejected
      ? t("feed.kycModal.resubmitVerification")
      : t("feed.kycModal.getVerified");

  return (
    <FeedbackModal
      visible={visible}
      title={title}
      description={description}
      icon={icon}
      primaryLabel={primaryLabel}
      onPrimary={isPending ? onClose : goKyc}
      secondaryLabel={isPending ? undefined : t("feed.kycModal.maybeLater")}
      onSecondary={isPending ? undefined : onClose}
      onRequestClose={onClose}
    />
  );
}
