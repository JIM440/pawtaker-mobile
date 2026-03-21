import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, View } from "react-native";

import { Colors } from "@/src/constants/colors";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";

type Slide = {
  key: string;
  title: string;
  subtitle: string;
  image: string;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { setOnboardingSeen, setGuestMode } = useAuthStore();

  const slides: Slide[] = useMemo(
    () => [
      {
        key: "s1",
        title: "Welcome to PawTaker",
        subtitle:
          "A community for pet lovers to find and offer care for their pets.",
        image:
          "https://w0.peakpx.com/wallpaper/299/432/HD-wallpaper-puppy-in-pink-basket-dog-fc-beautiful-pets-canine-animal-graphy-basket-wide-screen-flowers-dogs-puppy.jpg",
      },
      {
        key: "s2",
        title: "who cares?",
        subtitle: "there's an entire community of people at pawtaker who do.",
        image:
          "https://i.pinimg.com/originals/01/c9/a8/01c9a8250f74a2d41059d001ae926c07.jpg",
      },
      {
        key: "s3",
        title: "Let the community help",
        subtitle: "Create your account and connect with trusted pet lovers.",
        image:
          "https://i.pinimg.com/originals/92/7d/ed/927ded0ffd5d79af83fe405afd506542.jpg",
      },
    ],
    [],
  );

  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const handleContinue = () => {
    setOnboardingSeen(true);
    router.replace("/(auth)/welcome");
  };

  const handleGuest = () => {
    setOnboardingSeen(true);
    setGuestMode(true);
    router.replace("/(private)/(tabs)");
  };

  return (
    <PageContainer contentStyle={{ backgroundColor: colors.primary }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{ width: "100%", alignItems: "flex-end", marginBottom: 8 }}
        >
          <Pressable onPress={handleContinue} hitSlop={10}>
            <AppText
              variant="bodyLarge"
              color={colors.onPrimary}
              style={{ fontWeight: "600" }}
            >
              {t("common.skip", "Skip")}
            </AppText>
          </Pressable>
        </View>

        <Image
          source={{ uri: slide.image }}
          style={{
            width: "100%",
            height: 330,
            borderRadius: 16,
            marginBottom: 16,
          }}
          resizeMode="cover"
        />

        <View style={{ minHeight: 64, justifyContent: "center" }}>
          <AppText
            variant="headline"
            color={colors.onSurface}
            style={{ textAlign: "center", fontSize: 32, fontWeight: "700" }}
          >
            {slide.title}
          </AppText>
        </View>

        <AppText
          variant="body"
          color={colors.onPrimary}
          style={{
            textAlign: "center",
            marginTop: 12,
            lineHeight: 22,
            opacity: 0.94,
          }}
        >
          {slide.subtitle}
        </AppText>

        <View style={{ height: 26 }} />

        <View
          style={{ flexDirection: "row", gap: 8, justifyContent: "center" }}
        >
          {slides.map((s, i) => (
            <View
               
              key={s.key}
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: colors.onPrimary,
                opacity: i === index ? 1 : 0.35,
              }}
            />
          ))}
        </View>

        <View style={{ height: 28 }} />

        <View style={{ width: "100%" }}>
          <Button
            label={
              isLast ? (t("auth.welcome.getStarted") ?? "Sign Up") : "Next"
            }
            onPress={() => {
              if (!isLast) setIndex((v) => Math.min(v + 1, slides.length - 1));
              else handleContinue();
            }}
            variant="primary"
            fullWidth
          />
        </View>

        <View style={{ height: 14 }} />

        <Pressable onPress={handleGuest} hitSlop={10}>
          <AppText
            variant="bodyLarge"
            color={colors.onSurfaceVariant}
            style={{ textAlign: "center" }}
          >
            {t(
              "auth.welcome.continueWithoutSigningIn",
              "Continue without signing in",
            )}
          </AppText>
        </Pressable>
      </View>
    </PageContainer>
  );
}
