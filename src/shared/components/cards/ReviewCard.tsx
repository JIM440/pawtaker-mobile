import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Handshake, PawPrint, Star } from "lucide-react-native";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

type ReviewCardProps = {
  rating: number;
  maxRating?: number;
  text: string;
  reviewerName: string;
  reviewerAvatar: string;
  handshakes: number;
  paws: number;
  dateLabel: string;
  onPress?: () => void;
};

export function ReviewCard({
  rating,
  maxRating = 5,
  text,
  reviewerName,
  reviewerAvatar,
  handshakes,
  paws,
  dateLabel,
  onPress,
}: ReviewCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const filledCount = Math.round(rating);

  const content = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surfaceBright,
        },
      ]}
    >
      <View style={styles.starsRow}>
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            size={10}
            color={i < filledCount ? colors.primary : colors.outlineVariant}
            fill={i < filledCount ? colors.primary : "transparent"}
          />
        ))}
      </View>

      <AppText
        variant="body"
        color={colors.onSurfaceVariant}
        style={styles.body}
      >
        {text}
      </AppText>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={onPress}
          style={{
            ...styles.reviewerChip,
            backgroundColor: colors.surfaceContainer,
          }}
        >
          <AppImage
            source={{ uri: reviewerAvatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.reviewerInfo}>
            <AppText variant="label" style={styles.reviewerName}>
              {reviewerName}
            </AppText>
            <View style={styles.reviewerStatsRow}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {rating.toFixed(1)}
              </AppText>
              <Star size={10} color={colors.tertiary} fill={colors.tertiary} />
              <View style={[styles.reviewerStatPill]}>
                <Handshake size={12} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurface}>
                  {handshakes}
                </AppText>
              </View>
              <View style={[styles.reviewerStatPill]}>
                <PawPrint size={12} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurface}>
                  {paws}
                </AppText>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <AppText variant="caption" color={colors.onSurfaceVariant}>
          {dateLabel}
        </AppText>
      </View>
    </View>
  );

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  starsRow: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 4,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  reviewerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
    borderRadius: 999,
    padding: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  reviewerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  reviewerName: {
    fontSize: 16,
  },
  reviewerStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewerStatPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
