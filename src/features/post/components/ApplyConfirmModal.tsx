import { Colors } from "@/src/constants/colors";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { PawPrint } from "lucide-react-native";
import React from "react";

type Props = {
  visible: boolean;
  applying: boolean;
  colors: typeof Colors.light | typeof Colors.dark;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ApplyConfirmModal({
  visible,
  applying,
  colors,
  t,
  onClose,
  onConfirm,
}: Props) {
  return (
    <FeedbackModal
      visible={visible}
      onRequestClose={() => !applying && onClose()}
      icon={<PawPrint size={24} color={colors.primary} strokeWidth={2} />}
      title={t("requestDetails.applyConfirmTitle", "Applying for this pet?")}
      description={t(
        "requestDetails.applyConfirmBody",
        "A message with your availability details will be sent to this pet’s owner",
      )}
      secondaryLabel={t("common.cancel", "Cancel")}
      onSecondary={() => !applying && onClose()}
      secondaryVariant="secondary"
      primaryLabel={t("common.continue", "Continue")}
      onPrimary={onConfirm}
      primaryLoading={applying}
    />
  );
}
