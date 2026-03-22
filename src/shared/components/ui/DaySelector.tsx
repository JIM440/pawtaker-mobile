import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";

interface DaySelectorProps {
  days: string[];
  selectedDays: string[];
  onToggle: (label: string) => void;
  circleSize?: number;
  /** Same pattern as `Input`: outer border + `errorContainer` fill + message below. */
  error?: string;
}

const DEFAULT_DAYS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

export function DaySelector({
  days = DEFAULT_DAYS,
  selectedDays,
  onToggle,
  circleSize = 44,
  error,
}: DaySelectorProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const displayError = Boolean(error);

  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.daysRow,
          displayError && {
            borderWidth: 1,
            borderColor: colors.error,
            backgroundColor: colors.errorContainer,
            borderRadius: 12,
            padding: 10,
          },
        ]}
      >
        {days.map((label) => {
          const active = selectedDays.includes(label);
          return (
            <TouchableOpacity
              key={label}
              style={[
                styles.dayCircle,
                {
                  width: circleSize,
                  height: circleSize,
                  backgroundColor: active
                    ? colors.primary
                    : displayError
                      ? colors.surfaceContainerHighest
                      : colors.surfaceContainerHighest,
                  borderColor: active ? colors.primary : "transparent",
                },
              ]}
              onPress={() => onToggle(label)}
            >
              <AppText
                variant="caption"
                color={
                  active
                    ? colors.onPrimary
                    : displayError
                      ? colors.onErrorContainer
                      : colors.onSurfaceVariant
                }
                style={styles.dayLabel}
              >
                {label}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>
      {displayError ? (
        <AppText
          variant="caption"
          color={colors.error}
          style={styles.errorText}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    gap: 6,
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dayCircle: {
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 14,
  },
  errorText: {
    marginLeft: 4,
  },
});
