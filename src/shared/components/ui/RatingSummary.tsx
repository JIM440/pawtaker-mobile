import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Handshake, PawPrint, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";

type RatingSummaryProps = {
  rating: number;
  handshakes: number;
  paws: number;
};

export function RatingSummary({
  rating,
  handshakes,
  paws,
}: RatingSummaryProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.pill,
          { backgroundColor: colors.surfaceContainerHighest },
        ]}
      >
        <AppText variant="caption" color={colors.onSurface}>
          {rating.toFixed(1)}
        </AppText>
        <Star
          size={12}
          color={colors.onSurfaceVariant}
          fill={colors.onSurfaceVariant}
        />
      </View>
      <View style={[styles.pill, { backgroundColor: colors.surfaceBright }]}>
        <View
          style={[
            styles.inner,
            {
              backgroundColor: colors.tertiaryContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <Handshake size={12} color={colors.tertiary} />
          <AppText variant="caption" color={colors.onTertiaryContainer}>
            {handshakes}
          </AppText>
        </View>
        <View
          style={[
            styles.inner,
            {
              backgroundColor: colors.primaryContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <PawPrint size={12} color={colors.onTertiary} />
          <AppText variant="caption" color={colors.onTertiary}>
            {paws}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
});
