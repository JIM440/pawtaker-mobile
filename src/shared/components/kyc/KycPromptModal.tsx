import { Colors } from "@/src/constants/colors";
import { getKycUiState } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { router } from "expo-router";
import { Clock, Verified } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";

type KycPromptModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * KYC messaging by verification state:
 * - needs_verification (not_submitted / rejected): prompt to complete KYC
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

  return (
    <FeedbackModal
      visible={visible}
      title={
        isPending
          ? t("feed.kycModal.pendingTitle")
          : t("feed.kycModal.title")
      }
      description={
        isPending
          ? t("feed.kycModal.pendingDescription")
          : t("feed.kycModal.description")
      }
      icon={
        isPending ? (
          <Clock size={40} color={colors.primary} />
        ) : (
          <Verified size={40} color={colors.primary} />
        )
      }
      primaryLabel={
        isPending ? t("feed.kycModal.pendingOk") : t("feed.kycModal.getVerified")
      }
      onPrimary={isPending ? onClose : goKyc}
      secondaryLabel={isPending ? undefined : t("feed.kycModal.maybeLater")}
      onSecondary={isPending ? undefined : onClose}
      onRequestClose={onClose}
    />
  );
}
