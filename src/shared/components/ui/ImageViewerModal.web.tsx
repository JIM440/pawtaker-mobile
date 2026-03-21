import React from "react";
import { Image, Modal, Pressable, View } from "react-native";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Colors } from "@/src/constants/colors";

type ImageViewerModalProps = {
  visible: boolean;
  images: ({ uri: string } | number)[];
  index?: number;
  onRequestClose: () => void;
};

export function ImageViewerModal({
  visible,
  images,
  index = 0,
  onRequestClose,
}: ImageViewerModalProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const current = images[index] ?? images[0];

  return (
    <Modal transparent visible={visible} onRequestClose={onRequestClose}>
      <Pressable
        onPress={onRequestClose}
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {current != null ? (
          <View style={{ width: "100%", height: "100%", padding: 16 }}>
            <Image
               
              source={current as any}
              resizeMode="contain"
              style={{ width: "100%", height: "100%" }}
            />
          </View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

