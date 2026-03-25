import { useToastStore } from "@/src/lib/store/toast.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CheckCircle2, Info, X, XCircle } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useThemeStore } from "@/src/lib/store/theme.store";

/** Toast surface: light app → dark bar, dark app → light bar */
const TOAST_BG = {
  light: "#322F35",
  dark: "#E6E0E9",
} as const;

/** Light-theme snackbar: inverse-on-surface (Figma M3 inverse-on-surface). */
const TOAST_ON_SURFACE = {
  light: "#F5EFF7",
  dark: "#322F35",
} as const;

const iconSize = 18;
const TOAST_HEIGHT = 48;

/** Icon tints that stay readable on both toast surfaces */
const ICON_TINT = {
  light: {
    success: "#A5D6A7",
    error: "#FFAB91",
    info: "#F5EFF7",
    default: "#F5EFF7",
  },
  dark: {
    success: "#2E7D32",
    error: "#C62828",
    info: TOAST_ON_SURFACE.dark,
    default: TOAST_ON_SURFACE.dark,
  },
} as const;

export function ToastHost() {
  const { resolvedTheme } = useThemeStore();
  const toast = useToastStore((s) => s.toast);
  const hideToast = useToastStore((s) => s.hideToast);

  const theme = resolvedTheme === "dark" ? "dark" : "light";

  const variantStyles = useMemo(() => {
    const textColor = TOAST_ON_SURFACE[theme];
    const bg = TOAST_BG[theme];
    const icon = ICON_TINT[theme];
    if (!toast) {
      return { bg, textColor, iconColor: icon.default };
    }
    const iconColor =
      toast.variant === "success"
        ? icon.success
        : toast.variant === "error"
          ? icon.error
          : toast.variant === "info"
            ? icon.info
            : icon.default;
    return { bg, textColor, iconColor };
  }, [theme, toast]);

  if (!toast) return null;

  const renderIcon = () => {
    switch (toast.variant) {
      case "success":
        return <CheckCircle2 size={iconSize} color={variantStyles.iconColor} />;
      case "error":
        return <XCircle size={iconSize} color={variantStyles.iconColor} />;
      case "info":
        return <Info size={iconSize} color={variantStyles.iconColor} />;
      case "default":
      default:
        return <Info size={iconSize} color={variantStyles.iconColor} />;
    }
  };

  return (
    <View pointerEvents="box-none" style={styles.viewport}>
      <View style={styles.toastRowWrapper}>
        <View style={[styles.toast, { backgroundColor: variantStyles.bg }]}>
          <View style={styles.iconLeft}>{renderIcon()}</View>
          <View style={styles.textWrap}>
            <AppText
              variant="body"
              color={variantStyles.textColor}
              style={styles.message}
            >
              {toast.message}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close toast"
            onPress={hideToast}
            hitSlop={10}
            style={styles.closeBtn}
          >
            <X size={24} color={variantStyles.textColor} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 110,
    alignItems: "center",
    zIndex: 2000,
  },
  toastRowWrapper: {
    width: "100%",
    paddingHorizontal: 16,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: TOAST_HEIGHT,
    minHeight: TOAST_HEIGHT,
    paddingLeft: 16,
    paddingRight: 0,
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  iconLeft: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
    paddingRight: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    letterSpacing: 0.25,
  },
  closeBtn: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
});

