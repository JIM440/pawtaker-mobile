import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';
import { Skeleton } from '@/src/shared/components/ui/Skeleton';

function NotificationRowSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Skeleton height={40} width={40} borderRadius={20} />
        <View style={styles.rowContent}>
          <Skeleton height={14} width={180} borderRadius={4} />
          <Skeleton height={12} width="90%" borderRadius={4} style={{ marginTop: 6 }} />
          <Skeleton height={10} width={36} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
      </View>
    </View>
  );
}

export function NotificationsSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.container}>
      {/* Header with back + title */}
      <View style={styles.header}>
        <Skeleton height={24} width={24} borderRadius={4} />
        <Skeleton height={22} width={160} borderRadius={4} style={{ marginLeft: 16 }} />
      </View>

      {/* Search bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainer }]} />

      {/* List */}
      <View style={styles.list}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={styles.itemWrap}>
            <NotificationRowSkeleton />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchBar: {
    height: SearchFilterStyles.searchBarHeight,
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
    marginBottom: 16,
  },
  list: {
    gap: 0,
  },
  itemWrap: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
});
