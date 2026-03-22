import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';
import { PageContainer } from '@/src/shared/components/layout';
import { AppText } from '@/src/shared/components/ui/AppText';
import { ChatScreenSkeleton, ChatRow } from '@/src/shared/components/chat';
import { ChatTypography } from '@/src/constants/chatTypography';
import { SearchField } from '@/src/shared/components/forms/SearchField';

const MOCK_CHATS = [
  {
    threadId: '1',
    name: 'Alice Morgan',
    avatarUri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    lastMessagePreview: 'can we conclude the booking for next week?',
    timestamp: '12m',
    unreadCount: 2,
  },
  {
    threadId: '2',
    name: 'Bob Majors',
    avatarUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
    lastMessagePreview: "yes, i'll be available",
    timestamp: '1h',
    unreadCount: 0,
  },
  {
    threadId: '3',
    name: 'Jude Meyer',
    avatarUri: null,
    lastMessagePreview: 'Hello there. waiting for a response pls',
    timestamp: '2h',
    unreadCount: 1,
  },
  {
    threadId: '4',
    name: 'Elsa Mago',
    avatarUri: null,
    lastMessagePreview: 'Thanks for confirming!',
    timestamp: 'Yesterday',
    unreadCount: 1,
  },
  {
    threadId: '5',
    name: 'James Alvarez',
    avatarUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    lastMessagePreview: 'See you then.',
    timestamp: 'Mon',
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulate premium loading state
  React.useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageContainer scrollable={!loading}>
      {loading ? (
        <ChatScreenSkeleton rowCount={8} />
      ) : (
        <>
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
              style={[styles.filterBtn, { backgroundColor: colors.surfaceContainerHighest }]}
              hitSlop={8}
            >
              <SlidersHorizontal size={SearchFilterStyles.searchIconSize} color={colors.onSurface} />
            </TouchableOpacity>
          </View>

          <View style={styles.list}>
            {MOCK_CHATS.map((chat) => (
              <ChatRow
                key={chat.threadId}
                threadId={chat.threadId}
                name={chat.name}
                avatarUri={chat.avatarUri ?? undefined}
                lastMessagePreview={chat.lastMessagePreview}
                timestamp={chat.timestamp}
                unreadCount={chat.unreadCount}
                onPress={() => router.push(`/(private)/(tabs)/messages/${chat.threadId}`)}
              />
            ))}
          </View>
        </>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 40,
  },
});
