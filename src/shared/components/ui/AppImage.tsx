import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Image, type ImageProps } from "expo-image";
import React from "react";
import { LocalSvg } from "react-native-svg/css";

type AppImageProps = Omit<ImageProps, "style" | "contentFit"> & {
  width?: number;
  height?: number;
  style?: ImageProps["style"];
  contentFit?: ImageProps["contentFit"];
  type?: "image" | "svg";
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
  type = "image",
  ...rest
}: AppImageProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  if (type === "svg") {
    const asset = (rest as any).source;

    return (
      <LocalSvg
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        asset={asset as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        style={[
          {
            backgroundColor: colors.surfaceContainer,
            ...(width !== undefined && { width }),
            ...(height !== undefined && { height }),
          },
          style as any,
        ]}
        width={width}
        height={height}
      />
    );
  }

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
