import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { Input } from "@/src/shared/components/ui/Input";
import React from "react";

type Props = {
  visible: boolean;
  blockBusy: boolean;
  t: (key: string, fallback?: string) => string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
};

export function ThreadBlockConfirmModal({
  visible,
  blockBusy,
  t,
  onConfirm,
  onCancel,
}: Props) {
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!visible) setReason("");
  }, [visible]);

  return (
    <FeedbackModal
      visible={visible}
      title={t("messages.blockConfirmTitle")}
      description={t("messages.blockConfirmDescription")}
      body={
        <Input
          label={t("messages.blockReasonLabel", "Reason (optional)")}
          placeholder={t(
            "messages.blockReasonPlaceholder",
            "Tell us why you are blocking this user",
          )}
          value={reason}
          onChangeText={setReason}
          maxLength={250}
          multiline
          inputStyle={{ minHeight: 88, textAlignVertical: "top" }}
          containerStyle={{ marginBottom: 0 }}
        />
      }
      primaryLabel={t("messages.block")}
      secondaryLabel={t("common.cancel")}
      destructive
      primaryLoading={blockBusy}
      onPrimary={() => onConfirm(reason.trim())}
      onSecondary={onCancel}
      onRequestClose={onCancel}
    />
  );
}
