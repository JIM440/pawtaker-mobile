import { Colors } from "@/src/constants/colors";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { View } from "react-native";

type Props = {
  label: string;
  value: string;
  colors: typeof Colors.light | typeof Colors.dark;
  styles: any;
};

export function PetDetailPill({ label, value, colors, styles }: Props) {
  return (
    <View style={styles.detailPillGroup}>
      <AppText
        variant="caption"
        color={colors.onSurfaceVariant}
        style={styles.pillLabel}
      >
        {label}
      </AppText>
      <View style={[styles.pillValue, { borderColor: colors.outlineVariant }]}>
        <AppText variant="caption" color={colors.onSurfaceVariant}>
          {value}
        </AppText>
      </View>
    </View>
  );
}
