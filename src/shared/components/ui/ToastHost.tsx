import { useToastStore } from "@/src/lib/store/toast.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CheckCircle2, Info, X, XCircle } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Colors } from "@/src/constants/colors";

const iconSize = 18;
export function ToastHost() {
  const { resolvedTheme } = useThemeStore();
  const toast = useToastStore((s) => s.toast);
  const hideToast = useToastStore((s) => s.hideToast);

  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const palette = Colors[theme];

  const variantStyles = useMemo(() => {
    if (!toast) {
      return {
        bg: palette.surfaceContainerHigh,
        textColor: palette.onSurface,
        iconColor: palette.onSurfaceVariant,
      };
    }

    if (toast.variant === "success") {
      return {
        bg: palette.primaryContainer,
        textColor: palette.onPrimaryContainer,
        iconColor: palette.primary,
      };
    }

    if (toast.variant === "error") {
      return {
        bg: palette.errorContainer,
        textColor: palette.onErrorContainer,
        iconColor: palette.error,
      };
    }

    return {
      bg: palette.surfaceContainerHigh,
      textColor: palette.onSurface,
      iconColor: palette.onSurfaceVariant,
    };
  }, [palette, toast]);

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
    alignItems: "flex-start",
    width: "100%",
    minHeight: 48,
    paddingLeft: 16,
    paddingTop: 10,
    paddingBottom: 10,
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
    minHeight: 28,
    alignItems: "center",
    justifyContent: "flex-start",
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
    justifyContent: "flex-start",
  },
});

