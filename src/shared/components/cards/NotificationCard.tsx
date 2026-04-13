import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import {
    Activity,
    Ellipsis,
    Handshake,
    PawPrint,
    Shield,
    Star,
} from "lucide-react-native";
import React, { ForwardedRef, forwardRef } from "react";
import {
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View,
    type StyleProp,
    type ViewStyle,
} from "react-native";

export type NotificationType =
  | "pet_added"
  | "care_request_posted"
  | "availability_posted"
  | "availability_saved"
  | "review_received"
  | "review_submitted"
  | "contract_completed"
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
  | "kyc_rejected"
  | "kyc_approved";

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
  (
    {
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
    },
    ref,
  ) => {
    const { resolvedTheme } = useThemeStore();
    const colors = Colors[resolvedTheme];

    const renderIcon = () => {
      const containerStyle: StyleProp<ViewStyle> = [
        styles.itemAvatar,
        {
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
        },
      ];

      switch (type) {
        case "pet_added":
          return image ? (
            <AppImage
              source={{ uri: image }}
              style={styles.itemAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={containerStyle}>
              <PawPrint size={20} color={colors.onPrimary} />
            </View>
          );
        case "care_request_posted":
          return (
            <View style={containerStyle}>
              <Activity size={20} color={colors.onPrimary} />
            </View>
          );
        case "availability_posted":
        case "availability_saved":
          return (
            <View style={containerStyle}>
              <Handshake size={20} color={colors.onPrimary} />
            </View>
          );
        case "review_received":
        case "review_submitted":
          return (
            <View style={containerStyle}>
              <Star
                size={20}
                color={colors.onPrimary}
                fill={colors.onPrimary}
              />
            </View>
          );
        case "contract_completed":
          return (
            <View style={containerStyle}>
              <Handshake size={20} color={colors.onPrimary} />
            </View>
          );
        case "verification":
        case "verification_complete":
        case "kyc_approved":
        case "kyc_rejected":
          return (
            <View style={containerStyle}>
              <Shield size={20} color={colors.onPrimary} />
            </View>
          );
        case "care_given":
        case "handshake":
          return (
            <View style={containerStyle}>
              <Handshake size={20} color={colors.onPrimary} />
            </View>
          );
        case "paws":
        case "paws_given":
          return (
            <View style={containerStyle}>
              <PawPrint size={20} color={colors.onPrimary} />
            </View>
          );
        case "points":
        case "points_gained":
          return (
            <View style={containerStyle}>
              <Activity size={20} color={colors.onPrimary} />
            </View>
          );
        case "chat":
        case "applied":
          return image ? (
            <AppImage source={{ uri: image }} style={styles.itemAvatar} />
          ) : (
            <View style={containerStyle}>
              <Activity size={20} color={colors.onPrimary} />
            </View>
          );
        default:
          return image ? (
            <AppImage source={{ uri: image }} style={styles.itemAvatar} />
          ) : (
            <View style={containerStyle}>
              <PawPrint size={20} color={colors.onPrimary} />
            </View>
          );
      }
    };

    const cardStyle = {
      ...styles.itemInner,
      backgroundColor: unread ? colors.surfaceBright : "transparent",
      borderTopColor: colors.outlineVariant,
      borderTopWidth: 1,
      borderBottomColor: colors.outlineVariant,
      borderBottomWidth: isLast ? 1 : 0,
    };

    const fireCardPress = () => onPress?.(id);

    return (
      <View style={cardStyle}>
        <View style={styles.mainRow}>
          <Pressable
            onPress={fireCardPress}
            disabled={!onPress}
            style={({ pressed }) => [
              styles.iconTap,
              onPress && pressed ? styles.mainPressed : null,
            ]}
          >
            {renderIcon()}
          </Pressable>

          <View style={styles.itemContent}>
            <Pressable
              onPress={fireCardPress}
              disabled={!onPress}
              style={({ pressed }) =>
                onPress && pressed ? styles.mainPressed : null
              }
            >
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
            </Pressable>

            <View style={styles.row}>
              <Pressable
                onPress={fireCardPress}
                disabled={!onPress}
                style={({ pressed }) => [
                  styles.bodyTap,
                  onPress && pressed ? styles.mainPressed : null,
                ]}
              >
                <AppText
                  variant="caption"
                  color={colors.onSurface}
                  style={styles.itemBody}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {body}
                </AppText>
              </Pressable>
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
                    {
                      borderColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainerLowest,
                    },
                  ]}
                >
                  <AppText variant="caption" color={colors.primary}>
                    {actionLabel}
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  },
);

NotificationCard.displayName = "NotificationCard";

const styles = StyleSheet.create({
  itemInner: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  mainRow: {
    flexDirection: "row",
  },
  iconTap: {},
  mainPressed: {
    opacity: 0.7,
  },
  bodyTap: {
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  itemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
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
