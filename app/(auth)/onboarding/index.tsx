import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  type ImageSourcePropType,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/src/constants/colors";
import { OnboardingSlide } from "@/src/features/auth/components/OnboardingSlide";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout/PageContainer";

const ONBOARDING_PAD_H = 16;

/** primary_logo.svg viewBox 388.09 × 97.73 */
const LOGO_W = 160;
const LOGO_H = 40;

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

  // Always use primary and onPrimary from current theme for first slide.
  const BG_PRIMARY = colors.primary;
  const BG_LIGHT = colors.background;
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
      return {
        active: colors.onPrimary,
        inactive: DOT_INACTIVE,
      };
    }
    return {
      active: colors.primary,
      inactive: DOT_INACTIVE,
    };
  }, [DOT_INACTIVE, colors.onPrimary, colors.primary, index]);

  const renderSlide: ListRenderItem<Slide> = useCallback(
    ({ item, index: slideIndex }) => {
      return (
        <OnboardingSlide
          item={item}
          slideIndex={slideIndex}
          slides={slides}
          index={index}
          pageWidth={pageWidth}
          colors={colors}
          dotColors={dotColors}
          isFirstSlide={slideIndex === 0}
          onContinue={handleContinue}
          onNext={goNext}
          onGoToSlide={goToSlide}
          t={(key, fallback) => t(key, fallback as string)}
          ONBOARDING_PAD_H={ONBOARDING_PAD_H}
          LOGO_W={LOGO_W}
          LOGO_H={LOGO_H}
          illuWidth={illuWidth}
          illuHeight={illuHeight}
          PRIMARY_LOGO_PNG={PRIMARY_LOGO_PNG}
          PRIMARY_YELLOW_LOGO_PNG={PRIMARY_YELLOW_LOGO_PNG}
          styles={styles}
        />
      );
    },
    [
      BG_LIGHT,
      BG_PRIMARY,
      dotColors,
      goNext,
      goToSlide,
      handleContinue,
      illuHeight,
      illuWidth,
      index,
      pageWidth,
      PRIMARY_LOGO_PNG,
      PRIMARY_YELLOW_LOGO_PNG,
      slides,
      t,
      colors,
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
