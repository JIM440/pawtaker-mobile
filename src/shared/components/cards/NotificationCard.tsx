import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import {
  Activity,
  Ellipsis,
  Handshake,
  PawPrint,
  Shield
} from "lucide-react-native";
import React, { ForwardedRef, forwardRef } from "react";
import { StyleSheet, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";

export type NotificationType =
  | "verification"
  | "verification_complete"
  | "care_given"
  | "handshake"
  | "paws"
  | "paws_given"
  | "points"
  | "points_gained"
  | "chat"
  | "applied"
  | "kyc_rejected";

export type NotificationCardProps = {
  id: string;
  title: string;
  body: string;
  time: string;
  type?: NotificationType;
  image?: string;
  unread?: boolean;
  isLast?: boolean;
  onPress?: (id: string) => void;
  actionLabel?: string;
  onActionPress?: (id: string) => void;
  /**
   * Called when the overflow menu is pressed.
   */
  onPressMenu?: (id: string) => void;
};

export const NotificationCard = forwardRef<View, NotificationCardProps>(
  ({
    id,
    title,
    body,
    time,
    unread,
    type,
    image,
    isLast,
    onPress,
    onPressMenu,
    actionLabel,
    onActionPress,
  }, ref) => {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const renderIcon = () => {
      const containerStyle: StyleProp<ViewStyle> = [
        styles.itemAvatar,
        {
          backgroundColor: colors.primaryContainer,
          alignItems: "center",
          justifyContent: "center",
        },
      ];

      switch (type) {
        case "verification":
        case "verification_complete":
        case "kyc_rejected":
          return (
            <View style={containerStyle}>
              <Shield size={20} color={colors.primary} />
            </View>
          );
        case "care_given":
        case "handshake":
          return (
            <View style={containerStyle}>
              <Handshake size={20} color={colors.primary} />
            </View>
          );
        case "paws":
        case "paws_given":
          return (
            <View style={containerStyle}>
              <PawPrint size={20} color={colors.primary} />
            </View>
          );
        case "points":
        case "points_gained":
          return (
            <View style={containerStyle}>
              <Activity size={20} color={colors.primary} />
            </View>
          );
        case "chat":
        case "applied":
          return (
            <AppImage
              source={{
                uri:
                  image ??
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
              }}
              style={styles.itemAvatar}
            />
          );
        default:
          return image ? (
            <AppImage source={{ uri: image }} style={styles.itemAvatar} />
          ) : (
            <View style={containerStyle}>
              <PawPrint size={20} color={colors.primary} />
            </View>
          );
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onPress?.(id)}
        disabled={!onPress}
        style={{
          ...styles.itemInner,
          backgroundColor: unread ? colors.surfaceBright : "transparent",
          borderTopColor: colors.outlineVariant,
          borderTopWidth: 1,
          borderBottomColor: colors.outlineVariant,
          borderBottomWidth: isLast ? 1 : 0,
        }}
      >
        {renderIcon()}

        <View style={styles.itemContent}>
          {/* Row 1: title (left) + time (right) */}
          <View style={styles.row}>
            <AppText
              variant="body"
              style={styles.itemTitle}
              color={colors.onSurfaceVariant}
            >
              {title}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.itemTime}
            >
              {time}
            </AppText>
          </View>

          {/* Row 2: body text (left) + ellipsis (right) */}
          <View style={styles.row}>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.itemBody}
            >
              {body}
            </AppText>
            <TouchableOpacity
              ref={ref as ForwardedRef<View>}
              hitSlop={8}
              onPress={() => onPressMenu?.(id)}
            >
              <Ellipsis size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          {actionLabel && onActionPress ? (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => onActionPress(id)}
                style={[
                  styles.actionButton,
                  { borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
                ]}
              >
                <AppText variant="caption" color={colors.primary}>
                  {actionLabel}
                </AppText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  },
);

NotificationCard.displayName = "NotificationCard";

const styles = StyleSheet.create({
  itemInner: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: {
    flex: 1,
    marginRight: 8,
    lineHeight: 16,
  },
  itemBody: {
    flex: 1,
    marginRight: 8,
    lineHeight: 14,
  },
  itemTime: {
    fontSize: 11,
  },
  actionRow: {
    marginTop: 8,
  },
  actionButton: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
