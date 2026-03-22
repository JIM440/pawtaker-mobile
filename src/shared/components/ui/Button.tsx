import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { AppText } from "./AppText";

type Variant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  /** Light surface + primary label — for CTAs on solid primary / brand backgrounds (e.g. onboarding). */
  | "inverse";
type Size = "md" | "sm";

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  leftIcon?: React.ReactNode;
};

const variantBg: Record<Variant, (colors: (typeof Colors)[keyof typeof Colors]) => string> = {
  primary: (c) => c.primary,
  secondary: (c) => c.primaryContainer,
  outline: () => "transparent",
  ghost: () => "transparent",
  danger: (c) => c.error,
  inverse: (c) => c.surfaceBright,
};

const variantTextColor: Record<
  Variant,
  (colors: (typeof Colors)[keyof typeof Colors]) => string
> = {
  primary: (c) => c.onPrimary,
  secondary: (c) => c.onPrimaryContainer,
  outline: (c) => c.primary,
  ghost: (c) => c.primary,
  danger: (c) => c.onError,
  inverse: (c) => c.primary,
};

/**
 * Button with design specs: flex, padding 12x24, center, gap 8, stretch.
 * Label: On-Primary #FFF, Roboto 14px weight 500, lineHeight 20, letterSpacing -0.2.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  leftIcon,
}: ButtonProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === "outline" || variant === "ghost"
      ? "transparent"
      : variantBg[variant](colors);
  const borderWidth = variant === "outline" ? 1 : 0;
  const borderColor =
    variant === "outline" ? colors.outlineVariant : "transparent";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        size === "sm" && styles.buttonSm,
        {
          backgroundColor,
          borderWidth,
          borderColor,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          // Keep visual emphasis while showing loading activity.
          opacity: disabled && !loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline" || variant === "ghost"
              ? colors.primary
              : variant === "inverse"
                ? colors.primary
                : colors.onPrimary
          }
        />
      )}
      {!loading && leftIcon}
      <AppText
        variant="label"
        color={variantTextColor[variant](colors)}
        style={[styles.label, size === "sm" && styles.labelSm]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}


const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    display: "flex",
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 100,
  },
  buttonSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  label: {
    textAlign: "center",
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    fontStyle: "normal",
    fontWeight: "500",
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  labelSm: {
    fontSize: 12,
    lineHeight: 16,
  },
});
