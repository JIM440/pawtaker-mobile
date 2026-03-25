import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";

/**
 * Matches ProfileHeader + underline TabBar footprint on the profile tab home.
 * Shown until the auth profile row has finished loading.
 */
export function ProfileHeaderAndTabsSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.wrap}>
      <View style={styles.headerBlock}>
        <Skeleton height={80} width={80} borderRadius={40} />
        <Skeleton height={24} width={180} style={styles.nameLine} />
        <Skeleton height={14} width={140} style={styles.locationLine} />
        <View style={styles.statsRow}>
          <Skeleton height={28} width={88} borderRadius={999} />
          <Skeleton height={28} width={100} borderRadius={999} />
          <Skeleton height={28} width={56} borderRadius={999} />
        </View>
      </View>

      <View
        style={[
          styles.tabRow,
          {
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        {[72, 96, 64, 76].map((w, i) => (
          <Skeleton key={i} height={14} width={w} borderRadius={6} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
  },
  headerBlock: {
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  nameLine: {
    marginTop: 12,
  },
  locationLine: {
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginHorizontal: 0,
  },
});
