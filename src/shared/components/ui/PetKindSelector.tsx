import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "./AppImage";
import { AppText } from "./AppText";

export type PetKindOption = {
  key: string;
  label: string;
  asset: any;
};

interface PetKindSelectorProps {
  options: PetKindOption[];
  selectedKeys: string[];
  onToggle: (key: string) => void;
  variant?: "large" | "small" | "grid";
  /** When true, only one kind can be selected at a time. */
  singleSelect?: boolean;
}

export function PetKindSelector({
  options,
  selectedKeys,
  onToggle,
  variant = "large",
  singleSelect = false,
}: PetKindSelectorProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const circleSize = variant === "grid" ? undefined : variant === "large" ? 90 : 60;
  const iconSize =
    variant === "grid" ? 98 : variant === "large" ? 60 : 40;
  const borderRadius = variant === "grid" ? 16 : variant === "large" ? 20 : 12;

  const handlePress = (key: string) => {
    if (singleSelect) {
      const already = selectedKeys[0] === key;
      onToggle(already ? "" : key);
      return;
    }
    onToggle(key);
  };

  return (
    <View style={variant === "grid" ? styles.petKindsGrid : styles.petKindsRow}>
      {options.map(({ key, label, asset }) => {
        if (!key) return null;
        const active = selectedKeys.includes(key);
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.9}
            onPress={() => handlePress(key)}
            style={[
              styles.petKindOption,
              variant === "large" && { width: "30%" },
              variant === "grid" && styles.petKindOptionGrid,
            ]}
          >
            <View
              style={[
                variant === "grid" ? styles.kindBoxGrid : styles.petKindCircle,
                variant === "grid"
                  ? {
                      borderColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                      backgroundColor: colors.surfaceContainerHighest,
                    }
                  : {
                      width: circleSize,
                      height: circleSize,
                      borderRadius: borderRadius,
                      backgroundColor: colors.surfaceContainerHighest,
                      borderColor: active ? colors.primary : "transparent",
                      borderWidth: 2,
                    },
              ]}
            >
              <View
                style={
                  variant === "grid"
                    ? styles.kindIllustrationWrapper
                    : undefined
                }
              >
                <AppImage
                  source={asset}
                  type="svg"
                  width={iconSize}
                  height={iconSize}
                  style={{ backgroundColor: "transparent" }}
                />
              </View>
            </View>
            {(variant === "large" || variant === "grid") && (
              <AppText
                variant="caption"
                color={active ? colors.primary : colors.onSurfaceVariant}
                style={
                  variant === "grid" ? styles.petKindLabelGrid : styles.petKindLabel
                }
                numberOfLines={1}
              >
                {label}
              </AppText>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  petKindsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  petKindsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  petKindOption: {
    alignItems: "center",
    gap: 8,
  },
  petKindOptionGrid: {
    width: "48%",
  },
  kindBoxGrid: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 3,
    padding: 20,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  kindIllustrationWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    height: 98,
  },
  petKindCircle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  petKindLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  petKindLabelGrid: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
