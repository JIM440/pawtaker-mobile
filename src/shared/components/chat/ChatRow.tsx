import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type ChatRowProps = {
  threadId: string;
  avatarUri?: string | null;
  name: string;
  lastMessagePreview: string;
  timestamp: string;
  unreadCount?: number;
  onPress?: () => void;
};

export function ChatRow({
  avatarUri,
  name,
  lastMessagePreview,
  timestamp,
  unreadCount = 0,
  onPress,
}: ChatRowProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[styles.row]}
    >
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <AppImage
            source={{ uri: avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.surfaceDim },
            ]}
          >
            <AppText
              variant="body"
              color={colors.onSurface}
              style={ChatTypography.rowName}
            >
              {name.charAt(0).toUpperCase()}
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <AppText
          variant="body"
          numberOfLines={1}
          style={[styles.name, ChatTypography.rowName]}
        >
          {name}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          numberOfLines={1}
          style={[styles.preview, ChatTypography.rowPreview]}
        >
          {lastMessagePreview}
        </AppText>
      </View>
      <View style={styles.right}>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={[styles.time, ChatTypography.rowTimestamp]}
        >
          {timestamp}
        </AppText>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <AppText
              variant="caption"
              color={colors.onPrimary}
              style={[styles.badgeText, ChatTypography.rowBadge]}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 28,
    overflow: "hidden",
  },
  avatar: {
    width: 44,
    height: 44,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    lineHeight: 14,
  },
  preview: {
    fontSize: 12,
    lineHeight: 12,
  },
  right: {
    alignItems: "flex-end",
    minWidth: 40,
    gap: 6,
  },
  time: {},
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  badgeText: {},
});
