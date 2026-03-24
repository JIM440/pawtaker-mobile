import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React, { useMemo, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { AppText } from "../ui/AppText";

type OtpInputProps = {
  value: string;
  onChangeText: (next: string) => void;
  length?: number;
  error?: string;
  /** Hide error styling/message until the user has focused the OTP field once */
  showErrorOnlyAfterFocus?: boolean;
};

export function OtpInput({
  value,
  onChangeText,
  length = 8,
  error,
  showErrorOnlyAfterFocus = true,
}: OtpInputProps) {
  const inputRef = useRef<TextInput | null>(null);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [isFocused, setIsFocused] = useState(false);
  const [hasBeenFocused, setHasBeenFocused] = useState(false);

  const boxWidth = 40;
  const boxHeight = 52;
  const boxGap = 8;
  const totalWidth = boxWidth * length + boxGap * (length - 1);

  const digits = useMemo(() => {
    const clean = value.replace(/[^0-9]/g, "").slice(0, length);
    return clean.split("");
  }, [value, length]);

  const displayError = Boolean(
    error && (!showErrorOnlyAfterFocus || hasBeenFocused),
  );
  const boxBg = displayError
    ? colors.errorContainer
    : colors.surfaceContainerHighest;
  const activeIndex = Math.min(digits.length, length - 1);
  const digitColor = displayError ? colors.error : colors.onSurface;

  return (
    <View>
      <Pressable
        onPress={() => inputRef.current?.focus()}
        style={{
          width: totalWidth,
          height: boxHeight,
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: boxGap,
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length }).map((_, i) => {
            const digit = digits[i] ?? "";
            return (
              <View
                key={i}
                style={{
                  width: boxWidth,
                  height: boxHeight,
                  borderRadius: 4,
                  backgroundColor: boxBg,
                  borderWidth: 1,
                  borderColor: displayError
                    ? colors.error
                    : isFocused && i === activeIndex
                      ? colors.outline
                      : colors.outlineVariant,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ color: digitColor, fontSize: 22, fontWeight: "700" }}
                >
                  {digit}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Hidden input captures numeric keyboard; boxes are visual only. */}
        <TextInput
          ref={(r) => {
            inputRef.current = r;
          }}
          value={value}
          onChangeText={(t) => {
            const clean = t.replace(/[^0-9]/g, "").slice(0, length);
            onChangeText(clean);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={length}
          autoCorrect={false}
          autoComplete="one-time-code"
          onFocus={() => {
            setHasBeenFocused(true);
            setIsFocused(true);
          }}
          onBlur={() => setIsFocused(false)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            opacity: 0,
          }}
        />
      </Pressable>

      {displayError ? (
        <AppText
          variant="caption"
          color={colors.error}
          style={{ marginTop: 10, marginBottom: 16, textAlign: "center" }}
        >
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
