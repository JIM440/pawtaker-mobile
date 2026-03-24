import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { Switch, type SwitchProps } from "react-native";

export function AppSwitch(props: SwitchProps) {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    return (
        <Switch
            trackColor={{
                false: colors.surfaceContainerHighest,
                true: colors.primary,
            }}
            thumbColor={colors.onPrimary}
            ios_backgroundColor={colors.surfaceContainerHighest}
            {...props}
        />
    );
}
