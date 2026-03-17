import React from 'react';
import {
  View,
  TextInput,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  ...props
}: InputProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={[{ marginBottom: 16 }, containerStyle]}>
      {label ? (
        <AppText
          variant="label"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 6, fontSize: 12 }}
        >
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[
          {
            backgroundColor: colors.surfaceContainer,
            borderWidth: 1,
            borderColor: error ? colors.error : colors.outlineVariant,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            color: colors.onSurface,
            fontSize: 14,
          },
          inputStyle,
        ]}
        placeholderTextColor={placeholderTextColor ?? colors.onSurfaceVariant}
        {...props}
      />
      {error ? (
        <AppText
          variant="caption"
          color={colors.error}
          style={{ marginTop: 6 }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
