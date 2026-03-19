import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import React, { useState } from "react";
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
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  containerStyle,
  inputStyle,
  placeholderTextColor,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...props
}: InputProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={{ marginBottom: 20 }}>
      <View
        style={[
          {
            borderWidth: 1,
            borderColor: error
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.outlineVariant,
            borderRadius: 16,
            backgroundColor: colors.surfaceContainerHighest,
            paddingHorizontal: 16,
            paddingVertical: label ? 0 : 12,
            paddingTop: label ? 12 : 12,
            paddingBottom: label ? 4 : 12,
            minHeight: 48,
            justifyContent: "center",
          },
          containerStyle,
        ]}
      >
        {label ? (
          <AppText
            variant="caption"
            color={isFocused ? colors.primary : colors.onSurfaceVariant}
            style={{ lineHeight: 12 }}
          >
            {label}
          </AppText>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {leftIcon && <View style={{ marginRight: 10 }}>{leftIcon}</View>}
          <TextInput
            style={[
              {
                color: colors.onSurface,
                fontSize: 14,
                flex: 1,
              },
              inputStyle,
            ]}
            placeholderTextColor={placeholderTextColor ?? colors.onSurfaceVariant}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {rightIcon && <View style={{ marginLeft: 10 }}>{rightIcon}</View>}
        </View>
      </View>
      {error ? (
        <AppText
          variant="caption"
          color={colors.error}
          style={{ marginTop: 6, marginLeft: 4 }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
