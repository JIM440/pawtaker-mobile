import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextProps,
  type TextStyle,
} from "react-native";

type AppTextVariant =
  | "body"
  | "bodyLarge"
  | "label"
  | "title"
  | "headline"
  | "caption";

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  /** Override text color (default: theme onSurface) */
  color?: string;
  style?: StyleProp<TextStyle>;
};

const variantStyles: Record<AppTextVariant, TextStyle> = {
  body: {
    fontFamily: "Roboto_400Regular",
    fontSize: 14,
    lineHeight: 24,
  },
  bodyLarge: {
    fontFamily: "Roboto_500Medium",
    fontSize: 22,
    lineHeight: 24,
  },
  label: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: "Roboto_500Medium",
    fontSize: 20,
    lineHeight: 28,
  },
  headline: {
    fontFamily: "Roboto_700Bold",
    fontSize: 24,
    lineHeight: 32,
  },
  caption: {
    fontFamily: "Roboto_400Regular",
    fontSize: 12,
    lineHeight: 16,
  },
};

/**
 * Reusable text component with Roboto font and theme-aware color.
 * The font weight is determined by the variant, but can be overridden via style.
 */
export function AppText({
  variant = "body",
  color,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { resolvedTheme } = useThemeStore();
  const defaultColor = color ?? Colors[resolvedTheme].onSurface;

  // Flatten styles to check for fontWeight override
  const flattenedStyle = StyleSheet.flatten(style);
  const fontWeight = flattenedStyle?.fontWeight;

  let fontFamily = variantStyles[variant].fontFamily;

  if (fontWeight) {
    if (fontWeight === "bold" || fontWeight === "700" || (typeof fontWeight === "number" && fontWeight >= 700)) {
      fontFamily = "Roboto_700Bold";
    } else if (fontWeight === "500" || fontWeight === "600" || (typeof fontWeight === "number" && fontWeight >= 500)) {
      fontFamily = "Roboto_500Medium";
    } else {
      fontFamily = "Roboto_400Regular";
    }
  }

  return (
    <Text
      style={[
        variantStyles[variant],
        { color: defaultColor, fontFamily },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}


