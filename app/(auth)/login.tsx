import { Colors } from "@/src/constants/colors";
import { useSignupStore } from "@/src/lib/store/signup.store";
import { INPUT_LIMITS } from "@/src/constants/input-limits";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { signInWithGoogleNative } from "@/src/lib/supabase/google-auth";
import { TextField } from "@/src/shared/components/forms/TextField";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { validateRequired } from "@/src/shared/utils/auth-validation";
import { isValidEmail } from "@/src/shared/utils/is-valid-email";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { LocalSvg } from "react-native-svg/css";

export default function LoginScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { setSignupEmail } = useSignupStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVerificationHelp, setShowVerificationHelp] = useState(false);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const openSignupVerification = () => {
    const nextEmail = email.trim();
    if (!nextEmail) return;

    setSignupEmail(nextEmail);
    router.push({
      pathname: "/(auth)/signup/verify",
      params: { email: nextEmail },
    } as any);
  };

  const isUnverifiedEmailError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("email not confirmed") ||
      normalized.includes("email not verified") ||
      normalized.includes("confirm your email")
    );
  };

  const openLegal = (kind: "terms" | "privacy") => {
    const url =
      kind === "terms"
        ? process.env.EXPO_PUBLIC_TERMS_URL
        : process.env.EXPO_PUBLIC_PRIVACY_URL;
    if (url) {
      void Linking.openURL(url);
    } else {
      setInfoModal({
        title: t("app.name"),
        description: t("auth.legalPagesUnavailable"),
      });
    }
  };

  const onSocialPress = () => {
    setInfoModal({
      title: t("app.name"),
      description: t("auth.socialSignInComingSoon"),
    });
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setShowVerificationHelp(false);
    setLoading(true);
    const { error: googleError } = await signInWithGoogleNative();
    setLoading(false);

    if (googleError) {
      setError(googleError);
    }
  };

  const handleSignIn = async () => {
    setError(null);
    setShowVerificationHelp(false);

    setEmailTouched(true);
    setPasswordTouched(true);

    const emailValue = email.trim();
    const nextEmailError = !emailValue
      ? t("errors.required")
      : !isValidEmail(emailValue)
        ? t("errors.invalidEmail")
        : null;
    const nextPasswordError = !validateRequired(password)
      ? t("errors.required")
      : null;

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) return;

    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (signInError) {
      if (isUnverifiedEmailError(signInError.message)) {
        setSignupEmail(emailValue);
        setError(t("auth.login.emailNotVerified"));
        setShowVerificationHelp(true);
        return;
      }

      setError(t("auth.login.invalidCredentials"));
    }
  };

  useEffect(() => {
    if (!emailTouched) {
      setEmailError(null);
      return;
    }

    const emailValue = email.trim();
    if (!emailValue) {
      setEmailError(t("errors.required"));
      return;
    }

    if (!isValidEmail(emailValue)) {
      setEmailError(t("errors.invalidEmail"));
      return;
    }

    setEmailError(null);
  }, [email, emailTouched, t]);

  useEffect(() => {
    if (!passwordTouched) {
      setPasswordError(null);
      return;
    }

    setPasswordError(!validateRequired(password) ? t("errors.required") : null);
  }, [password, passwordTouched, t]);

  return (
    <PageContainer>
      <BackHeader className="pl-0" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingTop: 16 }}
      >
        <AppText
          variant="title"
          color={colors.onSurface}
          style={{ marginBottom: 8, fontSize: 28, fontWeight: "700" }}
        >
          {t("auth.login.title")}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 24, lineHeight: 22 }}
        >
          {t("auth.login.subtitle")}
        </AppText>

        <TextField
          label={t("auth.login.emailLabel")}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailTouched(true);
            setShowVerificationHelp(false);
          }}
          placeholder={t("auth.login.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={emailError ?? undefined}
          maxLength={INPUT_LIMITS.email}
        />
        <TextField
          label={t("auth.login.passwordLabel")}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordTouched(true);
            setShowVerificationHelp(false);
          }}
          placeholder={t("auth.login.passwordPlaceholder")}
          isPassword
          textContentType="password"
          autoComplete="password"
          error={passwordError ?? undefined}
          maxLength={INPUT_LIMITS.password}
        />

        {error ? (
          <AppText
            variant="caption"
            color={colors.error}
            style={{ marginBottom: 12 }}
          >
            {error}
          </AppText>
        ) : null}

        {showVerificationHelp ? (
          <TouchableOpacity
            onPress={openSignupVerification}
            style={{ alignSelf: "flex-start", marginBottom: 12 }}
          >
            <AppText variant="body" color={colors.primary}>
              {t("auth.login.resumeVerification")}
            </AppText>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          style={{ alignSelf: "flex-end", marginBottom: 24 }}
        >
          <AppText variant="body" color={colors.primary}>
            {t("auth.login.forgotPassword")}
          </AppText>
        </TouchableOpacity>

        <View style={{ marginBottom: 20 }}>
          <Button
            label={loading ? t("auth.login.signingIn") : t("auth.login.submit")}
            onPress={handleSignIn}
            loading={loading}
            disabled={loading}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.outlineVariant,
            }}
          />
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ marginHorizontal: 12 }}
          >
            {t("auth.orContinueWith")}
          </AppText>
          <View
            style={{
              flex: 1,
              height: 1,
              backgroundColor: colors.outlineVariant,
            }}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 16,
            marginBottom: 28,
          }}
        >
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Google"
          >
            <LocalSvg asset={require("@/assets/icons/google.svg")} width={32} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onSocialPress}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: colors.surfaceContainerLowest,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Apple"
          >
            <Ionicons name="logo-apple" size={26} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

        <Text
          style={{
            textAlign: "center",
            color: colors.onSurfaceVariant,
            fontSize: 15,
            lineHeight: 22,
            marginBottom: 20,
          }}
        >
          {t("auth.login.noAccountPrefix")}{" "}
          <Text
            style={{ fontWeight: "700", color: colors.onSurface }}
            onPress={() => router.push("/(auth)/signup")}
          >
            {t("auth.login.signUpLink")}
          </Text>
        </Text>

        <Text
          style={{
            textAlign: "center",
            color: colors.onSurfaceVariant,
            fontSize: 12,
            lineHeight: 18,
          }}
        >
          {t("auth.legalPrefix")}{" "}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={() => openLegal("terms")}
          >
            {t("auth.termsOfService")}
          </Text>
          {t("auth.legalMiddle")}
          <Text
            style={{ textDecorationLine: "underline" }}
            onPress={() => openLegal("privacy")}
          >
            {t("auth.privacyPolicy")}
          </Text>
          .
        </Text>
      </ScrollView>

      <FeedbackModal
        visible={infoModal !== null}
        title={infoModal?.title ?? ""}
        description={infoModal?.description}
        primaryLabel={t("common.ok", "OK")}
        onPrimary={() => setInfoModal(null)}
        onRequestClose={() => setInfoModal(null)}
      />
    </PageContainer>
  );
}
