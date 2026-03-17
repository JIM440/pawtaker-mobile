import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';
import { PageContainer } from '@/src/shared/components/layout';
import { AppText } from '@/src/shared/components/ui/AppText';
import { ChatRow, ChatRowSkeleton } from '@/src/shared/components/chat';
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
  const [loading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <PageContainer scrollable edges={['top', 'left', 'right']}>
      <AppText variant="headline" style={styles.title}>
        Chats
      </AppText>

      {loading ? (
        <>
          <View style={[styles.searchSkeleton, { backgroundColor: colors.surfaceContainer }]} />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ChatRowSkeleton key={i} />
          ))}
        </>
      ) : (
        <>
          <View style={styles.searchRow}>
            <SearchField
              containerStyle={styles.searchBar}
              placeholder={t("messages.searchChats")}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={[styles.filterBtn, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
              <SlidersHorizontal size={SearchFilterStyles.searchIconSize} color={colors.onSurface} />
            </View>
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
  title: {
    fontSize: 22,
    letterSpacing: -0.1,
    marginBottom: 16,
  },
  searchSkeleton: {
    height: SearchFilterStyles.searchBarHeight,
    width: '100%',
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
    marginBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SearchFilterStyles.searchBarGap,
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    height: SearchFilterStyles.searchBarHeight,
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: SearchFilterStyles.searchBarPaddingHorizontal,
    paddingRight: SearchFilterStyles.searchBarPaddingRight,
    gap: SearchFilterStyles.searchBarGap,
  },
  searchInput: {
    flex: 1,
    fontSize: SearchFilterStyles.searchInputFontSize,
    paddingVertical: 12,
  },
  filterBtn: {
    width: SearchFilterStyles.filterButtonSize,
    height: SearchFilterStyles.filterButtonSize,
    borderRadius: SearchFilterStyles.filterButtonBorderRadius,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingBottom: 24,
  },
});
