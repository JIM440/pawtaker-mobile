import { Eye, EyeOff } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { Pressable } from "react-native";
import type { TextInputProps } from "react-native";
import { useTranslation } from "react-i18next";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Input } from "@/src/shared/components/ui/Input";

interface Props extends TextInputProps {
  label: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export function TextField({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  secureTextEntry,
  ...props
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const computedSecureTextEntry = useMemo(() => {
    if (!isPassword) {
      return secureTextEntry;
    }
    return !isPasswordVisible;
  }, [isPassword, secureTextEntry, isPasswordVisible]);

  const computedRightIcon = useMemo(() => {
    if (!isPassword) {
      return rightIcon;
    }

    return (
      <Pressable
        onPress={() => setIsPasswordVisible((prev) => !prev)}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={
          isPasswordVisible ? t("auth.hidePassword") : t("auth.showPassword")
        }
      >
        {isPasswordVisible ? (
          <EyeOff size={22} color={colors.onSurfaceVariant} />
        ) : (
          <Eye size={22} color={colors.onSurfaceVariant} />
        )}
      </Pressable>
    );
  }, [isPassword, rightIcon, isPasswordVisible, t, colors.onSurfaceVariant]);

  return (
    <Input
      label={label}
      error={error}
      leftIcon={leftIcon}
      rightIcon={computedRightIcon}
      secureTextEntry={computedSecureTextEntry}
      {...props}
    />
  );
}

