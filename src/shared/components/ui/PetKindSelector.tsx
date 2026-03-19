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
  variant?: "large" | "small";
}

export function PetKindSelector({
  options,
  selectedKeys,
  onToggle,
  variant = "large",
}: PetKindSelectorProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const circleSize = variant === "large" ? 90 : 60;
  const iconSize = variant === "large" ? 60 : 40;
  const borderRadius = variant === "large" ? 20 : 12;

  return (
    <View style={styles.petKindsRow}>
      {options.map(({ key, label, asset }) => {
        const active = selectedKeys.includes(key);
        return (
          <TouchableOpacity
            key={key}
            activeOpacity={0.9}
            onPress={() => onToggle(key)}
            style={[styles.petKindOption, { width: variant === "large" ? "30%" : "auto" }]}
          >
            <View
              style={[
                styles.petKindCircle,
                {
                  width: circleSize,
                  height: circleSize,
                  borderRadius: borderRadius,
                  backgroundColor: colors.surfaceContainerHighest,
                  borderColor: active ? colors.primary : "transparent",
                  borderWidth: 2,
                },
              ]}
            >
              <AppImage
                source={asset}
                type="svg"
                width={iconSize}
                height={iconSize}
                style={{ backgroundColor: "transparent" }}
              />
            </View>
            {variant === "large" && (
              <AppText
                variant="caption"
                color={active ? colors.primary : colors.onSurfaceVariant}
                style={styles.petKindLabel}
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
  petKindOption: {
    alignItems: "center",
    gap: 8,
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
});
