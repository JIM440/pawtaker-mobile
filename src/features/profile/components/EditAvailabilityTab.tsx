import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";

export function EditAvailabilityTab() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.container}>
      <AppText variant="body" color={colors.onSurfaceVariant}>
        Set your availability schedule here. This helps pet owners know when
        you're free to take care of their pets.
      </AppText>

      <View
        style={[
          styles.placeholder,
          { backgroundColor: colors.surfaceContainerHighest, borderColor: colors.outlineVariant },
        ]}
      >
        <AppText variant="caption" color={colors.onSurfaceVariant}>
          Availability calendar coming soon
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 24,
    gap: 16,
  },
  placeholder: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
});
