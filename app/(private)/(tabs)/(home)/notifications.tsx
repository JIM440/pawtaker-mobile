import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { navigateForNotificationPayloadAsync } from "@/src/features/notifications/notificationNavigation";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";
import { NotificationCard } from "@/src/shared/components/cards";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { NotificationsSkeleton } from "@/src/shared/components/skeletons";
import {
  ErrorState,
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
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

/** Matches DB trigger `notify_kyc_rejected` (`type = 'kyc_rejected'`). */
function isKycRejectionNotification(n: NotificationItem): boolean {
  return n.type === "kyc_rejected";
}

function buildPersonAvatarById(
  usersData:
    | Array<{ id: string; avatar_url: string | null }>
    | null
    | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const u of usersData ?? []) {
    if (
      typeof u.avatar_url === "string" &&
      u.avatar_url.trim().length > 0
    ) {
      map.set(u.id, u.avatar_url.trim());
    }
  }
  return map;
}

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
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
        .select("id, user_id, type, title, body, data, read, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as TablesRow<"notifications">[];
      const rawById = new Map<
        string,
        {
          row: TablesRow<"notifications">;
          rawData: Record<string, any> | null;
        }
      >();
      const petIds = new Set<string>();
      const personIds = new Set<string>();
      const threadIds = new Set<string>();

      for (const row of rows) {
        const rawData = (row.data as Record<string, any> | null) ?? null;
        rawById.set(row.id, { row, rawData });
        const petId = rawData?.pet_id;
        const reviewerId = rawData?.reviewer_id;
        const revieweeId = rawData?.reviewee_id;
        const takerId = rawData?.taker_id;
        const threadId = rawData?.threadId;
        const senderId = rawData?.sender_id;

        if (
          (row.type === "pet_added" || row.type === "care_request_posted") &&
          typeof petId === "string" &&
          petId.trim().length > 0
        ) {
          petIds.add(petId);
        }
        if (typeof reviewerId === "string" && reviewerId.trim().length > 0) {
          personIds.add(reviewerId);
        }
        if (typeof revieweeId === "string" && revieweeId.trim().length > 0) {
          personIds.add(revieweeId);
        }
        if (typeof takerId === "string" && takerId.trim().length > 0) {
          personIds.add(takerId);
        }
        if (
          row.type === "chat" &&
          typeof threadId === "string" &&
          threadId.trim().length > 0
        ) {
          threadIds.add(threadId);
        }
        if (
          row.type === "chat" &&
          typeof senderId === "string" &&
          senderId.trim().length > 0
        ) {
          personIds.add(senderId.trim());
        }
      }

      const [{ data: petsData }, { data: threadsData }] = await Promise.all([
        petIds.size > 0
          ? supabase
              .from("pets")
              .select("id,photo_urls")
              .in("id", Array.from(petIds))
          : Promise.resolve({ data: [] } as any),
        threadIds.size > 0
          ? supabase
              .from("threads")
              .select("id,participant_ids")
              .in("id", Array.from(threadIds))
          : Promise.resolve({ data: [] } as any),
      ]);

      const petImageById = new Map<string, string>();
      for (const p of petsData ?? []) {
        const first = Array.isArray((p as any)?.photo_urls)
          ? ((p as any).photo_urls[0] as string | undefined)
          : undefined;
        if (typeof first === "string" && first.trim().length > 0) {
          petImageById.set((p as any).id, first.trim());
        }
      }

      const chatOtherUserByThreadId = new Map<string, string>();
      for (const thread of threadsData ?? []) {
        const parts = Array.isArray((thread as any)?.participant_ids)
          ? ((thread as any).participant_ids as string[])
          : [];
        const other = parts.find((p) => p && p !== user.id);
        if (other) {
          chatOtherUserByThreadId.set((thread as any).id, other);
          personIds.add(other);
        }
      }

      const { data: usersData } =
        personIds.size > 0
          ? await supabase
              .from("users")
              .select("id,avatar_url")
              .in("id", Array.from(personIds))
          : ({ data: [] } as any);
      const personAvatarById = buildPersonAvatarById(
        usersData as Array<{ id: string; avatar_url: string | null }> | null,
      );

      const mapped: NotificationItem[] = rows.map((row) => {
        const rawData = rawById.get(row.id)?.rawData ?? null;
        const directPetPhoto =
          typeof rawData?.photo_url === "string" &&
          rawData.photo_url.trim().length > 0
            ? rawData.photo_url.trim()
            : undefined;
        const petPhoto =
          directPetPhoto ||
          (typeof rawData?.pet_id === "string"
            ? petImageById.get(rawData.pet_id)
            : undefined);

        const threadOtherUserId =
          row.type === "chat" && typeof rawData?.threadId === "string"
            ? chatOtherUserByThreadId.get(rawData.threadId)
            : undefined;
        const personImage =
          (typeof rawData?.reviewer_id === "string"
            ? personAvatarById.get(rawData.reviewer_id)
            : undefined) ||
          (typeof rawData?.reviewee_id === "string"
            ? personAvatarById.get(rawData.reviewee_id)
            : undefined) ||
          (typeof rawData?.taker_id === "string"
            ? personAvatarById.get(rawData.taker_id)
            : undefined) ||
          (threadOtherUserId
            ? personAvatarById.get(threadOtherUserId)
            : undefined);

        const senderIdTrim =
          typeof rawData?.sender_id === "string"
            ? rawData.sender_id.trim()
            : "";
        const directSenderAvatar =
          typeof rawData?.sender_avatar_url === "string" &&
          rawData.sender_avatar_url.trim().length > 0
            ? rawData.sender_avatar_url.trim()
            : undefined;
        const senderImage =
          directSenderAvatar ||
          (senderIdTrim ? personAvatarById.get(senderIdTrim) : undefined);

        const image =
          row.type === "pet_added" || row.type === "care_request_posted"
            ? petPhoto
            : row.type === "review_received" ||
                row.type === "review_submitted" ||
                row.type === "applied"
              ? personImage
              : row.type === "chat"
                ? senderImage || personImage
                : undefined;

        return {
          id: row.id,
          title: row.title,
          body: row.body,
          time: relativeTime(row.created_at),
          unread: !row.read,
          type: row.type,
          data: rawData,
          image,
        };
      });
      setItems(mapped);
    } catch (err) {
      setLoadError(
        errorMessageFromUnknown(err, t("common.error", "Something went wrong")),
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadNotifications();
  }, [user?.id]);

  React.useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadNotifications({ refresh: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadNotifications({ refresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (n) =>
        n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
    );
  }, [items, query]);

  const handleDelete = async () => {
    if (!menuForId) return;
    const id = menuForId;
    setItems((prev) => prev.filter((n) => n.id !== id));
    setMenuForId(null);
    setMenuPosition(null);
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("[Notifications] Delete failed:", error.message);
    }
  };

  const markNotificationRead = async (notificationId: string) => {
    if (!user?.id) return;
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId)
        .eq("user_id", user.id);
      if (error) throw error;
      setItems((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, unread: false } : n,
        ),
      );
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t("common.error", "Something went wrong"),
        ),
        durationMs: 3200,
      });
    }
  };

  const handleNotificationPress = (id: string) => {
    void (async () => {
      const item = items.find((n) => n.id === id);
      if (!item) return;
      if (item.unread) {
        await markNotificationRead(id);
      }
      await navigateForNotificationPayloadAsync(
        router,
        {
          type: item.type ?? "",
          data: item.data as Record<string, unknown> | null | undefined,
        },
        { currentUserId: user?.id },
      );
    })();
  };

  const handleKycResubmit = (id: string) => {
    void (async () => {
      const item = items.find((n) => n.id === id);
      if (!item || !isKycRejectionNotification(item)) return;
      if (item.unread) {
        await markNotificationRead(id);
      }
      router.push("/(private)/kyc" as Parameters<typeof router.push>[0]);
    })();
  };

  const hasNotifications = filtered.length > 0;
  const unreadCount = useMemo(
    () => items.filter((n) => n.unread).length,
    [items],
  );
  const badgeCount = unreadCount;

  if (loading) {
    return (
      <PageContainer>
        <BackHeader
          title={t("notifications.title")}
          onBack={() => router.back()}
          className="pl-0"
        />
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
          className="pl-0"
        />
        <ErrorState
          error={loadError}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceContainerLow}
          />
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
                actionLabel={
                  isKycRejectionNotification(n)
                    ? t("notifications.kycResubmit", "Resubmit")
                    : undefined
                }
                onActionPress={
                  isKycRejectionNotification(n) ? handleKycResubmit : undefined
                }
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
          <IllustratedEmptyState
            title={t("notifications.emptyTitle")}
            message={t("notifications.emptySubtitle")}
            mode="full"
            illustration={{
              ...IllustratedEmptyStateIllustrations.noNotification,
              style: [
                IllustratedEmptyStateIllustrations.noNotification.style,
                styles.emptyIllustration,
              ],
            }}
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
