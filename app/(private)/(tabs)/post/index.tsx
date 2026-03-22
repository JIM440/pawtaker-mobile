import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { View } from "react-native";

/**
 * Placeholder for the Post tab route. The + tab uses a custom button that opens
 * the action modal instead of navigating here; this keeps the navigator happy.
 */
export default function PostTabIndex() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return <View style={{ flex: 1, backgroundColor: colors.background }} />;
}
