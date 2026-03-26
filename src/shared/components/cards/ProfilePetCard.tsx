import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Calendar, Clock } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type ProfilePetCardProps = {
  imageSource: string | number | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  bio: string;
  tags?: string[];
  /** When set, show "Seeking" marker and date/time row */
  seekingDateRange?: string;
  seekingTime?: string;
  onPress?: () => void;
  onMenuPress?: () => void;
  menuButtonRef?: (ref: View | null) => void;
};

export function ProfilePetCard({
  imageSource,
  petName,
  breed,
  petType,
  bio,
  tags = [],
  seekingDateRange,
  seekingTime,
  onPress,
  onMenuPress,
  menuButtonRef,
}: ProfilePetCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showSeeking = seekingDateRange != null;

  const menuDots = (
    <View style={styles.menuDots}>
      <View style={[styles.menuDot, { backgroundColor: colors.onSurface }]} />
      <View style={[styles.menuDot, { backgroundColor: colors.onSurface }]} />
      <View style={[styles.menuDot, { backgroundColor: colors.onSurface }]} />
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceContainerHigh }]}
    >
      <AppImage
        source={
          typeof imageSource === "string" ? { uri: imageSource } : imageSource
        }
        style={[styles.image, { backgroundColor: colors.surfaceContainerHighest }]}
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
                <AppText variant="caption" color={colors.onTertiaryContainer}>
                  Seeking
                </AppText>
              </View>
            )}
          </View>

          {onMenuPress ? (
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
          )}
        </View>

        <View style={styles.breedRow}>
          <AppText variant="caption" color={colors.onSurface} style={styles.breed}>
            {breed}
          </AppText>
          <AppText variant="caption" color={colors.onSurface} style={styles.breedDot}>
            {" "}
            ·{" "}
          </AppText>
          <AppText variant="caption" color={colors.onSurface} style={styles.breed}>
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
          numberOfLines={2}
          style={styles.bio}
        >
          {bio}
        </AppText>

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag, index) => (
              <View
                key={tag}
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
                  variant="caption"
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
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 16,
    gap: 12,
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
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuBtn: {
    minHeight: 20,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: 2,
    paddingVertical: 2,
    marginTop: 1,
  },
  menuDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  menuDot: {
    width: 3,
    height: 3,
    borderRadius: 999,
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
  bio: {
    fontSize: 12,
    lineHeight: 16,
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
