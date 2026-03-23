import { ChatTypography } from "@/src/constants/chatTypography";
import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";

/** Row line heights match `ChatTypography` / `ChatRow` (Figma chat list). */
export function ChatRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={styles.content}>
        <Skeleton
          height={ChatTypography.rowName.lineHeight}
          width={140}
          borderRadius={6}
          style={{ marginBottom: 6 }}
        />
        <Skeleton height={ChatTypography.rowPreview.lineHeight} width="88%" borderRadius={6} />
      </View>
      <View style={styles.right}>
        <Skeleton
          height={ChatTypography.rowTimestamp.lineHeight}
          width={36}
          borderRadius={4}
          style={{ marginBottom: 6 }}
        />
        <Skeleton
          height={18}
          width={18}
          borderRadius={9}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: "flex-end",
    minWidth: 40,
  },
});
