import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useThreads } from "@/src/features/messages/hooks/useThreads";
import {
  getLastMessagePreviewKind,
  type LastMessagePreviewKind,
} from "@/src/features/messages/lastMessagePreview";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
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
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useRef, useState } from "react";
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
  previewKind: LastMessagePreviewKind;
  previewSentByYou: boolean;
  searchText: string;
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
  const { threads, loading, error: threadsError, refetch } = useThreads();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const skipNextFocusRefetch = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (skipNextFocusRefetch.current) {
        skipNextFocusRefetch.current = false;
        return;
      }
      void refetch({ silent: true });
    }, [refetch]),
  );

  const chats: ChatListItem[] = useMemo(() => {
    const photoLabel = t("messages.lastMessagePhoto", "Photo").toLowerCase();
    const documentLabel = t("messages.attachDocument", "Document").toLowerCase();
    return threads.map((item) => {
      const other = item.other_user;
      const isMine = item.last_sender_id === user?.id;
      const rawPreview = item.last_message_preview?.trim();
      const previewKind = rawPreview ? getLastMessagePreviewKind(rawPreview) : "text";
      const preview = rawPreview
        ? previewKind !== "text"
          ? ""
          : `${isMine ? t("messages.youPrefix", "You: ") : ""}${rawPreview}`
        : t("messages.noMessagesYet", "No messages yet.");
      const searchText = [
        resolveDisplayName(other) || t("common.user", "User"),
        rawPreview
          ? previewKind === "image"
            ? `${isMine ? "you" : ""} ${photoLabel}`.trim()
            : previewKind === "document"
              ? `${isMine ? "you" : ""} ${documentLabel}`.trim()
              : preview.toLowerCase()
          : "",
      ]
        .join(" ")
        .toLowerCase();
      return {
        threadId: item.id,
        name: resolveDisplayName(other) || t("common.user", "User"),
        avatarUri: other?.avatar_url ?? null,
        lastMessagePreview: preview,
        previewKind,
        previewSentByYou: Boolean(rawPreview && previewKind !== "text" && isMine),
        searchText,
        timestamp: relativeTime(item.last_message_at),
        unreadCount: item.unreadCount,
      };
    });
  }, [threads, user?.id, t]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const showListSkeleton = loading && threads.length === 0;

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(q) || chat.searchText.includes(q),
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

      {showListSkeleton ? (
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
          {threadsError ? (
            <ErrorState
              error={threadsError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                void refetch();
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
                    previewKind={chat.previewKind}
                    previewSentByYou={chat.previewSentByYou}
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
