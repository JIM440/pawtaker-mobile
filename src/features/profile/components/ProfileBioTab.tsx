import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";

export function ProfileBioTab() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.placeholder}>
      <AppText variant="caption" color={colors.onSurfaceVariant}>
        Hi! I'm a passionate pet owner who loves connecting with fellow animal
        lovers in the community. I'm always happy to help care for your furry
        friends and believe every pet deserves kindness and fun adventures!
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
