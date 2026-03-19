import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Simple placeholder block for skeleton loaders. Uses theme surfaceContainer.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 999,
  style,
}: SkeletonProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainer;

  return (
    <View
      style={[
        { backgroundColor: bg, borderRadius },
        width != null && { width: width as DimensionValue },
        height != null && { height: height as DimensionValue },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({});
