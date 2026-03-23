import { Colors } from "@/src/constants/colors";
import { useToastStore, type ToastVariant } from "@/src/lib/store/toast.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CheckCircle2, Info, X, XCircle } from "lucide-react-native";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useThemeStore } from "@/src/lib/store/theme.store";

const iconSize = 18;

export function ToastHost() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const toast = useToastStore((s) => s.toast);
  const hideToast = useToastStore((s) => s.hideToast);

  const variantStyles = useMemo(() => {
    type VariantStyle = {
      iconColor: string;
      bg: string;
      textColor: string;
    };
    const base: VariantStyle = {
      iconColor: colors.primary,
      bg: colors.surfaceContainerHighest,
      textColor: colors.onSurface,
    };

    const byVariant: Record<ToastVariant, VariantStyle> = {
      default: base,
      info: base,
      success: {
        iconColor: colors.tertiary,
        bg: colors.tertiaryContainer,
        textColor: colors.onTertiaryContainer,
      },
      error: {
        iconColor: colors.error,
        bg: colors.errorContainer,
        textColor: colors.onErrorContainer,
      },
    };

    return toast ? byVariant[toast.variant] : base;
  }, [colors, toast]);

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
            <X size={18} color={variantStyles.textColor} />
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
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
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
    fontWeight: "600",
    lineHeight: 18,
  },
  closeBtn: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});

