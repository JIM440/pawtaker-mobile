import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";

type RequestPreviewCardProps = {
  children: React.ReactNode;
};

/**
 * Figma-aligned summary card for launch-request preview (node ~193-10179):
 * stacked rows with label + editable controls.
 */
export function RequestPreviewCard({ children }: RequestPreviewCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceBright,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      {children}
    </View>
  );
}

type RequestPreviewRowProps = {
  label: string;
  children: React.ReactNode;
  isLast?: boolean;
  /** Label stacks above full-width content (care types, special needs). */
  stacked?: boolean;
};

export function RequestPreviewRow({
  label,
  children,
  isLast,
  stacked,
}: RequestPreviewRowProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  if (stacked) {
    return (
      <View
        style={[
          styles.rowStacked,
          !isLast && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.stackedLabel}
        >
          {label}
        </AppText>
        <View style={styles.stackedContent}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.labelCol}>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.sideLabel}
          numberOfLines={3}
        >
          {label}
        </AppText>
      </View>
      <View style={styles.valueCol}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  labelCol: {
    width: 96,
    paddingTop: 2,
  },
  sideLabel: {
    fontWeight: "600",
    fontSize: 12,
    lineHeight: 16,
  },
  valueCol: {
    flex: 1,
    minWidth: 0,
  },
  rowStacked: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  stackedLabel: {
    fontWeight: "600",
    fontSize: 12,
  },
  stackedContent: {
    width: "100%",
  },
});
