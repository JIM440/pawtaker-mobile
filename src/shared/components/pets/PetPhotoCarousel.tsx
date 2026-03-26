import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type PetPhotoCarouselProps = {
  urls: string[];
  height: number;
  /** Symmetric horizontal inset; image width = screen − 2×inset. */
  horizontalInset?: number;
  imageBorderRadius?: number;
  showCounterBadge?: boolean;
  showDots?: boolean;
  /**
   * `onImage`: white / translucent white dots for overlays on photos (detail screens).
   * `default`: theme-based dots for cards and light backgrounds.
   */
  dotsVariant?: "default" | "onImage";
  /** Top-right segment bar (tertiary fill) for multi-photo detail galleries. */
  showSegmentProgressBar?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PetPhotoCarousel({
  urls,
  height,
  horizontalInset = 0,
  imageBorderRadius = 0,
  showCounterBadge = true,
  showDots = true,
  dotsVariant = "default",
  showSegmentProgressBar = false,
  style,
}: PetPhotoCarouselProps) {
  const { width: screenW } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const data = useMemo(() => {
    const cleaned = urls
      .map((u) => (typeof u === "string" ? u.trim() : ""))
      .filter((u) => u.length > 0);
    return cleaned.length > 0 ? cleaned : [""];
  }, [urls]);

  const pageW = screenW;
  const imageW = Math.max(0, screenW - horizontalInset * 2);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [data.join("|")]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / pageW);
      if (i >= 0 && i < data.length) setActiveIndex(i);
    },
    [data.length, pageW],
  );

  const realCount = data.filter(Boolean).length;
  const count = Math.max(realCount, 1);

  return (
    <View style={[styles.wrap, { width: pageW }, style]}>
      <FlatList
        data={data}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        snapToInterval={pageW}
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        keyExtractor={(_, i) => `pet-photo-${i}`}
        renderItem={({ item }) => (
          <View style={[styles.page, { width: pageW }]}>
            {item ? (
              <AppImage
                source={{ uri: item }}
                style={{
                  width: imageW,
                  height,
                  borderRadius: imageBorderRadius,
                }}
                contentFit="cover"
              />
            ) : (
              <View
                style={{
                  width: imageW,
                  height,
                  borderRadius: imageBorderRadius,
                  backgroundColor: colors.surfaceContainerHighest,
                }}
              />
            )}
          </View>
        )}
        getItemLayout={(_, index) => ({
          length: pageW,
          offset: pageW * index,
          index,
        })}
      />
      {showCounterBadge && realCount > 0 ? (
        <View style={[styles.badge, { right: horizontalInset + 10 }]}>
          <View
            style={[
              styles.badgeInner,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <AppText variant="caption" color={colors.onSurface}>
              {activeIndex + 1}/{count}
            </AppText>
          </View>
        </View>
      ) : null}
      {showSegmentProgressBar && realCount > 1 ? (
        <View
          style={[
            styles.segmentTrack,
            {
              // Align with ~40px back control row (vertical center minus half track height).
              top: Math.max(insets.top, 8) + 17.5,
              right: horizontalInset + 16,
            },
          ]}
        >
          <View
            style={[
              styles.segmentFill,
              {
                width: `${((activeIndex + 1) / realCount) * 100}%`,
                backgroundColor: colors.tertiary,
              },
            ]}
          />
        </View>
      ) : null}
      {showDots && realCount > 1 ? (
        <View style={styles.dots}>
          {data.map((d, i) =>
            d ? (
              <View
                key={i}
                style={[
                  styles.dot,
                  dotsVariant === "onImage"
                    ? {
                        backgroundColor:
                          i === activeIndex
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.45)",
                      }
                    : {
                        backgroundColor: colors.surfaceContainerLowest,
                      },
                  dotsVariant === "default" &&
                    (i === activeIndex ? styles.dotActive : styles.dotInactive),
                ]}
              />
            ) : null,
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "relative",
  },
  page: {
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 18,
  },
  badgeInner: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dots: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: { opacity: 1 },
  dotInactive: { opacity: 0.6 },
  segmentTrack: {
    position: "absolute",
    width: 72,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  segmentFill: {
    height: "100%",
    borderRadius: 2.5,
  },
});
