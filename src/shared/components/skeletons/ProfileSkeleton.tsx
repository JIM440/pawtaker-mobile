import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { Skeleton } from '@/src/shared/components/ui/Skeleton';

export function ProfileSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainer;

  return (
    <View style={styles.container}>
      {/* Header: title + actions */}
      <View style={styles.header}>
        <Skeleton height={24} width={80} />
        <View style={styles.headerActions}>
          <Skeleton height={18} width={70} borderRadius={4} />
          <Skeleton height={24} width={24} borderRadius={4} />
        </View>
      </View>

      <View style={styles.scroll}>
        {/* Profile head */}
        <View style={styles.profileHead}>
          <View style={[styles.avatarWrap]}>
            <Skeleton width={96} height={96} borderRadius={48} />
          </View>
          <Skeleton height={24} width={100} borderRadius={999} style={styles.availablePill} />
          <Skeleton height={28} width={160} style={{ marginTop: 12 }} />
          <View style={styles.locationRow}>
            <Skeleton height={16} width={180} style={{ marginTop: 8 }} />
          </View>
          <View style={styles.statsRow}>
            <Skeleton height={32} width={72} borderRadius={999} />
            <View style={styles.statPills}>
              <Skeleton height={32} width={40} borderRadius={16} />
              <Skeleton height={32} width={40} borderRadius={16} />
            </View>
            <Skeleton height={32} width={44} borderRadius={999} />
          </View>
          <Skeleton height={20} width={200} borderRadius={4} style={{ marginTop: 12 }} />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <Skeleton height={36} width={88} borderRadius={4} />
          <Skeleton height={36} width={100} borderRadius={4} />
          <Skeleton height={36} width={80} borderRadius={4} />
          <Skeleton height={36} width={72} borderRadius={4} />
        </View>

        {/* Tab content area */}
        <View style={styles.tabContent}>
          <View style={[styles.contentCard, { backgroundColor: bg }]}>
            <Skeleton height={120} width="100%" borderRadius={12} />
          </View>
          <View style={[styles.contentCard, { backgroundColor: bg }]}>
            <Skeleton height={80} width="100%" borderRadius={12} />
          </View>
          <View style={[styles.contentCard, { backgroundColor: bg }]}>
            <Skeleton height={100} width="100%" borderRadius={12} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  scroll: {
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  profileHead: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrap: {
    marginBottom: 8,
  },
  availablePill: {
    marginTop: 4,
  },
  locationRow: {
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 12,
  },
  statPills: {
    flexDirection: 'row',
    gap: 8,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 8,
  },
  tabContent: {
    gap: 12,
  },
  contentCard: {
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 80,
  },
});
