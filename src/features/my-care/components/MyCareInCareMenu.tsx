import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";

type Props = {
  visible: boolean;
  colors: Record<string, string>;
  styles: any;
  t: (key: string, fallback?: string) => string;
  onClose: () => void;
  onGoToChat: () => void;
  onViewAgreement: () => void;
};

export function MyCareInCareMenu({
  visible,
  colors,
  styles,
  t,
  onClose,
  onGoToChat,
  onViewAgreement,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.menuModalOverlay} onPress={onClose}>
        <View
          style={[
            styles.menuModalContent,
            {
              backgroundColor: colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <TouchableOpacity style={styles.menuItem} onPress={onGoToChat}>
            <AppText variant="body">{t("myCare.goToChat")}</AppText>
          </TouchableOpacity>
          <View
            style={[
              styles.menuDivider,
              { backgroundColor: colors.outlineVariant },
            ]}
          />
          <TouchableOpacity style={styles.menuItem} onPress={onViewAgreement}>
            <AppText variant="body">{t("myCare.viewAgreement")}</AppText>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}
