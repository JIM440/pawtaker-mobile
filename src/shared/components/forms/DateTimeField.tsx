import {
  formatCompactDate,
  formatCompactTime,
} from "@/src/lib/datetime/request-date-time-format";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CalendarDays, Clock } from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import DatePicker, { DatePickerProps } from "react-native-date-picker";

type Props = {
  mode: "date" | "time";
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
  /** Same pattern as `Input`: error border, `errorContainer` fill, message below. */
  error?: string;
  /** When `error` is set, still show styling but hide the caption (e.g. sibling field shows the message). */
  showErrorText?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
};

export function DateTimeField({
  mode,
  label,
  value,
  onChange,
  placeholder,
  error,
  showErrorText = true,
  minimumDate,
  maximumDate,
}: Props) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [open, setOpen] = useState(false);
  const displayError = Boolean(error);

  const isDark = resolvedTheme === "dark";

  const formatValue = () => {
    if (!value) return "";
    return mode === "date" ? formatCompactDate(value, "always") : formatCompactTime(value);
  };

  const display = formatValue();

  return (
    <View style={styles.wrapper}>
      <AppText
        variant="label"
        color={
          displayError ? colors.onErrorContainer : colors.onSurfaceVariant
        }
        style={styles.label}
      >
        {label}
      </AppText>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.field,
          {
            borderWidth: 1,
            borderColor: displayError ? colors.error : colors.outlineVariant,
            backgroundColor: displayError
              ? colors.errorContainer
              : colors.surfaceContainer,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <AppText
          variant="body"
          color={
            displayError
              ? colors.onErrorContainer
              : display
                ? colors.onSurface
                : colors.onSurfaceVariant
          }
          style={styles.value}
        >
          {display || placeholder || "—"}
        </AppText>
        {mode === "date" ? (
          <CalendarDays
            size={18}
            color={
              displayError ? colors.onErrorContainer : colors.onSurfaceVariant
            }
          />
        ) : (
          <Clock
            size={18}
            color={
              displayError ? colors.onErrorContainer : colors.onSurfaceVariant
            }
          />
        )}
      </TouchableOpacity>

      {displayError && showErrorText ? (
        <AppText
          variant="caption"
          color={colors.error}
          style={styles.errorText}
        >
          {error}
        </AppText>
      ) : null}

      <DatePicker
        modal
        open={open}
        mode={mode as DatePickerProps["mode"]}
        theme={isDark ? "dark" : "light"}
        date={value ?? new Date()}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onConfirm={(d) => {
          setOpen(false);
          onChange(d);
        }}
        onCancel={() => setOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  label: {
    marginBottom: 4,
    fontSize: 12,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  value: {
    marginRight: 8,
    fontSize: 14,
  },
  errorText: {
    marginTop: 6,
    marginLeft: 4,
  },
});
