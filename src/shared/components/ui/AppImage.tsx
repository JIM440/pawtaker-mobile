import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Image, type ImageProps } from "expo-image";
import React from "react";

type AppImageProps = Omit<ImageProps, "style" | "contentFit"> & {
  width?: number;
  height?: number;
  style?: ImageProps["style"];
  contentFit?: ImageProps["contentFit"];
};

/**
 * Reusable image component using expo-image for all app images.
 * - Default fit: 'cover'.
 * - Accepts width and height as direct props.
 * - Applies a themed background color by default.
 */
export function AppImage({
  width,
  height,
  style,
  contentFit = "cover",
  ...rest
}: AppImageProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <Image
      contentFit={contentFit}
      style={[
        {
          backgroundColor: colors.surfaceContainer,
          ...(width !== undefined && { width }),
          ...(height !== undefined && { height }),
        },
        style,
      ]}
      {...rest}
    />
  );
}
