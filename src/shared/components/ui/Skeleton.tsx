import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import React, { useEffect } from 'react';
import { DimensionValue, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type SkeletonProps = {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
};

/**
 * Premium shimmering skeleton loader block.
 * Uses reactive opacity pulse for a high-end feel in absence of linear gradient.
 */
export function Skeleton({
  width,
  height,
  borderRadius = 12, // More modern default
  style,
}: SkeletonProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          backgroundColor: colors.surfaceContainerHighest,
          borderRadius,
        },
        width != null && { width },
        height != null && { height },
        style,
        animatedStyle,
      ]}
    />
  );
}
