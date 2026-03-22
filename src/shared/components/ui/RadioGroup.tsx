import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";

export type RadioOption = {
  value: string;
  label: string;
};

type RadioGroupProps = {
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  /** Optional error border (matches form field error styling). */
  error?: boolean;
};

/**
 * Vertical radio list — circular indicator + label (no native Radio on RN).
 */
export function RadioGroup({
  options,
  value,
  onChange,
  error,
}: RadioGroupProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.wrap}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity
            key={opt.value}
            style={[styles.row]}
            activeOpacity={0.85}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
          >
            <View
              style={[
                styles.outerCircle,
                {
                  borderColor: selected
                    ? colors.primary
                    : colors.onSurfaceVariant,
                },
              ]}
            >
              {selected ? (
                <View
                  style={[styles.innerDot, { backgroundColor: colors.primary }]}
                />
              ) : null}
            </View>
            <AppText
              variant="body"
              color={colors.onSurface}
              style={styles.label}
            >
              {opt.label}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  outerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    fontWeight: "500",
  },
});
