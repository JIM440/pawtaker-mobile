import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import React from "react";
import { StyleSheet, View } from "react-native";

type DataStateProps = {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  mode?: "inline" | "full";
  illustration?: React.ReactNode;
};

export function DataState({
  title,
  message,
  actionLabel,
  onAction,
  mode = "inline",
  illustration,
}: DataStateProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={[styles.container, mode === "full" && styles.containerFull]}>
      {illustration ? (
        <View style={styles.illustrationWrap}>{illustration}</View>
      ) : (
        <View
          style={[
            styles.iconDot,
            {
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceContainerLow,
            },
          ]}
        />
      )}
      <AppText variant="title" color={colors.onSurface} style={styles.title}>
        {title}
      </AppText>
      {!!message && (
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={styles.message}
        >
          {message}
        </AppText>
      )}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="outline"
          fullWidth={false}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignSelf: "stretch",
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 10,
  },
  containerFull: {
    flex: 1,
    minHeight: 220,
  },
  iconDot: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
  },
  illustrationWrap: {
    marginBottom: 4,
  },
  title: {
    textAlign: "center",
  },
  message: {
    textAlign: "center",
    maxWidth: 320,
  },
  action: {
    marginTop: 8,
    alignSelf: "center",
  },
});
