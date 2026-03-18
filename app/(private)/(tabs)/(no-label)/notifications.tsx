import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { NotificationCard } from "@/src/shared/components/cards";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Search } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { NotificationsSkeleton } from "@/src/shared/components/skeletons";
import { SearchField } from "@/src/shared/components/forms/SearchField";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
};

const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    title: "Care ending soon",
    body: "Care for Polo with Bob Majors ends at 6PM",
    time: "1m",
    unread: true,
  },
  {
    id: "2",
    title: "New chat from Bob Majors",
    body: "“can we conclude”",
    time: "1h",
    unread: true,
  },
  {
    id: "3",
    title: "Check your match!",
    body: "Bob Majors applied for Polo",
    time: "5h",
  },
  {
    id: "4",
    title: "+5 new points in!",
    body: "You completed care for Polo for Jane Ambers",
    time: "2d",
  },
] as const;

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const menuButtonRefs = useRef<Record<string, View | null>>({});

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [items, query]);

  const handleDelete = () => {
    if (!menuForId) return;
    setItems((prev) => prev.filter((n) => n.id !== menuForId));
    setMenuForId(null);
    setMenuPosition(null);
  };

  const hasNotifications = filtered.length > 0;
  const badgeCount = items.length;

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <NotificationsSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top header with shared BackHeader component */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surfaceBright,
              borderBottomColor: colors.outlineVariant,
            },
          ]}
        >
          <BackHeader
            onBack={() => router.push("/(private)/(tabs)")}
            title={
              <View style={styles.titleRow}>
                <AppText
                  variant="headline"
                  style={styles.title}
                  color={colors.onSurface}
                >
                  {t("notifications.title", "Notifications")}
                </AppText>
                {badgeCount > 0 && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <AppText
                      variant="caption"
                      color={colors.onPrimaryContainer}
                      style={styles.badgeText}
                    >
                      {badgeCount}
                    </AppText>
                  </View>
                )}
              </View>
            }
          />

          {/* Search bar (Figma-aligned) */}
          <SearchField
            containerStyle={styles.searchBar}
            placeholder={t("notifications.searchPlaceholder", "Search notifications")}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {hasNotifications ? (
          <View style={styles.list}>
            {filtered.map((n, index) => (
              <View
                key={n.id}
                style={[
                  styles.itemOuter,
                  {
                    backgroundColor: colors.surface,
                  },
                  index !== filtered.length - 1 && {
                    borderBottomColor: colors.outlineVariant,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                  },
                ]}
              >
                <NotificationCard
                  ref={(el) => {
                    // store ref for menu positioning
                    menuButtonRefs.current[n.id] = el;
                  }}
                  id={n.id}
                  title={n.title}
                  body={n.body}
                  time={n.time}
                  unread={n.unread}
                  colors={{
                    onSurface: colors.onSurface,
                    onSurfaceVariant: colors.onSurfaceVariant,
                  }}
                  onPressMenu={(id) => {
                    const btn = menuButtonRefs.current[id];
                    btn?.measureInWindow((x, y, width, height) => {
                      setMenuPosition({ x, y, width, height });
                      setMenuForId(id);
                    });
                  }}
                />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppImage
              source={require("@/assets/illustrations/no-notification-graphic.svg")}
              type="svg"
              style={styles.emptyIllustration}
              height={145}
            />
            <AppText
              variant="body"
              color={colors.onSurface}
              style={styles.emptyTitle}
            >
              {t("notifications.emptyTitle", "Oops! No notifications yet")}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.emptySubtitle}
            >
              {t(
                "notifications.emptySubtitle",
                "All your notifications will appear here",
              )}
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* Context menu for delete */}
      <Modal
        transparent
        visible={menuForId != null}
        animationType="fade"
        onRequestClose={() => {
          setMenuForId(null);
          setMenuPosition(null);
        }}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => {
            setMenuForId(null);
            setMenuPosition(null);
          }}
        >
          {menuPosition && menuForId && (
            <View
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                  top: menuPosition.y + menuPosition.height + 4,
                  left: menuPosition.x - 180,
                },
              ]}
            >
              <Pressable style={styles.menuItem} onPress={handleDelete}>
                <AppText variant="body" color={colors.onSurface}>
                  {t("notifications.deleteOne", "Delete this notification")}
                </AppText>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.2,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 12,
  },
  searchBar: {
    marginTop: 4,
    marginHorizontal: 16,
    height: SearchFilterStyles.searchBarHeight,
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: SearchFilterStyles.searchBarGap,
    paddingHorizontal: SearchFilterStyles.searchBarPaddingHorizontal,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: SearchFilterStyles.searchInputFontSize,
  },
  list: {},
  itemOuter: {
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 72,
    paddingHorizontal: 32,
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 4,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  menuCard: {
    position: "absolute",
    width: 196,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    overflow: "hidden",
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
