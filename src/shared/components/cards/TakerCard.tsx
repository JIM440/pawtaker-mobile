import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AppText } from "@/src/shared/components/ui/AppText";
import { ProfileAvatar } from "@/src/shared/components/ui/ProfileAvatar";
import {
  Handshake,
  MapPin,
  MoreHorizontal,
  PawPrint,
  Star,
} from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export type TakerCardProps = {
  taker: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    species: string;
    tags: string[];
    location: string;
    distance: string;
    status: "available" | "unavailable";
    completedTasks?: number;
    petsHandled?: number;
  };
  onPress: () => void;
  onMenuPress?: (ref: any) => void;
  showMenu?: boolean;
};

export function TakerCard({
  taker,
  onPress,
  onMenuPress,
  showMenu = true,
}: TakerCardProps) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const menuBtnRef = React.useRef<any>(null);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.surfaceBright }]}
    >
      <View style={styles.header}>
        <ProfileAvatar uri={taker.avatar} name={taker.name} size={80} />
        <View style={styles.titleCol}>
          <View style={styles.nameMetaRow}>
            <View style={styles.nameRow}>
              <AppText
                variant="title"
                color={colors.onSurface}
                style={styles.name}
                numberOfLines={1}
              >
                {taker.name}
              </AppText>
              {taker.status === "available" && (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.tertiaryContainer },
                  ]}
                >
                  <AppText variant="caption" color={colors.onTertiaryContainer}>
                    {t("feed.takerAvailable", "Available")}
                  </AppText>
                </View>
              )}
            </View>

            {showMenu && onMenuPress && (
              <TouchableOpacity
                ref={menuBtnRef}
                onPress={() => onMenuPress(menuBtnRef.current)}
                hitSlop={8}
                style={styles.menuBtn}
              >
                <MoreHorizontal size={20} color={colors.onSurface} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.metaRow}>
            <View
              style={{
                ...styles.metaItem,
                backgroundColor: colors.surfaceBright,
              }}
            >
              <AppText variant="caption" color={colors.onSurface}>
                {taker.rating.toFixed(1)}
              </AppText>
              <Star size={12} color={colors.tertiary} fill={colors.tertiary} />
            </View>
            <View
              style={{
                ...styles.metaItem,
                backgroundColor: colors.surfaceBright,
              }}
            >
              <Handshake size={12} color={colors.tertiary} />
              <AppText variant="caption" color={colors.tertiary}>
                {taker.completedTasks ?? 0}
              </AppText>
            </View>
            <View
              style={{
                ...styles.metaItem,
                backgroundColor: colors.surfaceBright,
              }}
            >
              <PawPrint size={12} color={colors.tertiary} />
              <AppText variant="caption" color={colors.tertiary}>
                {taker.petsHandled ?? 0}
              </AppText>
            </View>
          </View>

          <View style={styles.tagsRow}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <AppText
                variant="caption"
                style={[
                  styles.tags,
                  { backgroundColor: colors.surfaceContainer },
                ]}
                numberOfLines={1}
              >
                {taker.species}
              </AppText>
              {taker.tags?.length ? (
                <AppText
                  variant="caption"
                  style={[
                    styles.tags,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                  numberOfLines={1}
                >
                  {taker.tags.join(" • ")}
                </AppText>
              ) : null}
            </View>
            <View
              style={[
                styles.locationRow,
                { backgroundColor: colors.surfaceContainer },
              ]}
            >
              <MapPin size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" numberOfLines={1}>
                {taker.location} • {taker.distance}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  header: {
    flexDirection: "row",
    gap: 12,
  },
  titleCol: {
    flex: 1,
    minWidth: 0,
  },
  nameMetaRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBtn: {
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tagsRow: {
    gap: 4,
    marginTop: 6,
  },
  tags: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
    minWidth: 0,
  },
});
