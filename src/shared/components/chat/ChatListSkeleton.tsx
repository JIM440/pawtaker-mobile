import React from "react";
import { StyleSheet, View } from "react-native";
import { ChatRowSkeleton } from "./ChatRowSkeleton";

type ChatListSkeletonProps = {
  /** Number of placeholder rows (default matches typical viewport). */
  rowCount?: number;
};

/** Row placeholders only — use when the screen already shows a real title + search bar. */
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
 * Same as {@link ChatListSkeleton}: chat row placeholders only.
 * Title and search are not duplicated — keep real header/search mounted above while loading.
 */
export function ChatScreenSkeleton(props: ChatScreenSkeletonProps) {
  return <ChatListSkeleton {...props} />;
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 40,
  },
});
