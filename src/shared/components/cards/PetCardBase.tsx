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
  /** When false, the ⋯ control is hidden (e.g. viewing someone else’s pets). */
  showMenu?: boolean;
};

/**
 * Shared visual “row” used by both profile pets and my-care liked pets.
 * It intentionally does not render the Apply/Remove overlay; that’s handled by wrappers.
 */
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
  const showSeeking = seekingDateRange != null;

  // Pills for yard type, age range, and energy level
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
  ].filter((v): v is string => !!v);

  // Use ellipses for menu, not custom dots
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
              <AppText variant="title" style={styles.petName}>
                {petName}
              </AppText>
              {showSeeking && (
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
              )}
            </View>
          </View>

          <View style={styles.breedRow}>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.breed}
            >
              {breed}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.breedDot}
            >
              {" "}
              ·{" "}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.breed}
            >
              {petType}
            </AppText>
          </View>

          {showSeeking && seekingDateRange && (
            <View style={styles.dateRow}>
              <Calendar size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" style={styles.metaText}>
                {seekingDateRange}
              </AppText>
              {seekingTime ? (
                <>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    {" "}
                    •{" "}
                  </AppText>
                  <Clock size={16} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" style={styles.metaText}>
                    {seekingTime}
                  </AppText>
                </>
              ) : null}
            </View>
          )}

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
                    {
                      backgroundColor: colors.surfaceContainerHigh,
                    },
                  ]}
                >
                  <AppText
                    variant="caption"
                    color={colors.onSecondaryContainer}
                    style={styles.pillText}
                  >
                    {pill}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          {tags.length > 0 && (
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
                  >
                    {tag}
                  </AppText>
                </View>
              ))}
            </View>
          )}
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
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  seekingMarker: {
    paddingHorizontal: 4,
    paddingVertical: 0,
    borderRadius: 12,
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
  menuEllipsis: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "900",
    letterSpacing: 1.5,
    includeFontPadding: false,
    textAlign: "center",
    marginTop: -2,
  },
  breedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  breed: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "500",
  },
  breedDot: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  pill: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 24,
    marginRight: 0,
    marginBottom: 0,
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
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 11,
    lineHeight: 13,
  },
});
