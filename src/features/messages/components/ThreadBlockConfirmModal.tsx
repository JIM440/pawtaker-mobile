import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import React from "react";

type Props = {
  visible: boolean;
  blockBusy: boolean;
  t: (key: string, fallback?: string) => string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ThreadBlockConfirmModal({
  visible,
  blockBusy,
  t,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <FeedbackModal
      visible={visible}
      title={t("messages.blockConfirmTitle")}
      description={t("messages.blockConfirmDescription")}
      primaryLabel={t("messages.block")}
      secondaryLabel={t("common.cancel")}
      destructive
      primaryLoading={blockBusy}
      onPrimary={onConfirm}
      onSecondary={onCancel}
      onRequestClose={onCancel}
    />
  );
}
