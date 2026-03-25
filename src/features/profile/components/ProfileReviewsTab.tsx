import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { ReviewCard } from "@/src/shared/components/cards/ReviewCard";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
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
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const hasItems = items.length > 0;

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReviewCard
          rating={item.rating}
          text={item.review}
          reviewerName={item.name}
          reviewerAvatar={item.avatar ?? undefined}
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
        <>
          <View style={styles.headerRow}>
            <View style={styles.score}>
              <View style={styles.scoreMeta}>
                <AppText variant="caption" color={colors.onSurface}>
                  {hasItems ? `${items.length} reviews` : emptyMessage}
                </AppText>
              </View>
            </View>
          </View>
        </>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  score: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scoreValue: {
    fontSize: 24,
  },
  scoreMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stats: {
    alignItems: "flex-end",
    gap: 2,
  },
  list: {
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
