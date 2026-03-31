import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { Modal, Pressable, View } from "react-native";

type Props = {
  visible: boolean;
  colors: Record<string, string>;
  styles: any;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onTerminate: () => void;
  terminateDisabled?: boolean;
  onReport?: () => void;
  onBlock: () => void;
  onRateAndReview: () => void;
};

export function MyCareContractActionsMenu({
  visible,
  colors,
  styles,
  t,
  onClose,
  onTerminate,
  terminateDisabled = false,
  onReport,
  onBlock,
  onRateAndReview,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={onClose}
      animationType="fade"
    >
      <Pressable style={styles.actionsOverlay} onPress={onClose}>
        <View
          style={[
            styles.actionsCard,
            {
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.outlineVariant,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <Pressable
            style={({ pressed }) => [styles.actionItem, pressed ? { opacity: 0.7 } : null]}
            onPress={onTerminate}
            disabled={terminateDisabled}
          >
            <AppText
              variant="body"
              color={terminateDisabled ? colors.onSurfaceVariant : colors.onSurface}
              numberOfLines={1}
            >
              {t("myCare.contract.terminate")}
            </AppText>
          </Pressable>

          <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

          {onReport ? (
            <>
              <Pressable
                style={({ pressed }) => [styles.actionItem, pressed ? { opacity: 0.7 } : null]}
                onPress={onReport}
              >
                <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                  {t("messages.reportUser", "Report user")}
                </AppText>
              </Pressable>
              <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />
            </>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.actionItem, pressed ? { opacity: 0.7 } : null]}
            onPress={onBlock}
          >
            <AppText variant="body" color={colors.error} numberOfLines={1}>
              {t("profile.blockUser")}
            </AppText>
          </Pressable>

          <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

          <Pressable
            style={({ pressed }) => [styles.actionItem, pressed ? { opacity: 0.7 } : null]}
            onPress={onRateAndReview}
          >
            <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
              {t("myCare.contract.rateAndReview")}
            </AppText>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}
