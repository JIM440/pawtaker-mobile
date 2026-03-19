import React from "react";
import {
  Modal,
  Image,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";

export type ImageSource = { uri: string };

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
  const { width, height } = Dimensions.get("window");
  const image = images[index];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View className="flex-1 bg-black items-center justify-center">
        {image?.uri ? (
          <Image
            source={{ uri: image.uri }}
            style={{ width, height }}
            resizeMode="contain"
          />
        ) : null}
        <TouchableOpacity
          onPress={onRequestClose}
          className="absolute top-12 right-4 bg-black/50 rounded-full p-2"
        >
          <X size={24} color="white" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
