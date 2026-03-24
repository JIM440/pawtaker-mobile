import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { NotificationCard } from "@/src/shared/components/cards";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { NotificationsSkeleton } from "@/src/shared/components/skeletons";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type NotificationItem = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
  type?: string;
  image?: string;
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [loading] = useState(false);
  const [query, setQuery] = useState("");

  const mockNotifications = useMemo(
    (): (NotificationItem & { type: string; image?: string })[] => [
      {
        id: "1",
        title: t("notifications.mock.careEndingTitle"),
        body: t("notifications.mock.careEndingBody"),
        time: "1m",
        unread: true,
        type: "care_given",
      },
      {
        id: "2",
        title: t("notifications.mock.newChatTitle"),
        body: t("notifications.mock.newChatBody"),
        time: "1h",
        unread: true,
        type: "chat",
        image:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200",
      },
      {
        id: "3",
        title: t("notifications.mock.verificationTitle"),
        body: t("notifications.mock.verificationBody"),
        time: "3h",
        type: "verification_complete",
      },
      {
        id: "4",
        title: t("notifications.mock.matchTitle"),
        body: t("notifications.mock.matchBody"),
        time: "5h",
        type: "applied",
        image:
          "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=200",
      },
      {
        id: "5",
        title: t("notifications.mock.pointsTitle"),
        body: t("notifications.mock.pointsBody"),
        time: "2d",
        type: "points_gained",
      },
      {
        id: "6",
        title: t("notifications.mock.careSuccessTitle"),
        body: t("notifications.mock.careSuccessBody"),
        time: "3d",
        type: "paws_given",
      },
    ],
    [t],
  );

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const menuButtonRefs = useRef<Record<string, View | null>>({});

  // Refresh mock list when locale changes (strings come from i18n)
  React.useEffect(() => {
    setItems(mockNotifications);
  }, [mockNotifications]);

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

  const handleNotificationPress = (id: string) => {
    const item = items.find((n) => n.id === id);
    if (!item) return;

    switch (item.type) {
      case "chat":
        router.push("/(private)/(tabs)/messages");
        break;
      case "applied":
      case "care_given":
      case "paws_given":
        // Assuming there's a task or pet detail page
        router.push("/(private)/(tabs)/profile");
        break;
      case "verification_complete":
        router.push("/(private)/(tabs)/profile");
        break;
      default:
        // Generic fallback
        router.push("/(private)/(tabs)/profile");
        break;
    }
  };

  const hasNotifications = filtered.length > 0;
  const badgeCount = items.length;

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <NotificationsSkeleton />
        </ScrollView>
      </View>
    );
  }

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      {/* Header with back button and notification title/badge */}
      <BackHeader
        title={
          <View style={styles.titleRow}>
            <AppText
              variant="headline"
              style={styles.title}
              color={colors.onSurface}
            >
              {t("notifications.title")}
            </AppText>
            {badgeCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <AppText
                  variant="caption"
                  color={colors.onPrimary}
                  style={styles.badgeText}
                >
                  {badgeCount}
                </AppText>
              </View>
            )}
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <SearchField
            containerStyle={styles.searchBar}
            placeholder={t("notifications.searchPlaceholder")}
            value={query}
            onChangeText={setQuery}
            rightSlot={
              <Search
                size={SearchFilterStyles.searchIconSize}
                color={colors.onSurfaceVariant}
              />
            }
          />
        </View>

        {hasNotifications ? (
          <View style={styles.list}>
            {filtered.map((n, index) => (
              <NotificationCard
                key={n.id}
                ref={(el) => {
                  menuButtonRefs.current[n.id] = el;
                }}
                id={n.id}
                title={n.title}
                body={n.body}
                time={n.time}
                unread={n.unread}
                type={n.type as any}
                image={n.image}
                isLast={index === filtered.length - 1}
                onPress={handleNotificationPress}
                onPressMenu={(id) => {
                  const btn = menuButtonRefs.current[id];
                  btn?.measureInWindow((x, y, width, height) => {
                    setMenuPosition({ x, y, width, height });
                    setMenuForId(id);
                  });
                }}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <AppImage
              source={require("@/assets/illustrations/pets/no-notification-graphic.svg")}
              type="svg"
              style={styles.emptyIllustration}
              height={145}
            />
            <AppText
              variant="body"
              color={colors.onSurface}
              style={styles.emptyTitle}
            >
              {t("notifications.emptyTitle")}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.emptySubtitle}
            >
              {t("notifications.emptySubtitle")}
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
                  top: menuPosition.y + menuPosition.height + 24,
                  right: 20,
                },
              ]}
            >
              <TouchableOpacity style={styles.menuItem} onPress={handleDelete}>
                <AppText variant="body" color={colors.onSurface}>
                  {t("notifications.deleteOne")}
                </AppText>
              </TouchableOpacity>
              {/* If more items were here, we'd add separators */}
            </View>
          )}
        </Pressable>
      </Modal>
    </PageContainer>
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
    flexDirection: "row",
    alignItems: "center",
    gap: SearchFilterStyles.searchBarGap,
    paddingHorizontal: SearchFilterStyles.searchBarPaddingHorizontal,
  },
  list: {},
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
  },
  menuCard: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 220,
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
