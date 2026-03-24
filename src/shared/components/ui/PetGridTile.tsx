import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Ellipsis } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type PetGridTileProps = {
  /** Pixel width of one column (from `getPetGridColumnWidth`). */
  width: number;
  imageUri: string;
  name: string;
  selected?: boolean;
  onPress?: () => void;
  onMenuPress?: () => void;
  menuButtonRef?: (ref: View | null) => void;
  /** When set, show a small “Seeking” marker on the image. */
  seekingDateRange?: string;
};

/**
 * One pet cell for the launch-request “Select pet” grid (3 columns).
 */
export function PetGridTile({
  width: tileWidth,
  imageUri,
  name,
  selected = false,
  onPress,
  onMenuPress,
  menuButtonRef,
  seekingDateRange,
}: PetGridTileProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showSeeking = seekingDateRange != null;
  const radius = Math.min(20, tileWidth * 0.2);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.tile, { width: tileWidth }]}
    >
      <View
        style={[
          styles.imageWrap,
          {
            width: tileWidth,
            height: tileWidth,
            borderRadius: radius,
            borderColor: selected ? colors.primary : "transparent",
          },
        ]}
      >
        <AppImage
          source={{ uri: imageUri }}
          style={styles.image}
          contentFit="cover"
        />
        {showSeeking && (
          <View
            style={[
              styles.seekingBadge,
              { backgroundColor: colors.tertiaryContainer },
            ]}
          >
            <AppText
              variant="caption"
              color={colors.onTertiaryContainer}
              style={styles.seekingBadgeText}
            >
              Seeking
            </AppText>
          </View>
        )}
        {onMenuPress && (
          <View
            ref={menuButtonRef}
            collapsable={false}
            style={styles.menuBtnWrap}
          >
            <TouchableOpacity
              onPress={onMenuPress}
              hitSlop={8}
              style={[
                styles.menuBtn,
                { backgroundColor: colors.surfaceBright },
              ]}
            >
              <Ellipsis size={18} color={colors.onSurface} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <AppText
        variant="caption"
        numberOfLines={2}
        style={[
          styles.name,
          { color: selected ? colors.primary : colors.onSurface },
        ]}
      >
        {name}
      </AppText>
    </TouchableOpacity>
  );
}

type PetGridAddTileProps = {
  width: number;
  onPress?: () => void;
  label: string;
};

export function PetGridAddTile({ width: tileWidth, onPress, label }: PetGridAddTileProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const radius = Math.min(20, tileWidth * 0.2);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.tile, { width: tileWidth }]}
    >
      <View
        style={[
          styles.addCircle,
          {
            width: tileWidth,
            height: tileWidth,
            borderRadius: radius,
            borderColor: colors.outlineVariant,
          },
        ]}
      >
        <AppText variant="title" color={colors.onSurfaceVariant}>
          +
        </AppText>
      </View>
      <AppText
        variant="caption"
        numberOfLines={2}
        style={[styles.name, { color: colors.primary }]}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  imageWrap: {
    borderWidth: 2,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  seekingBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  seekingBadgeText: {
    fontSize: 9,
    fontWeight: "600",
  },
  menuBtnWrap: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  menuBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    textAlign: "center",
    fontWeight: "500",
    width: "100%",
  },
  addCircle: {
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
});
