import React, { ReactNode } from "react";
import { Image, Modal, Pressable, ScrollView, View } from "react-native";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";

type ImageViewerModalProps = {
  visible: boolean;
  images: ({ uri: string } | number)[];
  index?: number;
  title?: string;
  children?: ReactNode;
  onRequestClose: () => void;
};

export function ImageViewerModal({
  visible,
  images,
  index = 0,
  title,
  children,
  onRequestClose,
}: ImageViewerModalProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const current = images[index] ?? images[0];
  const hasCustomContent = Boolean(children);

  return (
    <Modal transparent visible={visible} onRequestClose={onRequestClose}>
      <Pressable
        onPress={onRequestClose}
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            width: "100%",
            height: "100%",
            padding: 16,
          }}
        >
          {title ? (
            <AppText
              variant="title"
              color={colors.onBackground}
              style={{ marginBottom: 12 }}
            >
              {title}
            </AppText>
          ) : null}
          {hasCustomContent ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              {children}
            </View>
          ) : current != null ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={current as any}
                resizeMode="contain"
                style={{ width: "100%", height: "100%" }}
              />
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
