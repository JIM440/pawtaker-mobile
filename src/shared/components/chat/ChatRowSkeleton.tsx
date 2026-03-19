import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/src/shared/components/ui/Skeleton';

export function ChatRowSkeleton() {
  return (
    <View style={styles.row}>
      <Skeleton width={56} height={56} borderRadius={28} />
      <View style={styles.content}>
        <Skeleton height={16} width={120} style={{ marginBottom: 6 }} />
        <Skeleton height={14} width="90%" />
      </View>
      <View style={styles.right}>
        <Skeleton height={12} width={30} style={{ marginBottom: 8 }} />
        <Skeleton height={18} width={18} borderRadius={9} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  right: {
    alignItems: 'flex-end',
    minWidth: 40,
  },
});
