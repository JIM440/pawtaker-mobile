import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { CaretakerInfo } from "@/src/shared/components/cards/CaretakerInfo";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Calendar, Clock, Heart, MapPin } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

export type PetCardCaretaker = {
  name: string;
  avatarUri?: string | number | null;
  rating: number;
  reviewsCount: number;
  petsCount: number;
  id?: string;
};

export type PetCardProps = {
  imageSource: string | number | (string | number)[] | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  dateRange: string;
  time: string;
  careType: string;
  location: string;
  distance: string;
  description: string;
  caretaker: PetCardCaretaker;
  tags?: string[];
  isFavorite?: boolean;
  onFavorite?: () => void;
  onApply?: () => void;
  onCaretakerPress?: () => void;
  onPress?: () => void;
};

const CARD_RADIUS = 20;
const IMAGE_HEIGHT = 160;
const IMAGE_TOP_RADIUS = 16;
const IMAGE_BOTTOM_RADIUS = 4;

export function PetCard({
  imageSource,
  petName,
  breed,
  petType,
  dateRange,
  time,
  careType,
  location,
  distance,
  description,
  caretaker,
  tags = [],
  isFavorite = false,
  onFavorite,
  onApply,
  onCaretakerPress,
}: PetCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  const rawImages = Array.isArray(imageSource) ? imageSource : [imageSource];
  const images = rawImages.filter((img) => {
    if (img == null) return false;
    if (typeof img === "string") return img.trim().length > 0;
    return true;
  });
  const hasMultipleImages = images.length > 1;

  const onLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / containerWidth);
    if (index !== activeIndex && index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceBright }]}>
      <View style={styles.imageWrap} onLayout={onLayout}>
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.swiper}
        >
          {images.length === 0 ? (
            <View
              style={[styles.slide, { width: Math.max(containerWidth, 1) }]}
            >
              <View
                style={[
                  styles.image,
                  {
                    borderTopLeftRadius: IMAGE_TOP_RADIUS,
                    borderTopRightRadius: IMAGE_TOP_RADIUS,
                    borderBottomLeftRadius: IMAGE_BOTTOM_RADIUS,
                    borderBottomRightRadius: IMAGE_BOTTOM_RADIUS,
                    backgroundColor: colors.surfaceContainer,
                  },
                ]}
              />
            </View>
          ) : (
            images.map((img, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={onApply}
                disabled={!onApply}
                style={[styles.slide, { width: containerWidth }]}
              >
                <AppImage
                  source={typeof img === "string" ? { uri: img } : img}
                  style={[
                    styles.image,
                    {
                      borderTopLeftRadius: IMAGE_TOP_RADIUS,
                      borderTopRightRadius: IMAGE_TOP_RADIUS,
                      borderBottomLeftRadius: IMAGE_BOTTOM_RADIUS,
                      borderBottomRightRadius: IMAGE_BOTTOM_RADIUS,
                    },
                  ]}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {hasMultipleImages && (
          <View style={styles.dotsContainer}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      i === activeIndex ? "white" : "rgba(255,255,255,0.55)",
                  },
                ]}
              />
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity
        activeOpacity={0.9}
        // onPress={onPress}
        // disabled={!onPress}
        style={styles.body}
      >
        <View style={styles.titleRow}>
          <View style={styles.nameRow}>
            <AppText variant="headline" style={styles.petName}>
              {petName}
            </AppText>
            <View style={styles.breedRow}>
              <AppText variant="caption" style={styles.breed}>
                {breed}
              </AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {" "}
                •{" "}
              </AppText>
              <AppText variant="caption" style={styles.breed}>
                {petType}
              </AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onFavorite}
            style={[
              styles.favButton,
              { backgroundColor: colors.surfaceContainer },
            ]}
            hitSlop={8}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.primary : colors.onSurfaceVariant}
              fill={isFavorite ? colors.primary : "transparent"}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={16} color={colors.onSurfaceVariant} />
            <AppText variant="caption" style={styles.metaText}>
              {dateRange}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {" "}
            •{" "}
          </AppText>
          <View style={styles.metaItem}>
            <Clock size={16} color={colors.onSurfaceVariant} />
            <AppText variant="caption" style={styles.metaText}>
              {time}
            </AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {" "}
            •{" "}
          </AppText>
          <AppText variant="caption" style={styles.metaText}>
            {careType}
          </AppText>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={16} color={colors.onSurfaceVariant} />
          <AppText
            variant="caption"
            style={styles.locationText}
            numberOfLines={1}
          >
            {location}
          </AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {" "}
            •{" "}
          </AppText>
          <AppText variant="caption" style={styles.metaText}>
            {distance}
          </AppText>
        </View>

        {description.trim().length > 0 ? (
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            numberOfLines={3}
            style={styles.description}
          >
            {description}
          </AppText>
        ) : null}

        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag, index) => (
              <View
                key={index}
                style={[
                  styles.tagPill,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <AppText variant="caption" style={styles.tagText}>
                  {tag}
                </AppText>
              </View>
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <CaretakerInfo
            name={caretaker.name}
            avatarUri={caretaker.avatarUri}
            rating={caretaker.rating}
            reviewsCount={caretaker.reviewsCount}
            petsCount={caretaker.petsCount}
            onPress={onCaretakerPress}
          />
          <Button
            label={t("requestDetails.apply")}
            onPress={onApply}
            style={styles.applyBtn}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    padding: 4,
  },
  imageWrap: {
    height: IMAGE_HEIGHT,
    width: "100%",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
  },
  swiper: {
    flex: 1,
  },
  slide: {
    height: IMAGE_HEIGHT,
  },
  dotsContainer: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  petName: {
    fontSize: 22,
    letterSpacing: -0.1,
  },
  breedRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  breed: {
    fontSize: 11,
    lineHeight: 13,
  },
  favButton: {
    padding: 6,
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexWrap: "nowrap",
  },
  locationText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
  },
  description: {
    fontSize: 11,
    lineHeight: 13,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  applyBtn: {
    minWidth: 72,
    width: 100,
  },
  caretakerName: {
    fontSize: 16,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    flexGrow: 0,
    gap: 6,
    marginTop: 8,
  },
  tagPill: {
    flexGrow: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 99,
  },
  tagText: {
    fontSize: 10,
    fontWeight: "500",
  },
});
