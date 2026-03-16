import React from 'react';
import { View, TextInput, type KeyboardTypeOptions } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  error?: string;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  error,
}: Props) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View className="mb-4">
      <AppText variant="label" color={colors.onSurfaceVariant} className="mb-1">
        {label}
      </AppText>
      <TextInput
        className="border rounded-xl px-4 py-3 text-sm bg-surface"
        style={{ borderColor: colors.outlineVariant, color: colors.onSurface }}
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        value={value}
        onChangeText={onChangeText}
      />
      {!!error && (
        <AppText variant="caption" color={colors.error} className="mt-1">
          {error}
        </AppText>
      )}
    </View>
  );
}

