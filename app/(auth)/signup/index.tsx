import { Colors } from "@/src/constants/colors";
import { INPUT_LIMITS } from "@/src/constants/input-limits";
import { useSignupStore } from "@/src/lib/store/signup.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { signInWithGoogleNative } from "@/src/lib/supabase/google-auth";
import { TextField } from "@/src/shared/components/forms/TextField";
import { BackHeader } from "@/src/shared/components/layout";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import {
    validatePassword,
    validatePasswordMatch,
    validateRequired,
} from "@/src/shared/utils/auth-validation";
import { isValidEmail } from "@/src/shared/utils/is-valid-email";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Linking,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LocalSvg } from "react-native-svg/css";

export default function SignupScreen() {
  const { t } = useTranslation();
  const { setCredentials, setSignupEmail } = useSignupStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const isRateLimitError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("rate limit") ||
      normalized.includes("too many requests") ||
      normalized.includes("over_email_send_rate_limit")
    );
  };

  const isExistingAccountError = (message: string) => {
    const normalized = message.toLowerCase();
    return (
      normalized.includes("already registered") ||
      normalized.includes("already exists") ||
      normalized.includes("already been registered") ||
      normalized.includes("user already")
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
    setLoading(true);
    const { error: googleError } = await signInWithGoogleNative();
    setLoading(false);

    if (googleError) {
      setError(googleError);
    }
  };

  const handleSignUp = async () => {
    setError(null);

    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setUsernameTouched(true);

    const emailValue = email.trim();
    const nextEmailError = !emailValue
      ? t("errors.required")
      : !isValidEmail(emailValue)
        ? t("errors.invalidEmail")
        : null;
    const nextPasswordError = !validateRequired(password)
      ? t("errors.required")
      : !validatePassword(password)
        ? t("errors.passwordTooShort")
        : null;
    const nextConfirmPasswordError = !validateRequired(confirmPassword)
      ? t("errors.required")
      : !validatePasswordMatch(password, confirmPassword)
        ? t("errors.passwordsDoNotMatch")
        : null;
    const nextUsernameError = !validateRequired(username)
      ? t("errors.required")
      : null;

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setUsernameError(nextUsernameError);

    if (
      nextEmailError ||
      nextPasswordError ||
      nextConfirmPasswordError ||
      nextUsernameError
    )
      return;

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: username.trim(),
          has_had_pet: false,
        },
      },
    });

    setLoading(false);

    if (signUpError) {
      if (isExistingAccountError(signUpError.message)) {
        const nextEmail = email.trim();
        setSignupEmail(nextEmail);

        const { error: resendError } = await supabase.auth.resend({
          type: "signup",
          email: nextEmail,
        });

        const notice = resendError
          ? isRateLimitError(resendError.message)
            ? t("auth.signup.verify.rateLimitedUseLatest")
            : t("auth.signup.verify.useMostRecentCode")
          : t("auth.signup.verify.resendSuccess");

        router.push({
          pathname: "/(auth)/signup/verify",
          params: { email: nextEmail, notice },
        } as any);
        return;
      }

      if (isRateLimitError(signUpError.message)) {
        setSignupEmail(email.trim());
        router.push({
          pathname: "/(auth)/signup/verify",
          params: {
            email: email.trim(),
            notice: t("auth.signup.verify.rateLimitedUseLatest"),
          },
        } as any);
        return;
      }

      setError(t("auth.signup.credentials.genericError"));
      return;
    }

    setCredentials(username.trim(), email.trim(), password);
    router.push("/(auth)/signup/verify");
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

    if (!validateRequired(password)) {
      setPasswordError(t("errors.required"));
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError(t("errors.passwordTooShort"));
      return;
    }

    setPasswordError(null);
  }, [password, passwordTouched, t]);

  useEffect(() => {
    if (!confirmPasswordTouched) {
      setConfirmPasswordError(null);
      return;
    }

    if (!validateRequired(confirmPassword)) {
      setConfirmPasswordError(t("errors.required"));
      return;
    }

    if (!validatePasswordMatch(password, confirmPassword)) {
      setConfirmPasswordError(t("errors.passwordsDoNotMatch"));
      return;
    }

    setConfirmPasswordError(null);
  }, [confirmPassword, confirmPasswordTouched, password, t]);

  useEffect(() => {
    if (!usernameTouched) {
      setUsernameError(null);
      return;
    }

    setUsernameError(!validateRequired(username) ? t("errors.required") : null);
  }, [username, usernameTouched, t]);

  return (
    <PageContainer>
      <BackHeader className="pl-0" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingVertical: 16 }}
      >
        <AppText
          variant="title"
          color={colors.onSurface}
          style={{ marginBottom: 8, fontSize: 28, fontWeight: "700" }}
        >
          {t("auth.signup.credentials.title")}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={{ marginBottom: 24, lineHeight: 22 }}
        >
          {t("auth.signup.credentials.subtitle")}
        </AppText>

        <TextField
          label={t("auth.signup.credentials.emailLabel")}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailTouched(true);
          }}
          placeholder={t("auth.signup.credentials.emailPlaceholder")}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          error={emailError ?? undefined}
          maxLength={INPUT_LIMITS.email}
        />
        <TextField
          label={t("auth.signup.credentials.passwordLabel")}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordTouched(true);
          }}
          placeholder={t("auth.signup.credentials.passwordPlaceholder")}
          isPassword
          textContentType="newPassword"
          autoComplete="password-new"
          error={passwordError ?? undefined}
          maxLength={INPUT_LIMITS.password}
        />
        <TextField
          label={t("auth.signup.credentials.confirmPasswordLabel")}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setConfirmPasswordTouched(true);
          }}
          placeholder={t("auth.signup.credentials.confirmPasswordPlaceholder")}
          isPassword
          textContentType="newPassword"
          autoComplete="password-new"
          error={confirmPasswordError ?? undefined}
          maxLength={INPUT_LIMITS.password}
        />
        <TextField
          label={t("auth.signup.credentials.usernameLabel")}
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameTouched(true);
          }}
          placeholder={t("auth.signup.credentials.usernamePlaceholder")}
          autoCapitalize="words"
          autoCorrect={false}
          error={usernameError ?? undefined}
          maxLength={INPUT_LIMITS.name}
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

        <View style={{ marginTop: 4, marginBottom: 20 }}>
          <Button
            label={
              loading
                ? t("auth.signup.credentials.signingUp")
                : t("auth.signup.credentials.submit")
            }
            onPress={handleSignUp}
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
          {t("auth.signup.credentials.alreadyPrefix")}{" "}
          <Text
            style={{ fontWeight: "700", color: colors.onSurface }}
            onPress={() => router.push("/(auth)/login")}
          >
            {t("auth.signup.credentials.signInLink")}
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
