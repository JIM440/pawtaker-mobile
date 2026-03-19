import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";

interface ChipSelectorProps {
    label?: string;
    options: string[];
    selectedOption: string | null;
    onSelect: (option: string) => void;
    variant?: "primary" | "surface";
}

export function ChipSelector({
    label,
    options,
    selectedOption,
    onSelect,
    variant = "primary",
}: ChipSelectorProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <View style={styles.container}>
            {label && (
                <AppText
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    style={styles.label}
                >
                    {label}
                </AppText>
            )}
            <View style={styles.row}>
                {options.map((opt) => {
                    const active = selectedOption === opt;
                    return (
                        <TouchableOpacity
                            key={opt}
                            style={[
                                styles.chip,
                                {
                                    backgroundColor: active
                                        ? variant === "primary" ? colors.primary : colors.surfaceContainerHighest
                                        : "transparent",
                                    borderColor: colors.surfaceContainerHighest,
                                },
                            ]}
                            onPress={() => onSelect(opt)}
                        >
                            <AppText
                                variant="caption"
                                color={
                                    active
                                        ? (variant === "primary" ? colors.onPrimary : colors.onSurface)
                                        : colors.onSurfaceVariant
                                }
                            >
                                {opt}
                            </AppText>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    label: {
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
    },
});
