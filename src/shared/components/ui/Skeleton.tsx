import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import React from 'react';
import { DimensionValue, View, ViewStyle } from 'react-native';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Static placeholder block for loading states (no pulse / fade animation).
 */
export function Skeleton({
  width,
  height,
  borderRadius = 12,
  style,
}: SkeletonProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceContainerHighest,
          borderRadius,
        },
        width != null && { width },
        height != null && { height },
        style,
      ]}
    />
  );
}
