import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { Camera } from "lucide-react-native";
import React from "react";

type Props = {
  pickSourceFor: "front" | "back" | "selfie" | null;
  permissionMessage: string | null;
  colors: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  onCamera: () => void;
  onGallery: () => void;
  onClosePickSource: () => void;
  onClosePermission: () => void;
  onOpenSettings: () => void;
};

export function KycModals({
  pickSourceFor,
  permissionMessage,
  colors,
  t,
  onCamera,
  onGallery,
  onClosePickSource,
  onClosePermission,
  onOpenSettings,
}: Props) {
  return (
    <>
      <FeedbackModal
        visible={pickSourceFor !== null}
        icon={<Camera size={48} color={colors.primary} />}
        title={t("auth.kyc.submit.pickSourceTitle", "Select image source")}
        description={t(
          "auth.kyc.submit.pickSourceDescription",
          "Choose an image from your gallery or take a new photo.",
        )}
        primaryLabel={t("common.camera", "Camera")}
        onPrimary={onCamera}
        secondaryLabel={t("common.gallery", "Gallery")}
        onSecondary={onGallery}
        onRequestClose={onClosePickSource}
      />

      <FeedbackModal
        visible={permissionMessage !== null}
        title={t("common.permissionRequired", "Permission Required")}
        description={permissionMessage ?? undefined}
        primaryLabel={t("common.openSettings", "Open Settings")}
        onPrimary={() => {
          onClosePermission();
          onOpenSettings();
        }}
        secondaryLabel={t("common.cancel", "Cancel")}
        onSecondary={onClosePermission}
        onRequestClose={onClosePermission}
      />
    </>
  );
}
