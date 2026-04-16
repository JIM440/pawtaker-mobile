import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { Pressable, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  canSendRequest: boolean;
  canOpenChat: boolean;
  isBlockedByMe: boolean;
  colors: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onSendRequest: () => void;
  onOpenChat: () => void;
  onReport: () => void;
  onToggleBlock: () => void;
  styles: any;
};

export function PublicProfileActionsMenu({
  visible,
  canSendRequest,
  canOpenChat,
  isBlockedByMe,
  colors,
  t,
  onClose,
  onSendRequest,
  onOpenChat,
  onReport,
  onToggleBlock,
  styles,
}: Props) {
  if (!visible) return null;
  return (
    <Pressable style={styles.menuOverlay} onPress={onClose}>
      <View
        style={[
          styles.menuContainer,
          {
            backgroundColor: colors.surfaceContainerLowest,
            borderColor: colors.outlineVariant,
          },
        ]}
        onStartShouldSetResponder={() => true}
      >
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
          disabled={!canSendRequest}
          onPress={onSendRequest}
        >
          <AppText variant="body" color={colors.onSurface}>
            {t("common.sendRequest", "Send request")}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
          disabled={!canOpenChat}
          onPress={onOpenChat}
        >
          <AppText variant="body" color={colors.onSurface}>
            {t("myCare.goToChat")}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              borderBottomWidth: 1,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
          onPress={onReport}
        >
          <AppText variant="body" color={colors.error}>
            {t("messages.reportUser", "Report user")}
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={onToggleBlock}>
          <AppText
            variant="body"
            color={isBlockedByMe ? colors.primary : colors.error}
          >
            {isBlockedByMe
              ? t("messages.unblock", "Unblock")
              : t("profile.blockUser", "Block user")}
          </AppText>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
