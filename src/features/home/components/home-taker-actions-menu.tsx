import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { Modal, Pressable, View } from "react-native";

type MenuPos = { x: number; y: number; width: number; height: number };

type Props = {
  visible: boolean;
  menuPosition: MenuPos | null;
  takerId?: string | null;
  currentUserId?: string | null;
  colors: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onViewProfile: () => void;
  onSendRequest: () => void;
};

export function HomeTakerActionsMenu({
  visible,
  menuPosition,
  takerId,
  currentUserId,
  colors,
  t,
  onClose,
  onViewProfile,
  onSendRequest,
}: Props) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1" onPress={onClose}>
        {menuPosition && takerId ? (
          <View
            style={{
              top: menuPosition.y + menuPosition.height + 4,
              left: menuPosition.x - 160,
              width: 172,
              backgroundColor: colors.surfaceContainerLowest,
              borderColor: colors.outlineVariant,
              borderRadius: 12,
              borderWidth: 1,
              overflow: "hidden",
              elevation: 4,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowOffset: { width: 0, height: 4 },
              shadowRadius: 8,
            }}
          >
            <Pressable
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.outlineVariant,
              }}
              onPress={onViewProfile}
            >
              <AppText variant="body" color={colors.onSurface}>
                {t("common.viewProfile", "View Profile")}
              </AppText>
            </Pressable>
            {takerId !== currentUserId ? (
              <Pressable
                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                onPress={onSendRequest}
              >
                <AppText variant="body" color={colors.onSurface}>
                  {t("common.sendRequest", "Send Request")}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}
