import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { Modal, Pressable, View } from "react-native";

type Props = {
  visible: boolean;
  colors: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onPrimaryAction: () => void;
  primaryActionLabel?: string;
  primaryActionDisabled?: boolean;
  onReport?: () => void;
  onBlock: () => void;
  onRateAndReview?: () => void;
  menuAnchor?: { x: number; y: number; width: number; height: number } | null;
};

export function MyCareContractActionsMenu({
  visible,
  colors,
  t,
  onClose,
  onPrimaryAction,
  primaryActionLabel,
  primaryActionDisabled = false,
  onReport,
  onBlock,
  onRateAndReview,
  menuAnchor,
}: Props) {
  const top = menuAnchor ? menuAnchor.y + menuAnchor.height + 8 : 64;
  const right = 16;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.12)',
        }}
        onPress={onClose}
      >
        <View
          style={{
            position: "absolute",
            top,
            right,
            minWidth: 200,
            backgroundColor: colors.surfaceBright,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 6,
            overflow: "hidden",
            paddingVertical: 4,
          }}
          onStartShouldSetResponder={() => true}
        >
          <Pressable
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
            onPress={onPrimaryAction}
            disabled={primaryActionDisabled}
          >
            <AppText
              variant="body"
              color={primaryActionDisabled ? colors.onSurfaceVariant : colors.onSurface}
            >
              {primaryActionLabel ?? t("myCare.contract.terminate")}
            </AppText>
          </Pressable>

          {onRateAndReview ? (
            <Pressable
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              onPress={onRateAndReview}
            >
              <AppText variant="body" color={colors.onSurface}>
                {t("myCare.contract.rateAndReview")}
              </AppText>
            </Pressable>
          ) : null}

          {onReport ? (
            <Pressable
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
              onPress={onReport}
            >
              <AppText variant="body" color={colors.onSurface}>
                {t("messages.reportUser", "Report user")}
              </AppText>
            </Pressable>
          ) : null}

          <Pressable
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
            onPress={onBlock}
          >
            <AppText variant="body" color={colors.error}>
              {t("profile.blockUser")}
            </AppText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
