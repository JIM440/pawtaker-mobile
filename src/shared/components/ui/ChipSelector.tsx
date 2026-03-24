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
    /** Tighter spacing for preview / inline summary rows (Figma chip row). */
    compact?: boolean;
}

export function ChipSelector({
    label,
    options,
    selectedOption,
    onSelect,
    variant = "primary",
    compact = false,
}: ChipSelectorProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <View style={[styles.container, compact && styles.containerCompact]}>
            {label && (
                <AppText
                    variant="caption"
                    color={colors.onSurfaceVariant}
                    style={[styles.label, compact && styles.labelCompact]}
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
                                compact && styles.chipCompact,
                                {
                                    backgroundColor: active
                                        ? variant === "primary" ? colors.primary : colors.surfaceContainerHighest
                                        : "transparent",
                                    borderColor: active
                                        ? variant === "primary"
                                            ? colors.primary
                                            : colors.outlineVariant
                                        : colors.outlineVariant,
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
    containerCompact: {
        marginTop: 0,
    },
    label: {
        marginBottom: 8,
    },
    labelCompact: {
        marginBottom: 6,
        fontWeight: "600",
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
    chipCompact: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
});
