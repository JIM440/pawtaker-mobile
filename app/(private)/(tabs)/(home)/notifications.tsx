import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { supabase } from "@/src/lib/supabase/client";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { NotificationCard } from "@/src/shared/components/cards";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { NotificationsSkeleton } from "@/src/shared/components/skeletons";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { DataState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  RefreshControl,
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
  data?: Record<string, any> | null;
};

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [menuForId, setMenuForId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const menuButtonRefs = useRef<Record<string, View | null>>({});

  const relativeTime = (isoDate: string) => {
    const now = Date.now();
    const diffMs = Math.max(0, now - new Date(isoDate).getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const loadNotifications = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    if (!opts?.refresh) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped: NotificationItem[] = (data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        time: relativeTime(item.created_at),
        unread: !item.read,
        type: item.type,
        data: (item.data as Record<string, any> | null) ?? null,
      }));
      setItems(mapped);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : t("common.error", "Something went wrong"),
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadNotifications();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications({ refresh: true });
    setRefreshing(false);
  };

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
      case "kyc_rejected":
        router.push("/(private)/kyc");
        break;
      default:
        // Generic fallback
        router.push("/(private)/(tabs)/profile");
        break;
    }
  };

  const handleNotificationAction = (id: string) => {
    const item = items.find((n) => n.id === id);
    if (!item) return;
    if (item.type === "kyc_rejected") {
      router.push("/(private)/kyc");
    }
  };

  const hasNotifications = filtered.length > 0;
  const badgeCount = items.length;

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
        <BackHeader title={t("notifications.title")} onBack={() => router.back()} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <NotificationsSkeleton />
        </ScrollView>
      </PageContainer>
    );
  }

  if (loadError) {
    return (
      <PageContainer>
        <BackHeader
          title={t("notifications.title")}
          onBack={() => router.back()}
        />
        <DataState
          title={t("common.error", "Something went wrong")}
          message={loadError}
          mode="full"
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void loadNotifications();
          }}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      {/* Header with back button and notification title/badge */}
      <BackHeader
        onBack={() => router.back()}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
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
                actionLabel={n.type === "kyc_rejected" ? "Resubmit" : undefined}
                onActionPress={handleNotificationAction}
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
          <DataState
            title={t("notifications.emptyTitle")}
            message={t("notifications.emptySubtitle")}
            illustration={
              <AppImage
                source={require("@/assets/illustrations/pets/no-notification-graphic.svg")}
                type="svg"
                style={styles.emptyIllustration}
                height={145}
              />
            }
            actionLabel={t("common.retry", "Retry")}
            onAction={() => {
              void loadNotifications();
            }}
            mode="full"
          />
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
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
    marginBottom: 8,
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
