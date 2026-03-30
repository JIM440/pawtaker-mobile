import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { ChevronRight } from "lucide-react-native";
import React from "react";
import { Image, Pressable, ScrollView, View } from "react-native";

type Slide = {
  key: string;
  title: string;
  body: string;
  illustration: any;
};

type Props = {
  item: Slide;
  slideIndex: number;
  slides: Slide[];
  index: number;
  pageWidth: number;
  colors: Record<string, string>;
  dotColors: { active: string; inactive: string };
  isFirstSlide: boolean;
  onContinue: () => void;
  onNext: () => void;
  onGoToSlide: (i: number) => void;
  t: (key: string, fallback?: string) => string;
  ONBOARDING_PAD_H: number;
  LOGO_W: number;
  LOGO_H: number;
  illuWidth: number;
  illuHeight: number;
  PRIMARY_LOGO_PNG: any;
  PRIMARY_YELLOW_LOGO_PNG: any;
  styles: any;
};

export function OnboardingSlide(props: Props) {
  const {
    item,
    slideIndex,
    slides,
    index,
    pageWidth,
    colors,
    dotColors,
    isFirstSlide,
    onContinue,
    onNext,
    onGoToSlide,
    t,
    ONBOARDING_PAD_H,
    LOGO_W,
    LOGO_H,
    illuWidth,
    illuHeight,
    PRIMARY_LOGO_PNG,
    PRIMARY_YELLOW_LOGO_PNG,
    styles,
  } = props;

  const bg = isFirstSlide ? colors.primary : colors.background;
  const titleColor = isFirstSlide ? colors.onPrimary : colors.onSurfaceVariant;
  const bodyColor = isFirstSlide ? colors.onPrimary : colors.onSurfaceVariant;
  const slideSkipColor = isFirstSlide ? colors.onPrimary : colors.onSurfaceVariant;
  const isSlideLast = slideIndex === slides.length - 1;

  return (
    <View style={[{ width: pageWidth, flex: 1, backgroundColor: bg }]}>
      <View style={styles.slideRoot}>
        <View style={[styles.topBar, { paddingHorizontal: ONBOARDING_PAD_H }]}>
          {isSlideLast ? null : (
            <Pressable
              onPress={onContinue}
              hitSlop={12}
              style={({ pressed }) => [styles.skipTopPressable, pressed && { opacity: 0.65 }]}
              accessibilityRole="button"
              accessibilityLabel={t("common.skip")}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <AppText style={[styles.skipTopLabel, { color: slideSkipColor }]}>
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
                  style={{ width: LOGO_W, height: LOGO_H }}
                  resizeMode="contain"
                />
              ) : (
                <Image
                  source={PRIMARY_LOGO_PNG}
                  accessibilityRole="image"
                  accessibilityLabel="pawtaker"
                  style={{ width: LOGO_W, height: LOGO_H }}
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
                      { backgroundColor: active ? dotColors.active : dotColors.inactive },
                    ]}
                    accessibilityState={{ selected: active }}
                  />
                );
              })}
            </View>

            <AppText style={[styles.title, { color: titleColor }]} numberOfLines={4}>
              {item.title}
            </AppText>
            <AppText style={[styles.body, { color: bodyColor }]} numberOfLines={12}>
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
              onPress={() => onGoToSlide(slideIndex - 1)}
              variant="outline"
              style={[styles.backButton, { borderColor: "transparent" }]}
              color={colors.onSurface}
            />
          ) : (
            <View style={styles.skipSpacer} />
          )}

          {slideIndex === 0 ? (
            <Pressable
              onPress={onNext}
              hitSlop={16}
              style={({ pressed }) => [styles.nextTextOnly, pressed && { opacity: 0.7 }]}
              accessibilityRole="button"
              accessibilityLabel={t("common.next")}
            >
              <AppText style={[styles.nextTextOnlyLabel, { color: colors.onPrimary }]}>
                {t("common.next")}
              </AppText>
            </Pressable>
          ) : (
            <Button
              label={isSlideLast ? (t("auth.onboarding.getStarted") ?? "Get started") : t("common.next")}
              onPress={() => (isSlideLast ? onContinue() : onGoToSlide(slideIndex + 1))}
              variant="primary"
              style={[styles.nextPill, { backgroundColor: colors.primary }]}
              color={colors.onPrimary}
            />
          )}
        </View>
      </View>
    </View>
  );
}
