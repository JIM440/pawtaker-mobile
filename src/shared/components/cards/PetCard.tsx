import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { CaretakerInfo } from "@/src/shared/components/cards/CaretakerInfo";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Calendar, Clock, Heart, MapPin } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type PetCardCaretaker = {
  name: string;
  avatarUri?: string | number | null;
  rating: number;
  reviewsCount: number;
  petsCount: number;
  id?: string;
};

export type PetCardProps = {
  imageSource: string | number | { uri: string };
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
  isFavorite?: boolean;
  onFavorite?: () => void;
  onApply?: () => void;
  onCaretakerPress?: () => void;
};

const CARD_RADIUS = 20;
const IMAGE_HEIGHT = 160;
const IMAGE_TOP_RADIUS = 16;

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
  isFavorite = false,
  onFavorite,
  onApply,
  onCaretakerPress,
}: PetCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onApply} disabled={!onApply}>
      <View style={[styles.card, { backgroundColor: colors.surfaceBright }]}>
        <View style={styles.imageWrap}>
          <AppImage
            source={
              typeof imageSource === "string"
                ? { uri: imageSource }
                : imageSource
            }
            style={[
              styles.image,
              {
                borderTopLeftRadius: IMAGE_TOP_RADIUS,
                borderTopRightRadius: IMAGE_TOP_RADIUS,
              },
            ]}
            contentFit="cover"
          />
        </View>

        <View style={styles.body}>
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
              <Calendar size={16} color={colors.onSurface} />
              <AppText variant="caption" style={styles.metaText}>
                {dateRange}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {" "}
              •{" "}
            </AppText>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.onSurface} />
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
            <MapPin size={16} color={colors.onSurface} />
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

          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            numberOfLines={3}
            style={styles.description}
          >
            {description}
          </AppText>

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
              label="Apply"
              onPress={onApply}
              style={styles.applyBtn}
              fullWidth={false}
              size="sm"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
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
    gap: 10,
    marginTop: 8,
  },
  applyBtn: {
    minWidth: 72,
  },
  caretakerName: {
    fontSize: 16,
  },
});
