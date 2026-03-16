import React from 'react';
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from './AppText';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantBg: Record<Variant, (colors: typeof Colors.light) => string> = {
  primary: (c) => c.primary,
  secondary: (c) => c.secondary,
  outline: () => 'transparent',
  ghost: () => 'transparent',
  danger: (c) => c.error,
};

const variantTextColor: Record<Variant, (colors: typeof Colors.light) => string> = {
  primary: (c) => c.onPrimary,
  secondary: (c) => c.onSecondary,
  outline: (c) => c.primary,
  ghost: (c) => c.primary,
  danger: (c) => c.onError,
};

/**
 * Button with design specs: flex, padding 12x24, center, gap 8, stretch.
 * Label: On-Primary #FFF, Roboto 14px weight 500, lineHeight 20, letterSpacing -0.2.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const isDisabled = disabled || loading;

  const backgroundColor = variant === 'outline' || variant === 'ghost'
    ? 'transparent'
    : variantBg[variant](colors);
  const borderWidth = variant === 'outline' ? 1.5 : 0;
  const borderColor = variant === 'outline' ? colors.primary : 'transparent';

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor,
          borderWidth,
          borderColor,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.onPrimary}
        />
      )}
      <AppText
        variant="label"
        color={variantTextColor[variant](colors)}
        style={styles.label}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    display: 'flex',
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
  },
  label: {
    textAlign: 'center',
    fontFamily: 'Roboto_500Medium',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
});
