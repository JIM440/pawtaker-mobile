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
}

const DEFAULT_DAYS = ["M", "Tu", "W", "Th", "F", "Sa", "Su"];

export function DaySelector({
    days = DEFAULT_DAYS,
    selectedDays,
    onToggle,
    circleSize = 44,
}: DaySelectorProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <View style={styles.daysRow}>
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
                                    : colors.surfaceContainerHighest,
                                borderColor: active ? colors.primary : "transparent",
                            },
                        ]}
                        onPress={() => onToggle(label)}
                    >
                        <AppText
                            variant="caption"
                            color={active ? colors.onPrimary : colors.onSurfaceVariant}
                            style={styles.dayLabel}
                        >
                            {label}
                        </AppText>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
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
});
