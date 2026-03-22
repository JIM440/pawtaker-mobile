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
  /**
   * When true (default), border/error text only appear after the user has focused
   * the field at least once — avoids showing validation errors before interaction.
   */
  showErrorOnlyAfterFocus?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  showErrorOnlyAfterFocus = true,
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
  const [hasBeenFocused, setHasBeenFocused] = useState(false);

  const handleFocus = (e: any) => {
    setHasBeenFocused(true);
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const displayError = Boolean(
    error && (!showErrorOnlyAfterFocus || hasBeenFocused),
  );

  return (
    <View style={{ marginBottom: 20 }}>
      <View
        style={[
          {
            borderWidth: 1,
            borderColor: displayError
              ? colors.error
              : isFocused
                ? colors.primary
                : colors.outlineVariant,
            borderRadius: 16,
            // Error state: tinted fill (Material errorContainer) — matches Figma error fields
            backgroundColor: displayError
              ? colors.errorContainer
              : colors.surfaceContainerHighest,
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
            color={
              displayError
                ? colors.onErrorContainer
                : isFocused
                  ? colors.primary
                  : colors.onSurfaceVariant
            }
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
                color: displayError ? colors.onErrorContainer : colors.onSurface,
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
      {displayError ? (
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
