import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';

export function ChatRowSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainer;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: bg }]} />
      <View style={styles.content}>
        <View style={[styles.line1, { backgroundColor: bg }]} />
        <View style={[styles.line2, { backgroundColor: bg }]} />
      </View>
      <View style={[styles.time, { backgroundColor: bg }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 11,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    gap: 12,
  },
  line1: {
    height: 14,
    width: 185,
    borderRadius: 999,
  },
  line2: {
    height: 9,
    width: 240,
    borderRadius: 999,
  },
  time: {
    height: 9,
    width: 22,
    borderRadius: 999,
  },
});
