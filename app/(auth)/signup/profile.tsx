import { Colors } from "@/src/constants/colors";
import { supabase } from "@/src/lib/supabase/client";
import { useSignupStore } from "@/src/lib/store/signup.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { TextField } from "@/src/shared/components/forms/TextField";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { validateRequired } from "@/src/shared/utils/auth-validation";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, View } from "react-native";

export default function SignupProfileScreen() {
  const { t } = useTranslation();
  const { setProfile, clearSignup } = useSignupStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    setError(null);

    if (!validateRequired(displayName) || !validateRequired(location)) {
      setError(t("errors.required"));
      return;
    }

    // Save to Zustand only — no Supabase call here
    setProfile(displayName.trim(), location.trim(), bio.trim());
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
      setError(t("common.error"));
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase
      .from("users")
      .update({
        full_name: displayName.trim(),
        bio: bio.trim() || null,
        city: location.trim(),
      })
      .eq("id", userId);
    setLoading(false);

    if (updateError) {
      setError(t("common.error"));
      return;
    }

    clearSignup();
    router.push("/(private)/kyc" as any);
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
          color={colors.textPrimary}
          style={{ marginBottom: 32, textAlign: "left" }}
        >
          {t("auth.signup.profile.title")}
        </AppText>

        <TextField
          label={t("auth.signup.profile.displayNameLabel")}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={t("auth.signup.profile.displayNamePlaceholder")}
          autoCapitalize="words"
        />
        <TextField
          label={t("auth.signup.profile.locationLabel")}
          value={location}
          onChangeText={setLocation}
          placeholder={t("auth.signup.profile.locationPlaceholder")}
          autoCapitalize="words"
        />
        <TextField
          label={t("auth.signup.profile.bioLabel")}
          value={bio}
          onChangeText={setBio}
          placeholder={t("auth.signup.profile.bioPlaceholder")}
          multiline
        />

        {error && (
          <AppText
            variant="caption"
            color={colors.error}
            style={{ marginTop: 8, marginBottom: 16 }}
          >
            {error}
          </AppText>
        )}

        <View style={{ marginTop: 8, marginBottom: 12 }}>
          <Button
            label={loading ? t("common.loading") : t("auth.signup.profile.submit")}
            onPress={handleNext}
            variant="primary"
            fullWidth
            loading={loading}
            disabled={loading}
          />
        </View>
      </ScrollView>
    </PageContainer>
  );
}
