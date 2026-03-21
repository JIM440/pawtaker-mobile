import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

import { supabase } from "@/src/lib/supabase/client";
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
  validatePasswordMatch,
  validateRequired,
} from "@/src/shared/utils/auth-validation";
import { CircleX } from "lucide-react-native";

export default function ForgotPasswordConfirmScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const { newPassword, clear } = useForgotPasswordStore();

  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setConfirm("");
    setTouched(false);
    setFormError(null);
  }, []);

  const confirmError = useMemo(() => {
    if (!touched) return undefined;
    if (!validateRequired(confirm)) return t("errors.required");
    if (!validatePasswordMatch(newPassword, confirm))
      return t("errors.passwordsDoNotMatch");
    return undefined;
  }, [confirm, touched, newPassword, t]);

  const handleUpdate = async () => {
    setTouched(true);
    setFormError(null);

    if (!validatePassword(newPassword)) {
      setFormError(t("errors.passwordTooShort"));
      return;
    }

    if (!validatePasswordMatch(newPassword, confirm)) {
      setFormError(t("errors.passwordsDoNotMatch"));
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    clear();
    router.replace("/(private)/(tabs)");
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
          {t("auth.forgotPassword.confirmPasswordLabel", "Confirm password")}
        </AppText>

        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 24 }}
        >
          {t("auth.forgotPassword.confirmPasswordSubtitle")}
        </AppText>

        <View style={{ width: "100%" }}>
          <TextField
            label={t(
              "auth.forgotPassword.confirmPasswordLabel",
              "Re-enter Password",
            )}
            value={confirm}
            onChangeText={(text) => {
              setConfirm(text);
              setTouched(true);
              setFormError(null);
            }}
            placeholder={t(
              "auth.forgotPassword.confirmPasswordPlaceholder",
              "Repeat your password",
            )}
            isPassword
            textContentType="newPassword"
            autoComplete="password-new"
            error={confirmError ?? undefined}
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
                ? t("auth.forgotPassword.updatingPassword")
                : t("auth.forgotPassword.confirmPasswordSubmit")
            }
            onPress={handleUpdate}
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </PageContainer>
  );
}

