import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';

export type ChatRowProps = {
  threadId: string;
  avatarUri?: string | null;
  name: string;
  lastMessagePreview: string;
  timestamp: string;
  unreadCount?: number;
  onPress?: () => void;
};

export function ChatRow({
  avatarUri,
  name,
  lastMessagePreview,
  timestamp,
  unreadCount = 0,
  onPress,
}: ChatRowProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.row}
    >
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <AppImage source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceContainer }]} />
        )}
      </View>
      <View style={styles.content}>
        <AppText variant="label" numberOfLines={1} style={styles.name}>{name}</AppText>
        <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={1} style={styles.preview}>
          {lastMessagePreview}
        </AppText>
      </View>
      <View style={styles.right}>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.time}>
          {timestamp}
        </AppText>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.error }]}>
            <AppText variant="caption" color={colors.onError} style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </AppText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    marginBottom: 2,
  },
  preview: {
    fontSize: 12,
    lineHeight: 16,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 11,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
