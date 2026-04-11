import { AppText } from "@/src/shared/components/ui/AppText";
import { Camera, FileText, Image as ImageIcon } from "lucide-react-native";
import React from "react";
import { Modal, Pressable, TouchableOpacity, View } from "react-native";

type Props = {
  actionsOpen: boolean;
  attachMenuVisible: boolean;
  colors: Record<string, string>;
  styles: any;
  insetsBottom: number;
  t: (key: string, fallback?: string) => string;
  onCloseActions: () => void;
  onViewProfile: () => void;
  onBlock: () => void;
  /** When set, shows "Unblock" instead of "Block" */
  onUnblock?: () => void;
  onCloseAttach: () => void;
  onOpenPhotoLibrary: () => void;
  onOpenDocumentPicker: () => void;
  onOpenCamera: () => void;
};

export function ThreadMenus({
  actionsOpen,
  attachMenuVisible,
  colors,
  styles,
  insetsBottom,
  t,
  onCloseActions,
  onViewProfile,
  onBlock,
  onUnblock,
  onCloseAttach,
  onOpenPhotoLibrary,
  onOpenDocumentPicker,
  onOpenCamera,
}: Props) {
  return (
    <>
      <Modal
        transparent
        visible={actionsOpen}
        onRequestClose={onCloseActions}
        animationType="fade"
      >
        <Pressable style={styles.actionsOverlay} onPress={onCloseActions}>
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
            <TouchableOpacity
              style={[
                styles.actionItem,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
              onPress={onViewProfile}
            >
              <AppText variant="body" color={colors.onSurface}>
                {t("messages.viewProfile")}
              </AppText>
            </TouchableOpacity>
            {onUnblock ? (
              <TouchableOpacity style={styles.actionItem} onPress={onUnblock}>
                <AppText variant="body" color={colors.primary}>
                  {t("messages.unblock", "Unblock")}
                </AppText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionItem} onPress={onBlock}>
                <AppText variant="body" color={colors.error}>
                  {t("messages.block")}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={attachMenuVisible}
        animationType="fade"
        onRequestClose={onCloseAttach}
      >
        <Pressable
          style={[
            styles.attachOverlay,
            {
              paddingBottom: 52 + Math.max(insetsBottom, 8) + 20,
            },
          ]}
          onPress={onCloseAttach}
        >
          <View
            style={[
              styles.attachPopup,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant,
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <Pressable
              android_ripple={{
                color: colors.surfaceContainerHighest,
                borderless: false,
              }}
              style={({ pressed }) => (pressed ? { opacity: 0.75 } : undefined)}
              onPress={onOpenPhotoLibrary}
            >
              <View style={styles.attachPopupRow}>
                <ImageIcon size={18} color={colors.onSurfaceVariant} />
                <AppText
                  variant="body"
                  color={colors.onSurface}
                  style={styles.attachPopupLabel}
                >
                  {t("messages.attachPhotosVideos", "Photos & videos")}
                </AppText>
              </View>
            </Pressable>

            <View
              style={[
                styles.attachPopupDivider,
                { backgroundColor: colors.outlineVariant },
              ]}
            />

            <Pressable
              android_ripple={{
                color: colors.surfaceContainerHighest,
                borderless: false,
              }}
              style={({ pressed }) => (pressed ? { opacity: 0.75 } : undefined)}
              onPress={onOpenDocumentPicker}
            >
              <View style={styles.attachPopupRow}>
                <FileText size={18} color={colors.onSurfaceVariant} />
                <AppText
                  variant="body"
                  color={colors.onSurface}
                  style={styles.attachPopupLabel}
                >
                  {t("messages.attachDocument", "Document")}
                </AppText>
              </View>
            </Pressable>

            <View
              style={[
                styles.attachPopupDivider,
                { backgroundColor: colors.outlineVariant },
              ]}
            />

            <Pressable
              android_ripple={{
                color: colors.surfaceContainerHighest,
                borderless: false,
              }}
              style={({ pressed }) => (pressed ? { opacity: 0.75 } : undefined)}
              onPress={onOpenCamera}
            >
              <View style={styles.attachPopupRow}>
                <Camera size={18} color={colors.onSurfaceVariant} />
                <AppText
                  variant="body"
                  color={colors.onSurface}
                  style={styles.attachPopupLabel}
                >
                  {t("messages.attachCamera", "Camera")}
                </AppText>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
