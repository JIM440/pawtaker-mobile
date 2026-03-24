import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
  size?: number;
  accessibilityLabel?: string;
};

/**
 * Interactive 1–5 star control (create review, feedback).
 */
export function StarRatingInput({
  value,
  onChange,
  maxStars = 5,
  size = 36,
  accessibilityLabel,
}: StarRatingInputProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View
      style={styles.row}
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
    >
      {Array.from({ length: maxStars }, (_, i) => {
        const n = i + 1;
        const filled = n <= value;
        return (
          <TouchableOpacity
            key={n}
            onPress={() => onChange(n)}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: filled }}
            accessibilityLabel={`${n} of ${maxStars}`}
          >
            <Star
              size={size}
              color={filled ? colors.tertiary : colors.outlineVariant}
              fill={filled ? colors.tertiary : "transparent"}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
