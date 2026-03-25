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
  secondaryLabel?: string;
  onSecondary?: () => void;
  mode?: "inline" | "full";
  illustration?: React.ReactNode;
};

export function DataState({
  title,
  message,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  mode = "inline",
  illustration,
}: DataStateProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const formattedMessage = React.useMemo(() => {
    const raw = message?.trim();
    if (!raw) return message;

    const titleNormalized = title.toLowerCase();
    const isErrorState =
      titleNormalized.includes("something went wrong") ||
      titleNormalized.includes("error");

    if (!isErrorState) return message;

    const looksTechnical =
      /42P01|does not exist|permission|network|violat|invalid|syntax/i.test(raw) ||
      raw.length > 140;

    if (looksTechnical) {
      return `Couldn't load this right now. Please try again.\n\nDetails: ${raw}`;
    }

    if (/try again/i.test(raw)) return message;
    return `${raw}\n\nPlease try again.`;
  }, [title, message]);

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
          {formattedMessage}
        </AppText>
      )}
      {(actionLabel && onAction) || (secondaryLabel && onSecondary) ? (
        <View style={styles.actionsRow}>
          {actionLabel && onAction ? (
            <Button
              label={actionLabel}
              onPress={onAction}
              variant="outline"
              fullWidth={false}
              style={styles.actionInRow}
            />
          ) : null}
          {secondaryLabel && onSecondary ? (
            <Button
              label={secondaryLabel}
              onPress={onSecondary}
              variant="outline"
              fullWidth={false}
              style={styles.actionInRow}
            />
          ) : null}
        </View>
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
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 8,
    maxWidth: 360,
    alignSelf: "center",
  },
  actionInRow: {
    minWidth: 120,
  },
});
