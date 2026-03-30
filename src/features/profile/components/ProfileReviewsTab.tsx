import { ReviewCard } from "@/src/shared/components/cards/ReviewCard";
import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
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
  onReviewerPress,
  items = [],
  scrollEnabled = false,
}: Props) {
  const { t } = useTranslation();

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
          reviewerAvatar={item.avatar ?? ""}
          handshakes={item.handshakes}
          paws={item.paws}
          dateLabel={item.date}
          onPress={
            onReviewerPress ? () => onReviewerPress(item.reviewerId) : undefined
          }
        />
      )}
      contentContainerStyle={[styles.list, !hasItems && styles.listEmpty]}
      scrollEnabled={scrollEnabled}
      ListEmptyComponent={
        <View style={styles.emptyWrap}>
          <IllustratedEmptyState
            title={t("profile.reviewsTab.emptyTitle")}
            message={t("profile.reviewsTab.emptyMessage")}
            illustration={IllustratedEmptyStateIllustrations.noReview}
            mode="inline"
          />
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  listEmpty: {
    justifyContent: "center",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
  },
});
