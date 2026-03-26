import { Colors } from "@/src/constants/colors";
import { INPUT_LIMITS } from "@/src/constants/input-limits";
import { useForgotPasswordStore } from "@/src/lib/store/forgotPassword.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { TextField } from "@/src/shared/components/forms/TextField";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { isValidEmail } from "@/src/shared/utils/is-valid-email";
import { router } from "expo-router";
import { CircleX } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function ForgotPasswordEmailScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const { email: storedEmail, setEmail } = useForgotPasswordStore();
  const showToast = useToastStore((s) => s.showToast);

  const [email, setEmailLocal] = useState(storedEmail);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setEmailLocal(storedEmail);
  }, [storedEmail]);

  const emailError = useMemo(() => {
    if (!touched) return undefined;
    const value = email.trim();
    if (!value) return t("errors.required");
    const ok = isValidEmail(value);
    if (!ok) return t("errors.invalidEmail");
    return undefined;
  }, [email, touched, t]);

  const handleSend = async () => {
    setTouched(true);
    setFormError(null);

    if (emailError) return;

    const nextEmail = email.trim();
    if (!nextEmail) return;

    setLoading(true);
    setEmail(nextEmail);

    const { error } = await supabase.auth.resetPasswordForEmail(nextEmail);
    setLoading(false);

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("not found") || lower.includes("email")) {
        setFormError(t("auth.forgotPassword.emailNotFound"));
      } else {
        setFormError(error.message);
      }
      return;
    }

    showToast({
      variant: "success",
      message: t("auth.forgotPassword.success"),
      durationMs: 1200,
    });
    setTimeout(() => {
      router.replace("/(auth)/forgot-password/verify");
    }, 900);
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
          {t("auth.forgotPassword.title")}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 24 }}
        >
          {t("auth.forgotPassword.subtitle")}
        </AppText>

        <View style={{ width: "100%" }}>
          <TextField
            label={t(
              "auth.forgotPassword.emailLabel",
              t("auth.forgotPassword.email"),
            )}
            value={email}
            onChangeText={(v) => {
              setEmailLocal(v);
              setFormError(null);
            }}
            placeholder={t(
              "auth.forgotPassword.emailPlaceholder",
              "e.g. name@mail.com",
            )}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError ?? undefined}
            maxLength={INPUT_LIMITS.email}
            rightIcon={
              formError ? <CircleX size={20} color={colors.error} /> : undefined
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
                ? t("auth.forgotPassword.resetting")
                : t("auth.forgotPassword.submit")
            }
            onPress={handleSend}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View style={{ marginTop: 22 }}>
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={{ textAlign: "center", opacity: loading ? 0.6 : 1 }}
          >
            {t("auth.login.noAccountPrefix")}{" "}
            <AppText
              variant="body"
              color={colors.onSurface}
              style={{ fontWeight: "700" }}
              onPress={() => {
                if (loading) return;
                router.push("/(auth)/signup/credentials" as any);
              }}
            >
              {t("auth.login.signUpLink")}
            </AppText>
          </AppText>
        </View>
      </ScrollView>

    </PageContainer>
  );
}
