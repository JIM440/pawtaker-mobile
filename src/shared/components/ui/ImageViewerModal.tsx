import React, { ReactNode } from "react";
import {
  Dimensions,
  Modal,
  Image,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  View,
} from "react-native";
import ImageViewing from "react-native-image-viewing";
import { X } from "lucide-react-native";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";

export type ImageSource = { uri: string } | number;

type ImageViewerModalProps = {
  visible: boolean;
  images: ImageSource[];
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
  const { width, height } = Dimensions.get("window");
  const image = images[index];
  const hasCustomContent = Boolean(children);
  const frameWidth = Math.max(width - 24, 0);
  const frameHeight = Math.max(height - 112, 0);
  const imageSources = images.map((source) =>
    typeof source === "number" ? { uri: String(source) } : source,
  );

  if (!hasCustomContent) {
    return (
      <ImageViewing
        images={imageSources}
        imageIndex={index}
        visible={visible}
        onRequestClose={onRequestClose}
        backgroundColor={colors.background}
        animationType="fade"
        doubleTapToZoomEnabled
        HeaderComponent={() => (
          <View
            style={{
              paddingTop: 48,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              {title ? (
                <AppText variant="title" color={colors.onBackground}>
                  {title}
                </AppText>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={onRequestClose}
              className="rounded-full p-2"
              style={{ backgroundColor: colors.surfaceContainerHighest }}
            >
              <X size={24} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        )}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 12,
          paddingVertical: 56,
        }}
      >
        <View
          style={{
            width: frameWidth,
            maxWidth: frameWidth,
            height: frameHeight,
            maxHeight: frameHeight,
          }}
        >
          {title ? (
            <View
              style={{
                paddingBottom: 12,
                paddingRight: 56,
              }}
            >
              <AppText variant="title" color="#FFFFFF">
                {title}
              </AppText>
            </View>
          ) : null}
          {hasCustomContent ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {children}
            </View>
          ) : image?.uri ? (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{
                flexGrow: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
              maximumZoomScale={4}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              centerContent
            >
              <Image
                source={{ uri: image.uri }}
                style={{ width: frameWidth, height: frameHeight }}
                resizeMode="contain"
              />
            </ScrollView>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={onRequestClose}
          className="absolute top-12 right-4 rounded-full p-2"
          style={{ backgroundColor: colors.surfaceContainerHighest }}
        >
          <X size={24} color={colors.onSurface} />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
