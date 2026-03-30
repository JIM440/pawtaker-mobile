import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { Pressable, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  canSendRequest: boolean;
  canOpenChat: boolean;
  colors: Record<string, string>;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onSendRequest: () => void;
  onOpenChat: () => void;
  onBlock: () => void;
  styles: any;
};

export function PublicProfileActionsMenu({
  visible,
  canSendRequest,
  canOpenChat,
  colors,
  t,
  onClose,
  onSendRequest,
  onOpenChat,
  onBlock,
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
        <TouchableOpacity style={styles.menuItem} onPress={onBlock}>
          <AppText variant="body" color={colors.error}>
            {t("profile.blockUser", "Block user")}
          </AppText>
        </TouchableOpacity>
      </View>
    </Pressable>
  );
}
