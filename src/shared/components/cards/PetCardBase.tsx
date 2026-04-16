import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Calendar, Clock, MoreHorizontal } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type PetCardBaseProps = {
  imageSource: string | number | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  bio: string;
  yardType?: string | null;
  ageRange?: string | null;
  energyLevel?: string | null;
  tags?: string[];
  seekingDateRange?: string;
  seekingTime?: string;
  onPress?: () => void;
  onMenuPress?: () => void;
  menuButtonRef?: (ref: View | null) => void;
  showMenu?: boolean;
};

export function PetCardBase({
  imageSource,
  petName,
  breed,
  petType,
  bio,
  yardType,
  ageRange,
  energyLevel,
  tags = [],
  seekingDateRange,
  seekingTime,
  onPress,
  onMenuPress,
  menuButtonRef,
  showMenu = true,
}: PetCardBaseProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showSeeking = Boolean(seekingDateRange);

  const pills = [
    typeof yardType === "string" && yardType.trim().length > 0
      ? yardType.trim()
      : null,
    typeof ageRange === "string" && ageRange.trim().length > 0
      ? ageRange.trim()
      : null,
    typeof energyLevel === "string" && energyLevel.trim().length > 0
      ? energyLevel.trim()
      : null,
  ].filter((value): value is string => Boolean(value));

  const menuDots = <MoreHorizontal size={20} color={colors.onSurfaceVariant} />;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceBright }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        disabled={!onPress}
        style={styles.cardPressable}
      >
        <AppImage
          source={
            typeof imageSource === "string" ? { uri: imageSource } : imageSource
          }
          style={[
            styles.image,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.nameRow}>
              <AppText variant="title" style={styles.petName} numberOfLines={1}>
                {petName}
              </AppText>
              {showSeeking ? (
                <View
                  style={[
                    styles.seekingMarker,
                    { backgroundColor: colors.tertiaryContainer },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={colors.onTertiaryContainer}
                    style={styles.seekingMarkerText}
                  >
                    Seeking
                  </AppText>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.breedRow}>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.breed}
              numberOfLines={1}
            >
              {breed}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.breedDot}
            >
              ·
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.breed}
              numberOfLines={1}
            >
              {petType}
            </AppText>
          </View>

          {showSeeking ? (
            <View style={styles.dateRow}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" style={styles.metaText}>
                  {seekingDateRange}
                </AppText>
              </View>
              {seekingTime ? (
                <View style={styles.metaItem}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    ·
                  </AppText>
                  <Clock size={16} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" style={styles.metaText}>
                    {seekingTime}
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : null}

          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            numberOfLines={3}
            style={styles.bio}
          >
            {bio}
          </AppText>

          {pills.length > 0 ? (
            <View style={styles.pillsRow}>
              {pills.map((pill) => (
                <View
                  key={pill}
                  style={[
                    styles.pill,
                    { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={colors.onSecondaryContainer}
                    style={styles.pillText}
                    numberOfLines={1}
                  >
                    {pill}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {tags.length > 0 ? (
            <View style={styles.tags}>
              {tags.map((tag, index) => (
                <View
                  key={`${tag}-${index}`}
                  style={[
                    styles.tag,
                    {
                      backgroundColor:
                        index === 0
                          ? colors.surfaceContainerHighest
                          : colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <AppText
                    variant="body"
                    color={colors.onSecondaryContainer}
                    style={styles.tagText}
                    numberOfLines={1}
                  >
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      {showMenu ? (
        onMenuPress ? (
          <TouchableOpacity
            onPress={onMenuPress}
            hitSlop={8}
            style={styles.menuBtn}
            ref={menuButtonRef}
          >
            {menuDots}
          </TouchableOpacity>
        ) : (
          <View style={styles.menuBtn} pointerEvents="none" ref={menuButtonRef}>
            {menuDots}
          </View>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    borderRadius: 16,
    gap: 8,
  },
  cardPressable: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    minWidth: 0,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  petName: {
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  seekingMarker: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 12,
    flexShrink: 0,
  },
  seekingMarkerText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "500",
  },
  menuBtn: {
    minHeight: 20,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginTop: 1,
  },
  breedRow: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    gap: 4,
  },
  breed: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "500",
    flexShrink: 1,
  },
  breedDot: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "500",
    flexShrink: 0,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    flexShrink: 1,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    minWidth: 0,
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
    maxWidth: "100%",
  },
  pillText: {
    fontSize: 11,
    lineHeight: 13,
  },
  bio: {
    marginTop: 2,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
    maxWidth: "100%",
  },
  tagText: {
    fontSize: 12,
    lineHeight: 16,
  },
});
