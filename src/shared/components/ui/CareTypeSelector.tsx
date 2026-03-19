import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { LucideIcon } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { AppText } from "./AppText";

export interface CareTypeOption {
    key: string;
    label: string;
    Icon: LucideIcon;
}

interface CareTypeSelectorProps {
    options: CareTypeOption[];
    selectedKeys: string[];
    onToggle: (key: string) => void;
    circleSize?: number;
    iconSize?: number;
}

export function CareTypeSelector({
    options,
    selectedKeys,
    onToggle,
    circleSize = 60,
    iconSize = 20,
}: CareTypeSelectorProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <View style={styles.serviceRow}>
            {options.map(({ key, label, Icon }) => {
                const active = selectedKeys.includes(key);
                return (
                    <TouchableOpacity
                        key={key}
                        activeOpacity={0.9}
                        onPress={() => onToggle(key)}
                        style={styles.serviceOption}
                    >
                        <View
                            style={[
                                styles.serviceCircle,
                                {
                                    width: circleSize,
                                    height: circleSize,
                                    backgroundColor: colors.surfaceContainerHighest,
                                    borderColor: active ? colors.primary : "transparent",
                                },
                            ]}
                        >
                            <Icon
                                size={iconSize}
                                color={active ? colors.primary : colors.onSurfaceVariant}
                            />
                        </View>
                        <AppText
                            variant="caption"
                            color={active ? colors.primary : colors.onSurfaceVariant}
                            style={styles.serviceOptionLabel}
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
    serviceRow: {
        flexDirection: "row",
        gap: 18,
        marginBottom: 8,
    },
    serviceOption: {
        alignItems: "center",
        gap: 4,
    },
    serviceCircle: {
        borderRadius: 999,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
    },
    serviceOptionLabel: {
        fontSize: 12,
    },
});
