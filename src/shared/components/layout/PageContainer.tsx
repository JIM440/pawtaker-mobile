import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';

type PageContainerProps = {
  children: React.ReactNode;
  /** When true, content is in a ScrollView; when false, a View with flex 1 */
  scrollable?: boolean;
  /** Applied to the outer SafeAreaView (overwrites default background, etc.) */
  style?: StyleProp<ViewStyle>;
  /** Applied to the inner ScrollView/View (overwrites default padding) */
  contentStyle?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
};

const DEFAULT_PADDING_VERTICAL = 16;
const DEFAULT_PADDING_HORIZONTAL = 10;

/**
 * Page container with safe area, background (Schemes-Background), and default padding.
 * Pass style/contentStyle to overwrite defaults. Use scrollable to choose ScrollView vs View.
 */
export function PageContainer({
  children,
  scrollable = false,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
}: PageContainerProps) {
  const { resolvedTheme } = useThemeStore();
  const backgroundColor = Colors[resolvedTheme].background;

  const contentPadding = {
    paddingVertical: DEFAULT_PADDING_VERTICAL,
    paddingHorizontal: DEFAULT_PADDING_HORIZONTAL,
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor }, style]}
      edges={edges}
    >
      {scrollable ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, contentPadding, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, contentPadding, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
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
