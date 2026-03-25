import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { Switch, type SwitchProps } from "react-native";

export function AppSwitch(props: SwitchProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const isOn = props.value === true;

  return (
    <Switch
      trackColor={{
        false: colors.surfaceContainerLow, // inactive background
        true: colors.tertiary, // active background
      }}
      thumbColor={isOn ? colors.onPrimary : colors.outline}
      ios_backgroundColor={colors.surfaceContainerLow}
      {...props}
    />
  );
}
