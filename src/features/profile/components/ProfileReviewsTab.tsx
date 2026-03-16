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
  scrollEnabled = false,
}: Props) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const items = [
    {
      id: "1",
      name: "Alice Morgan",
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
      rating: 4.1,
      handshakes: 12,
      paws: 17,
      date: "12 Mar 26’",
    },
    {
      id: "2",
      name: "Bob Majors",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200",
      rating: 4.3,
      handshakes: 8,
      paws: 9,
      date: "03 Feb 26’",
    },
    {
      id: "3",
      name: "Clara Hudson",
      avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=200",
      rating: 4.8,
      handshakes: 20,
      paws: 24,
      date: "18 Jan 26’",
    },
    {
      id: "4",
      name: "James Lim",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200",
      rating: 4.0,
      handshakes: 6,
      paws: 10,
      date: "05 Dec 25’",
    },
    {
      id: "5",
      name: "Mia Carter",
      avatar:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200",
      rating: 4.6,
      handshakes: 15,
      paws: 19,
      date: "21 Nov 25’",
    },
  ];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReviewCard
          rating={item.rating}
          text="Jane was fantastic! I received regular photo updates and could tell Polo was in great hands. The house was exactly as I left it, and I came home to a very happy dog. Highly recommend!"
          reviewerName={item.name}
          reviewerAvatar={item.avatar}
          handshakes={item.handshakes}
          paws={item.paws}
          dateLabel={item.date}
          onPress={onReviewerPress ? () => onReviewerPress(item.id) : undefined}
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
                  5 reviews
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
