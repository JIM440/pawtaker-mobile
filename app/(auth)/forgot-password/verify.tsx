import { Colors } from "@/src/constants/colors";
import { useForgotPasswordStore } from "@/src/lib/store/forgotPassword.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { OtpInput } from "@/src/shared/components/forms/OtpInput";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, TouchableOpacity, View } from "react-native";

export default function ForgotPasswordVerifyScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const { email } = useForgotPasswordStore();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtitle = useMemo(() => {
    return `${t("auth.forgotPassword.codeSubtitlePrefix", "Enter the 6-digit code we sent to")} `;
  }, [t]);

  const handleVerify = async () => {
    setError(null);

    if (otp.length < 6) {
      setError(t("auth.forgotPassword.invalidCode"));
      return;
    }

    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });
    setLoading(false);

    if (verifyError) {
      setError(t("auth.forgotPassword.invalidCode"));
      return;
    }

    router.replace("/(auth)/forgot-password/new-password");
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    const { error: resendError } =
      await supabase.auth.resetPasswordForEmail(email);
    setResending(false);

    if (resendError) {
      setError(resendError.message);
    }
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
          {t("auth.forgotPassword.codeTitle")}
        </AppText>

        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 8 }}
        >
          {subtitle}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurface}
          style={{ fontWeight: "700", marginBottom: 24 }}
        >
          {email}
        </AppText>

        <View style={{ width: "100%" }}>
          <OtpInput
            value={otp}
            onChangeText={setOtp}
            error={error ?? undefined}
          />
        </View>

        <View style={{ width: "100%", marginTop: 12 }}>
          <Button
            label={
              loading
                ? t("auth.forgotPassword.verifyingCode")
                : t("auth.forgotPassword.verify")
            }
            onPress={handleVerify}
            loading={loading}
            disabled={loading || resending}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 22,
          }}
        >
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={{ marginRight: 4 }}
          >
            {t("auth.forgotPassword.resendPrefix")}
          </AppText>
          <TouchableOpacity
            onPress={handleResend}
            disabled={resending || loading}
          >
            <AppText
              variant="body"
              color={colors.onSurface}
              style={{ fontWeight: "700", opacity: resending || loading ? 0.6 : 1 }}
            >
              {resending
                ? t("auth.forgotPassword.resending")
                : t("auth.forgotPassword.resend")}
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PageContainer>
  );
}
