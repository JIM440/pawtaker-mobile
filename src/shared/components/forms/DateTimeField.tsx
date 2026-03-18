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
};

export function DateTimeField({
  mode,
  label,
  value,
  onChange,
  placeholder,
}: Props) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [open, setOpen] = useState(false);

  const isDark = resolvedTheme === "dark";

  const formatValue = () => {
    if (!value) return "";
    if (mode === "date") {
      return value.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return value.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const display = formatValue();

  return (
    <View style={styles.wrapper}>
      <AppText
        variant="label"
        color={colors.onSurfaceVariant}
        style={styles.label}
      >
        {label}
      </AppText>
      <TouchableOpacity
        activeOpacity={0.8}
        style={[
          styles.field,
          {
            backgroundColor: colors.surfaceContainer,
          },
        ]}
        onPress={() => setOpen(true)}
      >
        <AppText
          variant="body"
          color={display ? colors.onSurface : colors.onSurfaceVariant}
          style={styles.value}
        >
          {display || placeholder || "—"}
        </AppText>
        {mode === "date" ? (
          <CalendarDays size={18} color={colors.onSurfaceVariant} />
        ) : (
          <Clock size={18} color={colors.onSurfaceVariant} />
        )}
      </TouchableOpacity>

      <DatePicker
        modal
        open={open}
        mode={mode as DatePickerProps["mode"]}
        theme={isDark ? "dark" : "light"}
        date={value ?? new Date()}
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
});
