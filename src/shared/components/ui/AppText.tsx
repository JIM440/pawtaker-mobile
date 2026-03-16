import React from 'react';
import { Text, type TextProps, type StyleProp, type TextStyle } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';

type AppTextVariant = 'body' | 'label' | 'title' | 'headline' | 'caption';

type AppTextProps = TextProps & {
  variant?: AppTextVariant;
  /** Override text color (default: theme onSurface) */
  color?: string;
  style?: StyleProp<TextStyle>;
};

const variantStyles: Record<AppTextVariant, TextStyle> = {
  body: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: 'Roboto_500Medium',
    fontSize: 20,
    lineHeight: 28,
  },
  headline: {
    fontFamily: 'Roboto_700Bold',
    fontSize: 24,
    lineHeight: 32,
  },
  caption: {
    fontFamily: 'Roboto_400Regular',
    fontSize: 12,
    lineHeight: 16,
  },
};

/**
 * Reusable text component with Roboto and theme-aware color.
 * Use for all app text so typography and color stay consistent.
 */
export function AppText({
  variant = 'body',
  color,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { resolvedTheme } = useThemeStore();
  const defaultColor = color ?? Colors[resolvedTheme].onSurface;

  return (
    <Text
      style={[
        variantStyles[variant],
        { color: defaultColor },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
}
