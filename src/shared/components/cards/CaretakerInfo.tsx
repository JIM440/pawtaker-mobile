import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Handshake, PawPrint, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type CaretakerInfoProps = {
  name: string;
  avatarUri?: string | number | null;
  rating: number;
  reviewsCount: number;
  petsCount: number;
  onPress?: () => void;
};

export function CaretakerInfo({
  name,
  avatarUri,
  rating,
  reviewsCount,
  petsCount,
  onPress,
}: CaretakerInfoProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.caretakerChip,
        { backgroundColor: colors.surfaceContainer },
      ]}
    >
      {avatarUri != null ? (
        <AppImage
          source={
            typeof avatarUri === "string" ? { uri: avatarUri } : avatarUri
          }
          style={styles.avatar}
        />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: colors.surfaceVariant },
          ]}
        />
      )}
      <View style={styles.info}>
        <AppText
          variant="label"
          style={styles.name}
          color={colors.onSurfaceVariant}
          numberOfLines={1}
        >
          {name}
        </AppText>
        <View style={styles.statsRow}>
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.rating}>
            {rating.toFixed(1)}
          </AppText>
          <Star size={10} color={colors.tertiary} fill={colors.tertiary} />
          <View
            style={[
              styles.statPill,
              { backgroundColor: colors.surfaceBright },
            ]}
          >
            <Handshake size={12} color={colors.tertiary} />
            <AppText variant="caption" color={colors.onSurface} style={styles.rating}>
              {reviewsCount}
            </AppText>
          </View>
          <View
            style={[
              styles.statPill,
              { backgroundColor: colors.surfaceBright },
            ]}
          >
            <PawPrint size={12} color={colors.tertiary} />
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.rating}>
              {petsCount}
            </AppText>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  caretakerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
    maxWidth: 185,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  info: {
    flexShrink: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    lineHeight: 16
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    lineHeight: 14
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
