import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

function NotificationRowSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Skeleton height={40} width={40} borderRadius={20} />
        <View style={styles.rowContent}>
          <Skeleton height={14} width={180} borderRadius={4} />
          <Skeleton
            height={12}
            width="90%"
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
          <Skeleton
            height={10}
            width={36}
            borderRadius={4}
            style={{ marginTop: 6 }}
          />
        </View>
      </View>
    </View>
  );
}

export function NotificationsSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.container}>
      {/* List */}
      <View style={styles.list}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.itemWrap}>
            <NotificationRowSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  searchBar: {
    height: SearchFilterStyles.searchBarHeight,
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
    marginBottom: 16,
  },
  list: {
    gap: 0,
    marginTop: 24,
  },
  itemWrap: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
});
