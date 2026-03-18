import React from "react";
import ImageViewing, { ImageSource } from "react-native-image-viewing";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Colors } from "@/src/constants/colors";

type ImageViewerModalProps = {
  visible: boolean;
  images: ImageSource[];
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

  return (
    <ImageViewing
      images={images}
      imageIndex={index}
      visible={visible}
      onRequestClose={onRequestClose}
      backgroundColor={colors.background}
    />
  );
}

