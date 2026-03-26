import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { ReviewCard } from "@/src/shared/components/cards/ReviewCard";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Star } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { FlatList, StyleSheet, View } from "react-native";

type Props = {
  rating: number;
  handshakes: number;
  paws: number;
  onReviewerPress?: (id: string) => void;
  items?: {
    id: string;
    reviewerId: string;
    name: string;
    avatar: string | null;
    rating: number;
    handshakes: number;
    paws: number;
    date: string;
    review: string;
  }[];
  emptyMessage?: string;
  /**
   * When true, this list can scroll itself (used on public profile without an outer ScrollView).
   * When false, scrolling is delegated to a parent ScrollView.
   */
  scrollEnabled?: boolean;
};

export function ProfileReviewsTab({
  rating,
  handshakes,
  paws,
  onReviewerPress,
  items = [],
  emptyMessage = "No reviews yet.",
  scrollEnabled = false,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const hasItems = items.length > 0;
  const displayRating = hasItems
    ? items.reduce((sum, i) => sum + (i.rating ?? 0), 0) / items.length
    : rating;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReviewCard
          rating={item.rating}
          text={item.review}
          reviewerName={item.name}
          reviewerAvatar={item.avatar ?? ""}
          handshakes={item.handshakes}
          paws={item.paws}
          dateLabel={item.date}
          onPress={
            onReviewerPress ? () => onReviewerPress(item.reviewerId) : undefined
          }
        />
      )}
      contentContainerStyle={styles.list}
      scrollEnabled={scrollEnabled}
      ListHeaderComponent={
        <View
          style={[
            styles.summaryCard,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.summaryTop}>
            <AppText variant="title" color={colors.onSurface} style={styles.scoreNum}>
              {hasItems ? displayRating.toFixed(1) : "—"}
            </AppText>
            <Star size={22} color={colors.tertiary} fill={colors.tertiary} />
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {hasItems
              ? t("profile.reviewsCount", "{{count}} reviews", {
                  count: items.length,
                })
              : emptyMessage}
          </AppText>
          {(handshakes > 0 || paws > 0) && (
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {`${handshakes} · ${paws}`}
            </AppText>
          )}
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  summaryTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreNum: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  list: {
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
