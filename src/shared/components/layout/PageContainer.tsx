import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type PageContainerProps = {
  children: React.ReactNode;
  /** When true, content is in a ScrollView; when false, a View with flex 1 */
  scrollable?: boolean;
  /** Applied to the outer SafeAreaView (overwrites default background, etc.) */
  style?: StyleProp<ViewStyle>;
  /** Applied to the inner ScrollView/View (overwrites default padding) */
  contentStyle?: StyleProp<ViewStyle>;
};

const DEFAULT_PADDING_VERTICAL = 16;
const DEFAULT_PADDING_HORIZONTAL = 16;

/**
 * Page container with safe area, background (Schemes-Background), and default padding.
 * Pass style/contentStyle to overwrite defaults. Use scrollable to choose ScrollView vs View.
 */
export function PageContainer({
  children,
  style,
  contentStyle,
}: PageContainerProps) {
  const { resolvedTheme } = useThemeStore();
  const backgroundColor = Colors[resolvedTheme].background;

  const contentPadding = {
    paddingTop: DEFAULT_PADDING_VERTICAL,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  };

  return (
    <View
      style={[styles.safe, { backgroundColor }, style]}
      // edges={edges}
    >
      <View style={[styles.content, contentPadding, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
});
