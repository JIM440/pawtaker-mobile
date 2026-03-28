import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { ChatRow, ChatScreenSkeleton } from "@/src/shared/components/chat";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { PageContainer } from "@/src/shared/components/layout";
import {
  ErrorState,
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { useRouter } from "expo-router";
import { Search, SlidersHorizontal } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type ChatListItem = {
  threadId: string;
  name: string;
  avatarUri: string | null;
  lastMessagePreview: string;
  timestamp: string;
  unreadCount: number;
};

function relativeTime(isoDate?: string | null) {
  if (!isoDate) return "";
  const now = Date.now();
  const diffMs = Math.max(0, now - new Date(isoDate).getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(isoDate).toLocaleDateString();
}

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [chats, setChats] = useState<ChatListItem[]>([]);

  React.useEffect(() => {
    void loadChats();
  }, [user?.id]);

  const loadChats = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) {
      setChats([]);
      setLoading(false);
      return;
    }
    if (!opts?.refresh) setLoading(true);
    setLoadError(null);
    try {
      const { data: threads, error: threadsError } = await supabase
        .from("threads")
        .select("id,participant_ids,last_message_at")
        .contains("participant_ids", [user.id])
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (threadsError) throw threadsError;

      const threadIds = (threads ?? []).map((t) => t.id);
      const peerIds = Array.from(
        new Set(
          (threads ?? [])
            .flatMap((t) => (t.participant_ids ?? []) as string[])
            .filter((id) => id && id !== user.id),
        ),
      );

      const [{ data: usersData }, { data: messagesData }] = await Promise.all([
        peerIds.length
          ? supabase
              .from("users")
              .select("id,full_name,avatar_url")
              .in("id", peerIds)
          : Promise.resolve({ data: [] } as any),
        threadIds.length
          ? supabase
              .from("messages")
              .select("id,thread_id,sender_id,content,type,read_at,created_at")
              .in("thread_id", threadIds)
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] } as any),
      ]);

      const usersById = (usersData ?? []).reduce(
        (acc: Record<string, any>, u: any) => {
          acc[u.id] = u;
          return acc;
        },
        {},
      );
      const latestByThread: Record<string, any> = {};
      let unreadByThread: Record<string, number> = {};
      for (const m of messagesData ?? []) {
        if (!latestByThread[m.thread_id]) latestByThread[m.thread_id] = m;
        if (m.sender_id !== user.id && !m.read_at) {
          unreadByThread[m.thread_id] = (unreadByThread[m.thread_id] ?? 0) + 1;
        }
      }

      const nextChats: ChatListItem[] = (threads ?? []).map((thread: any) => {
        const peerId = ((thread.participant_ids ?? []) as string[]).find(
          (id) => id !== user.id,
        );
        const peer = peerId ? usersById[peerId] : null;
        const latest = latestByThread[thread.id];
        return {
          threadId: thread.id,
          name: resolveDisplayName(peer) || t("common.user", "User"),
          avatarUri: peer?.avatar_url ?? null,
          lastMessagePreview:
            latest?.content?.trim() ||
            t("messages.noMessagesYet", "No messages yet."),
          timestamp: relativeTime(latest?.created_at ?? thread.last_message_at),
          unreadCount: unreadByThread[thread.id] ?? 0,
        };
      });

      setChats(nextChats);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : t("common.error", "Something went wrong"),
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadChats({ refresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(q) ||
        chat.lastMessagePreview.toLowerCase().includes(q),
    );
  }, [chats, searchQuery]);

  return (
    <PageContainer>
      <View style={styles.header}>
        <AppText variant="headline" style={ChatTypography.listScreenTitle}>
          {t("messages.chatsTitle")}
        </AppText>
      </View>

      <View style={styles.searchRow}>
        <SearchField
          containerStyle={styles.searchBar}
          placeholder={t("messages.searchChats")}
          value={searchQuery}
          onChangeText={setSearchQuery}
          rightSlot={<Search size={20} color={colors.onSurfaceVariant} />}
        />
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
          hitSlop={8}
        >
          <SlidersHorizontal
            size={SearchFilterStyles.searchIconSize}
            color={colors.onSurface}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ChatScreenSkeleton rowCount={8} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
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
          {loadError ? (
            <ErrorState
              error={loadError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                void loadChats();
              }}
              mode="full"
            />
          ) : (
            <View style={styles.list}>
              {filteredChats.length > 0 ? (
                filteredChats.map((chat) => (
                  <ChatRow
                    key={chat.threadId}
                    threadId={chat.threadId}
                    name={chat.name}
                    avatarUri={chat.avatarUri ?? undefined}
                    lastMessagePreview={chat.lastMessagePreview}
                    timestamp={chat.timestamp}
                    unreadCount={chat.unreadCount}
                    onPress={() =>
                      router.push(`/(private)/(tabs)/messages/${chat.threadId}`)
                    }
                  />
                ))
              ) : (
                <IllustratedEmptyState
                  title={t("messages.noChatsTitle")}
                  message={t("messages.noChatsSubtitle")}
                  illustration={IllustratedEmptyStateIllustrations.noChats}
                  mode="inline"
                />
              )}
            </View>
          )}
        </ScrollView>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingVertical: 8,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 12,
  },
  searchBar: {
    flex: 1,
  },
  filterBtn: {
    width: SearchFilterStyles.filterButtonSize,
    height: SearchFilterStyles.filterButtonSize,
    borderRadius: SearchFilterStyles.filterButtonBorderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    paddingBottom: 40,
  },
});
