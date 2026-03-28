import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Image,
  type ImageSourcePropType,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/src/constants/colors";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { ChevronRight } from "lucide-react-native";

const ONBOARDING_PAD_H = 16;

/** primary_logo.svg viewBox 388.09 × 97.73 */
const LOGO_W = 160;
const LOGO_H = 40;

const PRIMARY_LOGO = require("@/assets/icons/logos/svg/primary_logo.svg");
const PRIMARY_YELLOW_LOGO_PNG = require("@/assets/icons/logos/png/primary_yellow_variant.png");
const PRIMARY_LOGO_PNG = require("@/assets/icons/logos/png/primary_logo.png");

const ILLU_SLIDE_1 = require("@/assets/illustrations/onboarding gifs/screen1.gif");
const ILLU_SLIDE_2 = require("@/assets/illustrations/onboarding gifs/screen2.gif");
const ILLU_SLIDE_3 = require("@/assets/illustrations/onboarding gifs/screen3.gif");

type SlideVariant = "dark" | "light";

type Slide = {
  key: string;
  title: string;
  body: string;
  illustration: ImageSourcePropType;
  variant: SlideVariant;
};

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const resolvedTheme = useThemeStore().resolvedTheme;
  // Use resolved theme colors for this screen
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
        variant: "dark",
      },
      {
        key: "s2",
        title: t("auth.onboarding.slide2Title"),
        body: t("auth.onboarding.slide2Body"),
        illustration: ILLU_SLIDE_2,
        variant: "light",
      },
      {
        key: "s3",
        title: t("auth.onboarding.slide3Title"),
        body: t("auth.onboarding.slide3Body"),
        illustration: ILLU_SLIDE_3,
        variant: "light",
      },
    ],
    [t],
  );

  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;

  // Always use primary and onPrimary from *current theme* for first slide,
  // all other slides (and the whole onboarding screen background) always use theme colors
  const BG_PRIMARY = colors.primary;
  const ON_PRIMARY = colors.onPrimary;
  const BG_LIGHT = colors.background;
  const ON_SURFACE_VARIANT_LIGHT = colors.onSurfaceVariant;
  const PRIMARY = colors.primary;
  const DOT_INACTIVE = colors.primaryContainer;

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

  const goNext = () => {
    if (!isLast) {
      goToSlide(index + 1);
    } else {
      handleContinue();
    }
  };

  // Dot color logic - use only theme palette, follow per-instructions:
  // On first ("primary bg") slide: active = onPrimary, inactive = primaryContainer
  // On slide 2 & 3 (light bg): active = primary, inactive = primaryContainer
  const dotColors = useMemo(() => {
    if (index === 0) {
      // Primary bg screen
      return {
        active: ON_PRIMARY,
        inactive: DOT_INACTIVE,
      };
    }
    // All others (light bg)
    return {
      active: PRIMARY,
      inactive: DOT_INACTIVE,
    };
  }, [index, ON_PRIMARY, PRIMARY, DOT_INACTIVE]);

  const renderSlide: ListRenderItem<Slide> = useCallback(
    ({ item, index: slideIndex }) => {
      const isFirstSlide = slideIndex === 0;

      const bg = isFirstSlide ? BG_PRIMARY : BG_LIGHT;
      const titleColor = isFirstSlide ? ON_PRIMARY : ON_SURFACE_VARIANT_LIGHT;
      const bodyColor = isFirstSlide ? ON_PRIMARY : ON_SURFACE_VARIANT_LIGHT;
      // Keep the top logo lockup the same size across slides.
      const yellowLogoW = LOGO_W;
      const yellowLogoH = LOGO_H;
      const slideSkipColor = isFirstSlide
        ? ON_PRIMARY
        : ON_SURFACE_VARIANT_LIGHT;
      const isSlideLast = slideIndex === slides.length - 1;

      return (
        <View style={[{ width: pageWidth, flex: 1, backgroundColor: bg }]}>
          <View style={styles.slideRoot}>
            <View
              style={[styles.topBar, { paddingHorizontal: ONBOARDING_PAD_H }]}
            >
              {isSlideLast ? null : (
                <Pressable
                  onPress={handleContinue}
                  hitSlop={12}
                  style={({ pressed }) => [
                    styles.skipTopPressable,
                    pressed && { opacity: 0.65 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.skip")}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <AppText
                      style={[styles.skipTopLabel, { color: slideSkipColor }]}
                    >
                      {t("common.skip")}
                    </AppText>
                    <ChevronRight size={16} color={slideSkipColor} />
                  </View>
                </Pressable>
              )}
            </View>

            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              bounces
              contentContainerStyle={styles.slideScrollContent}
            >
              <View style={{ paddingHorizontal: ONBOARDING_PAD_H }}>
                <View style={styles.logoBlock}>
                  {isFirstSlide ? (
                    <Image
                      source={PRIMARY_YELLOW_LOGO_PNG}
                      accessibilityIgnoresInvertColors
                      accessibilityRole="image"
                      accessibilityLabel="pawtaker"
                      style={{
                        width: yellowLogoW,
                        height: yellowLogoH,
                      }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Image
                      source={PRIMARY_LOGO_PNG}
                      accessibilityRole="image"
                      accessibilityLabel="pawtaker"
                      style={{
                        width: LOGO_W,
                        height: LOGO_H,
                      }}
                      resizeMode="contain"
                    />
                  )}
                </View>

                <View style={styles.illuWrap}>
                  <Image
                    source={item.illustration}
                    style={{ width: illuWidth, height: illuHeight }}
                    resizeMode="contain"
                    accessibilityIgnoresInvertColors
                    accessibilityRole="image"
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
                            backgroundColor: active
                              ? dotColors.active
                              : dotColors.inactive,
                          },
                        ]}
                        accessibilityState={{ selected: active }}
                      />
                    );
                  })}
                </View>

                <AppText
                  style={[styles.title, { color: titleColor }]}
                  numberOfLines={4}
                >
                  {item.title}
                </AppText>

                <AppText
                  style={[styles.body, { color: bodyColor }]}
                  numberOfLines={12}
                >
                  {item.body}
                </AppText>
              </View>
            </ScrollView>

            <View
              style={[
                styles.bottomBlock,
                { paddingHorizontal: ONBOARDING_PAD_H },
                slideIndex === 0 ? styles.bottomFirst : styles.bottomRest,
              ]}
            >
              {slideIndex > 0 ? (
                <Button
                  label={t("common.back")}
                  onPress={() => goToSlide(slideIndex - 1)}
                  variant="outline"
                  style={[
                    styles.backButton,
                    {
                      borderColor: "transparent",
                    },
                  ]}
                  color={colors.onSurface}
                />
              ) : (
                <View style={styles.skipSpacer} />
              )}

              {slideIndex === 0 ? (
                <Pressable
                  onPress={goNext}
                  hitSlop={16}
                  style={({ pressed }) => [
                    styles.nextTextOnly,
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t("common.next")}
                >
                  <AppText
                    style={[styles.nextTextOnlyLabel, { color: ON_PRIMARY }]}
                  >
                    {t("common.next")}
                  </AppText>
                </Pressable>
              ) : (
                <Button
                  label={
                    isSlideLast
                      ? (t("auth.onboarding.getStarted") ?? "Get started")
                      : t("common.next")
                  }
                  onPress={() =>
                    isSlideLast ? handleContinue() : goToSlide(slideIndex + 1)
                  }
                  variant="primary"
                  style={[
                    styles.nextPill,
                    {
                      backgroundColor: colors.primary,
                    },
                  ]}
                  color={colors.onPrimary}
                />
              )}
            </View>
          </View>
        </View>
      );
    },
    [
      BG_LIGHT,
      BG_PRIMARY,
      DOT_INACTIVE,
      ON_PRIMARY,
      ON_SURFACE_VARIANT_LIGHT,
      dotColors.active,
      dotColors.inactive,
      goNext,
      goToSlide,
      handleContinue,
      illuHeight,
      illuWidth,
      index,
      pageWidth,
      PRIMARY,
      PRIMARY_LOGO_PNG,
      PRIMARY_YELLOW_LOGO_PNG,
      slides,
      t,
      colors.onSurface,
      colors.primary,
      colors.onPrimary,
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

  // Always set onboarding bg to theme color, special casing for first slide
  const screenBg = index === 0 ? BG_PRIMARY : BG_LIGHT;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: screenBg }]}
      edges={["top", "bottom"]}
    >
      <PageContainer
        contentStyle={{
          flex: 1,
          paddingTop: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
          backgroundColor: screenBg,
        }}
      >
        <StatusBar
          barStyle={
            index === 0
              ? "light-content"
              : resolvedTheme === "dark"
                ? "light-content"
                : "dark-content"
          }
          backgroundColor={screenBg}
        />
        <View style={styles.root}>
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
            extraData={{ slides, index, dotColors }}
            style={styles.pager}
            scrollEventThrottle={16}
          />
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
  slideRoot: {
    flex: 1,
  },
  topBar: {
    width: "100%",
    minHeight: 36,
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: 4,
  },
  skipTopPressable: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: "row",
    gap: 4,
  },
  skipTopLabel: {
    fontFamily: "Roboto_500Medium",
    fontSize: 14,
    fontWeight: "500",
  },
  pager: {
    flex: 1,
    minHeight: 0,
  },
  slideScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
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
    alignItems: "center",
    gap: 12,
  },
  bottomFirst: {
    justifyContent: "flex-end",
  },
  bottomRest: {
    justifyContent: "space-between",
    gap: 12,
  },
  skipSpacer: {
    width: 0,
  },
  backButton: {
    flex: 1,
    width: "100%",
    marginRight: 12,
  },
  nextTextOnly: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  nextTextOnlyLabel: {
    fontFamily: "Roboto_500Medium",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    width: 120,
  },
  nextPill: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    width: "100%",
  },
});
