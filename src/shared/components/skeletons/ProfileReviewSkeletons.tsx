import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

export function ReviewCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View style={[revSkStyles.card, { backgroundColor: colors.surfaceBright }]}>
      <View style={revSkStyles.stars}>
        <Skeleton height={8} width={150} borderRadius={10} />
      </View>
      <View style={revSkStyles.body}>
        <Skeleton height={8} width="100%" borderRadius={4} />
        <Skeleton height={8} width="92%" borderRadius={4} />
        <Skeleton height={8} width="88%" borderRadius={4} />
        <Skeleton height={8} width="84%" borderRadius={4} />
      </View>
      <View style={revSkStyles.footer}>
        <Skeleton height={40} width={120} borderRadius={24} />
        <Skeleton height={8} width={72} borderRadius={4} />
      </View>
    </View>
  );
}

export function ReviewsSummaryCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View
      style={[
        revSkStyles.summary,
        {
          backgroundColor: colors.surfaceBright,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      <Skeleton height={14} width="55%" borderRadius={4} />
      <Skeleton
        height={20}
        width={100}
        borderRadius={6}
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

export function ProfileReviewsTabSkeleton() {
  return (
    <View style={revSkStyles.list}>
      <ReviewCardSkeleton />
      <ReviewCardSkeleton />
    </View>
  );
}

const revSkStyles = StyleSheet.create({
  list: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  summary: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 16,
  },
  body: {
    gap: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
});
