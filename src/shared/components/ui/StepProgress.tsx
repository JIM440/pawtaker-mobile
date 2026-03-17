import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";

type StepProgressProps = {
  /** Value between 0 and 1 representing overall progress */
  progress: number;
  /** Optional fixed width (e.g. 120 for header usage) */
  width?: number;
  /** Optional style overrides for outer container */
  style?: ViewStyle;
};

export function StepProgress({ progress, width, style }: StepProgressProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={[width ? { width } : null, style]}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.surfaceContainerHighest,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: colors.primary,
              flex: clamped,
            },
          ]}
        />
        <View style={{ flex: 1 - clamped }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
  },
});

