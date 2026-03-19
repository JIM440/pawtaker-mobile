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
      style={[styles.row, { borderBottomColor: colors.outlineVariant }]}
    >
      <View style={styles.avatarWrap}>
        {avatarUri ? (
          <AppImage source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceDim }]}>
            <AppText variant="label" color={colors.onSurfaceVariant}>
              {name.charAt(0).toUpperCase()}
            </AppText>
          </View>
        )}
      </View>
      <View style={styles.content}>
        <AppText variant="label" numberOfLines={1} style={styles.name}>{name}</AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} numberOfLines={1} style={styles.preview}>
          {lastMessagePreview}
        </AppText>
      </View>
      <View style={styles.right}>
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.time}>
          {timestamp}
        </AppText>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <AppText variant="caption" color={colors.onPrimary} style={styles.badgeText}>
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
    borderBottomWidth: 1,
    gap: 12,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  avatar: {
    width: 56,
    height: 56,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  preview: {
    fontSize: 13,
    lineHeight: 18,
  },
  right: {
    alignItems: 'flex-end',
    minWidth: 40,
    gap: 6,
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
    fontWeight: '700',
  },
});
