import { ChatTypography } from "@/src/constants/chatTypography";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import React from "react";
import { StyleSheet, View } from "react-native";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import { ChatRowSkeleton } from "./ChatRowSkeleton";

type ChatListSkeletonProps = {
  /** Number of placeholder rows (default matches typical viewport). */
  rowCount?: number;
};

/** Row placeholders only — use when the screen already shows a real search bar. */
export function ChatListSkeleton({ rowCount = 8 }: ChatListSkeletonProps) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: rowCount }).map((_, i) => (
        <ChatRowSkeleton key={i} />
      ))}
    </View>
  );
}

type ChatScreenSkeletonProps = {
  rowCount?: number;
};

/**
 * Full chat screen loading state (Figma ~1182-87157): title + search + filter + rows.
 * Use this instead of rendering real header/search while `loading` is true to avoid duplicate chrome.
 */
export function ChatScreenSkeleton({ rowCount = 8 }: ChatScreenSkeletonProps) {
  return (
    <View style={styles.wrap}>
      <Skeleton
        height={ChatTypography.listScreenTitle.lineHeight}
        width={100}
        borderRadius={6}
        style={{ marginBottom: 12 }}
      />
      <View style={styles.searchRow}>
        <Skeleton
          height={SearchFilterStyles.searchBarHeight}
          borderRadius={SearchFilterStyles.searchBarBorderRadius}
          style={{ flex: 1 }}
        />
        <Skeleton
          width={SearchFilterStyles.filterButtonSize}
          height={SearchFilterStyles.filterButtonSize}
          borderRadius={SearchFilterStyles.filterButtonBorderRadius}
        />
      </View>
      {Array.from({ length: rowCount }).map((_, i) => (
        <ChatRowSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 40,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
});
