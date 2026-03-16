import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Ellipsis } from "lucide-react-native";
import React, { ForwardedRef, forwardRef } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type NotificationCardProps = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  /**
   * Colors object from theme to keep this component presentation-only.
   */
  colors: {
    onSurface: string;
    onSurfaceVariant: string;
  };
  /**
   * Called when the overflow menu is pressed.
   */
  onPressMenu?: (id: string) => void;
};

export const NotificationCard = forwardRef<View, NotificationCardProps>(
  ({ id, title, body, time, unread, colors, onPressMenu }, ref) => {
    return (
      <View style={styles.itemInner}>
        <AppImage
          source={{
            uri: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200",
          }}
          style={styles.itemAvatar}
        />
        <View style={styles.itemContent}>
          {/* Row 1: title (left) + time (right) */}
          <View style={styles.row}>
            <AppText
              variant="body"
              style={styles.itemTitle}
              color={unread ? colors.onSurface : colors.onSurface}
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
              <Ellipsis size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    backgroundColor: "#F4D6D6",
  },
  itemContent: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  itemTitle: {
    flex: 1,
    marginRight: 8,
  },
  itemBody: {
    flex: 1,
    marginRight: 8,
  },
  itemTime: {
    fontSize: 11,
  },
});
