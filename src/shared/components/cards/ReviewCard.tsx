import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CaretakerInfo } from "@/src/shared/components/cards/CaretakerInfo";
import { Star } from "lucide-react-native";
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
  reviewerAvatarFallback?: number | null;
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
        <CaretakerInfo
          name={reviewerName}
          avatarUri={reviewerAvatar}
          rating={rating}
          reviewsCount={handshakes}
          petsCount={paws}
          onPress={onPress}
        />
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
});
