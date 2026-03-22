import { useRouter } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocalSvg } from "react-native-svg/css";

import { Colors } from "@/src/constants/colors";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";

const ONBOARDING_PAD_H = 16;

/** primary_logo.svg viewBox 388.09 × 97.73 */
const LOGO_W = 180;
const LOGO_H = Math.round((LOGO_W * 97.73) / 388.09);

const PRIMARY_LOGO = require("@/assets/icons/logos/svg/primary_logo.svg");

const ILLU_SLIDE_1 = require("@/assets/illustrations/onboarding/onboarding_img_1.svg");
const ILLU_SLIDE_2 = require("@/assets/illustrations/onboarding/onboarding_placeholder.svg");
const ILLU_SLIDE_3 = require("@/assets/illustrations/onboarding/onboarding_placeholder.svg");

type Slide = {
  key: string;
  title: string;
  body: string;
  illustration: number;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { setOnboardingSeen } = useAuthStore();
  const flatListRef = useRef<FlatList<Slide>>(null);

  const slides: Slide[] = useMemo(
    () => [
      {
        key: "s1",
        title: t("auth.onboarding.slide1Title"),
        body: t("auth.onboarding.slide1Body"),
        illustration: ILLU_SLIDE_1,
      },
      {
        key: "s2",
        title: t("auth.onboarding.slide2Title"),
        body: t("auth.onboarding.slide2Body"),
        illustration: ILLU_SLIDE_2,
      },
      {
        key: "s3",
        title: t("auth.onboarding.slide3Title"),
        body: t("auth.onboarding.slide3Body"),
        illustration: ILLU_SLIDE_3,
      },
    ],
    [t],
  );

  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  const primary = colors.primary;
  const onSurfaceVariant = colors.onSurfaceVariant;
  const onSurface = colors.onSurface;
  const dotInactive = colors.primaryContainer;

  const illuWidth = Math.min(windowWidth - ONBOARDING_PAD_H * 2, 340);
  const illuHeight = 330;

  const pageWidth = windowWidth;

  const handleContinue = () => {
    setOnboardingSeen(true);
    router.replace("/(auth)/welcome");
  };

  const goToSlide = useCallback(
    (i: number) => {
      const clamped = Math.max(0, Math.min(i, slides.length - 1));
      flatListRef.current?.scrollToOffset({
        offset: clamped * pageWidth,
        animated: true,
      });
      setIndex(clamped);
    },
    [pageWidth, slides.length],
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const i = Math.round(offsetX / pageWidth);
      if (i >= 0 && i < slides.length) {
        setIndex(i);
      }
    },
    [pageWidth, slides.length],
  );

  const goBack = () => {
    goToSlide(index - 1);
  };

  const goNext = () => {
    if (!isLast) {
      goToSlide(index + 1);
    } else {
      handleContinue();
    }
  };

  const renderSlide: ListRenderItem<Slide> = useCallback(
    ({ item }) => (
      <View style={[{ width: pageWidth }]}>
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
          contentContainerStyle={styles.slideScrollContent}
        >
          <View style={{ paddingHorizontal: ONBOARDING_PAD_H }}>
            <View style={styles.logoBlock}>
              <LocalSvg asset={PRIMARY_LOGO} width={LOGO_W} height={LOGO_H} />
            </View>

            <View style={styles.illuWrap}>
              <LocalSvg
                asset={item.illustration}
                width={illuWidth}
                height={illuHeight}
              />
            </View>

            <View style={styles.dotsRow} accessibilityRole="tablist">
              {slides.map((s, i) => {
                const active = i === index;
                return (
                  <View
                    key={s.key}
                    style={[
                      active ? styles.dotActive : styles.dotIdle,
                      {
                        backgroundColor: active ? primary : dotInactive,
                      },
                    ]}
                    accessibilityState={{ selected: active }}
                  />
                );
              })}
            </View>

            <AppText
              style={[styles.title, { color: onSurfaceVariant }]}
              numberOfLines={4}
            >
              {item.title}
            </AppText>

            <AppText
              style={[styles.body, { color: onSurface }]}
              numberOfLines={12}
            >
              {item.body}
            </AppText>
          </View>
        </ScrollView>
      </View>
    ),
    [
      dotInactive,
      illuHeight,
      illuWidth,
      index,
      onSurface,
      onSurfaceVariant,
      pageWidth,
      primary,
      slides,
    ],
  );

  const getItemLayout = useCallback(
    (_: unknown, i: number) => ({
      length: pageWidth,
      offset: pageWidth * i,
      index: i,
    }),
    [pageWidth],
  );

  const keyExtractor = useCallback((item: Slide) => item.key, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background }]}
      edges={["top", "bottom"]}
    >
      <PageContainer
        contentStyle={{
          flex: 1,
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          backgroundColor: colors.background,
        }}
      >
        <View style={styles.root}>
          {/* Skip — top right + chevron (mauve) */}
          <View
            style={[styles.topBar, { paddingHorizontal: ONBOARDING_PAD_H }]}
          >
            <Pressable
              onPress={handleContinue}
              hitSlop={12}
              style={({ pressed }) => [
                styles.skipPressable,
                pressed && { opacity: 0.65 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t("common.skip")}
            >
              <View style={styles.skipLabelContainer}>
                <AppText
                  variant="caption"
                  style={[styles.skipLabel, { color: primary }]}
                >
                  {t("common.skip")}
                </AppText>
                <ChevronRight size={14} color={primary} strokeWidth={2.5} />
              </View>
            </Pressable>
          </View>

          <FlatList
            ref={flatListRef}
            data={slides}
            keyExtractor={keyExtractor}
            renderItem={renderSlide}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={getItemLayout}
            extraData={{ slides, index }}
            style={styles.pager}
            scrollEventThrottle={16}
          />

          {/* Bottom: Back + primary CTA */}
          <View
            style={[
              styles.bottomBlock,
              { paddingHorizontal: ONBOARDING_PAD_H },
            ]}
          >
            {index > 0 ? (
              <Button
                label={t("common.back")}
                onPress={goBack}
                variant="ghost"
                style={{ width: "100%", flex: 1 }}
              />
            ) : null}

            <Button
              label={
                isLast
                  ? (t("auth.welcome.getStarted") ?? "Sign Up")
                  : t("common.next")
              }
              onPress={goNext}
              variant="primary"
              style={{ width: "100%", flex: 1 }}
            />
          </View>
        </View>
      </PageContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
    width: "100%",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    width: "100%",
    minHeight: 36,
    marginBottom: 4,
  },
  skipPressable: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingLeft: 10,
  },
  skipLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  skipLabel: {
    fontFamily: "Roboto_500Medium",
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.15,
    lineHeight: 16,
  },
  pager: {
    flex: 1,
    minHeight: 0,
  },
  slideScrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 16,
  },
  logoBlock: {
    alignItems: "center",
    marginBottom: 20,
  },
  illuWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    minHeight: 320,
  },
  title: {
    textAlign: "center",
    fontFamily: "Roboto_700Bold",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30,
    letterSpacing: -0.35,
    marginTop: 4,
    paddingHorizontal: 4,
    maxWidth: 360,
    alignSelf: "center",
  },
  body: {
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 4,
    maxWidth: 360,
    alignSelf: "center",
    fontFamily: "Roboto_400Regular",
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: 0.15,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    marginBottom: 20,
  },
  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 6,
  },
  dotIdle: {
    width: 10,
    height: 10,
    borderRadius: 6,
  },
  bottomBlock: {
    width: "100%",
    paddingVertical: 24,
    flexDirection: "row",
    gap: 12,
  },
});
