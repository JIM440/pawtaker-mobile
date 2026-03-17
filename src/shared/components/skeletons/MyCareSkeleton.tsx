import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { Skeleton } from '@/src/shared/components/ui/Skeleton';

export function MyCareSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainer;

  return (
    <View style={styles.container}>
      {/* Header: title + available row */}
      <View style={styles.header}>
        <Skeleton height={28} width={120} />
        <View style={styles.availableRow}>
          <Skeleton height={24} width={80} borderRadius={4} />
          <Skeleton height={28} width={52} borderRadius={14} />
        </View>
      </View>

      {/* In care card */}
      <View style={[styles.inCareCard, { backgroundColor: colors.surfaceContainerLowest }]}>
        <Skeleton height={14} width={60} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton height={22} width={140} borderRadius={4} style={{ marginBottom: 8 }} />
        <View style={styles.tagsRow}>
          <Skeleton height={24} width={70} borderRadius={999} />
          <Skeleton height={24} width={60} borderRadius={999} />
        </View>
        <View style={styles.caregiverRow}>
          <Skeleton height={24} width={24} borderRadius={12} />
          <Skeleton height={16} width={100} borderRadius={4} style={{ marginLeft: 8 }} />
        </View>
        <Skeleton height={12} width={80} borderRadius={4} style={{ marginTop: 8 }} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.surfaceContainerLowest }]}>
            <Skeleton height={20} width={20} borderRadius={10} />
            <Skeleton height={24} width={40} borderRadius={4} style={{ marginTop: 8 }} />
            <Skeleton height={12} width={50} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <Skeleton height={36} width={90} borderRadius={4} />
        <Skeleton height={36} width={100} borderRadius={4} />
        <Skeleton height={36} width={60} borderRadius={4} />
      </View>

      {/* Table / content area */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Skeleton height={12} width={70} borderRadius={4} />
          <Skeleton height={12} width={40} borderRadius={4} />
          <Skeleton height={12} width={60} borderRadius={4} />
          <Skeleton height={12} width={45} borderRadius={4} />
        </View>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.tableRow, { borderBottomColor: colors.outlineVariant }]}>
            <View style={styles.colOwner}>
              <Skeleton height={32} width={32} borderRadius={16} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Skeleton height={12} width={80} borderRadius={4} />
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                  <Skeleton height={10} width={16} borderRadius={2} />
                  <Skeleton height={10} width={16} borderRadius={2} />
                </View>
              </View>
            </View>
            <Skeleton height={12} width={40} borderRadius={4} />
            <Skeleton height={12} width={60} borderRadius={4} />
            <Skeleton height={12} width={50} borderRadius={4} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inCareCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  caregiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    borderBottomWidth: 1,
    paddingBottom: 8,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    gap: 12,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  colOwner: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
});
