import { Colors } from "@/src/constants/colors";
import type { ThreadWithParticipant } from "@/src/features/messages/hooks/useThreads";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { AppText } from "@/src/shared/components/ui/AppText";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { Search } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  currentThreadId: string;
  threads: ThreadWithParticipant[];
  threadsLoading: boolean;
  onClose: () => void;
  onSelectThread: (threadId: string) => void;
};

export function ThreadForwardModal({
  visible,
  currentThreadId,
  threads,
  threadsLoading,
  onClose,
  onSelectThread,
}: Props) {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    return threads
      .filter((th) => th.id !== currentThreadId)
      .map((item) => {
        const other = item.other_user;
        const name = resolveDisplayName(other) || t("common.user", "User");
        return {
          threadId: item.id,
          name,
          avatarUri: other?.avatar_url ?? null,
          searchText: name.toLowerCase(),
        };
      });
  }, [threads, currentThreadId, user?.id, t]);

  const filtered = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.searchText.includes(q));
  }, [rows, query]);

  React.useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceContainer,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <AppText
            variant="headline"
            color={colors.onSurface}
            style={styles.title}
          >
            {t("messages.forwardTitle", "Forward to")}
          </AppText>
          <SearchField
            placeholder={t("messages.searchChats")}
            value={query}
            onChangeText={setQuery}
            rightSlot={<Search size={20} color={colors.onSurfaceVariant} />}
            containerStyle={styles.search}
          />
          {threadsLoading ? (
            <View style={styles.loader}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.threadId}
              style={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => onSelectThread(item.threadId)}
                >
                  <UserAvatar
                    uri={item.avatarUri}
                    name={item.name}
                    size={44}
                  />
                  <AppText
                    variant="body"
                    color={colors.onSurface}
                    style={styles.rowName}
                    numberOfLines={1}
                  >
                    {item.name}
                  </AppText>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  style={styles.empty}
                >
                  {t("messages.forwardNoChats", "No other conversations yet.")}
                </AppText>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    maxWidth: 400,
    width: "100%",
    height: 440,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  title: {
    textAlign: "center",
    marginBottom: 12,
  },
  search: {
    marginBottom: 8,
  },
  list: {
    flex: 1,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  rowName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  empty: {
    textAlign: "center",
    paddingVertical: 24,
  },
});
