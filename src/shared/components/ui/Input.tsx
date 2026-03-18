import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import {
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

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
    <View
      style={[
        {
          marginBottom: 16,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.outlineVariant,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
        },
        containerStyle,
      ]}
    >
      {label ? (
        <AppText
          variant="label"
          color={colors.onSurfaceVariant}
          style={{ fontSize: 12 }}
        >
          {label}
        </AppText>
      ) : null}
      <TextInput
        style={[
          {
            backgroundColor: colors.surfaceContainer,
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
