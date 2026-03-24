import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useForgotPasswordStore } from "@/src/lib/store/forgotPassword.store";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { TextField } from "@/src/shared/components/forms/TextField";
import {
  validatePassword,
  validateRequired,
} from "@/src/shared/utils/auth-validation";
import { CircleX } from "lucide-react-native";

export default function ForgotPasswordNewPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const { newPassword: storedNewPassword, setNewPassword } =
    useForgotPasswordStore();

  const [password, setPassword] = useState(storedNewPassword);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setPassword(storedNewPassword);
  }, [storedNewPassword]);

  const passwordError = useMemo(() => {
    if (!touched) return undefined;
    if (!validateRequired(password)) return t("errors.required");
    if (!validatePassword(password)) return t("errors.passwordTooShort");
    return undefined;
  }, [password, touched, t]);

  const handleContinue = async () => {
    setTouched(true);
    setFormError(null);

    if (!validatePassword(password)) {
      setFormError(t("errors.passwordTooShort"));
      return;
    }

    setLoading(true);
    setNewPassword(password);
    setLoading(false);

    router.replace("/(auth)/forgot-password/confirm-password");
  };

  return (
    <PageContainer>
      <BackHeader className="px-0" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingTop: 16 }}
      >
        <AppText
          variant="title"
          color={colors.onSurface}
          style={{ marginBottom: 8, fontSize: 32 }}
        >
          {t("auth.forgotPassword.newPasswordTitle")}
        </AppText>

        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 24 }}
        >
          {t("auth.forgotPassword.newPasswordSubtitle")}
        </AppText>

        <View style={{ width: "100%" }}>
          <TextField
            label={t("auth.forgotPassword.newPasswordLabel")}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setTouched(true);
              setFormError(null);
            }}
            placeholder={t("auth.forgotPassword.newPasswordPlaceholder")}
            isPassword
            textContentType="newPassword"
            autoComplete="password-new"
            error={passwordError ?? undefined}
            rightIcon={
              formError ? (
                <CircleX size={20} color={colors.error} />
              ) : undefined
            }
          />
        </View>

        {formError ? (
          <AppText
            variant="caption"
            color={colors.error}
            style={{ marginTop: 10, marginBottom: 16, textAlign: "center" }}
          >
            {formError}
          </AppText>
        ) : null}

        <View style={{ width: "100%", marginTop: 12 }}>
          <Button
            label={
              loading
                ? t("auth.forgotPassword.continuing")
                : t("auth.forgotPassword.newPasswordSubmit")
            }
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </PageContainer>
  );
}

