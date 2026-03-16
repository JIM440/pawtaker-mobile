import React from "react";
import { View, StyleSheet } from "react-native";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Colors } from "@/src/constants/colors";
import { AppText } from "@/src/shared/components/ui/AppText";

export function ProfileAvailabilityTab() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.placeholder}>
      <AppText variant="body" color={colors.onSurfaceVariant}>
        Availability
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});

