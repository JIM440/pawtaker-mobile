import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';
import { Skeleton } from '@/src/shared/components/ui/Skeleton';

const CARD_IMAGE_HEIGHT = 180;
const CARD_BODY_LINE_HEIGHT = 12;
const CARD_RADIUS = 20;

function PetCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainerHighest;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceBright }]}>
      <Skeleton height={CARD_IMAGE_HEIGHT} width="100%" borderRadius={0} />
      <View style={styles.cardBody}>
        <View style={styles.metaTopRow}>
          <Skeleton height={22} width={84} borderRadius={999} />
          <Skeleton height={22} width={74} borderRadius={999} />
        </View>
        <View style={styles.cardTitleRow}>
          <Skeleton height={18} width={140} />
          <Skeleton height={24} width={24} borderRadius={12} />
        </View>
        <Skeleton height={CARD_BODY_LINE_HEIGHT} width="86%" style={styles.cardLine} />
        <Skeleton height={CARD_BODY_LINE_HEIGHT} width="72%" style={styles.cardLine} />
        <View style={styles.cardMetaRow}>
          <Skeleton height={10} width={90} />
          <Skeleton height={10} width={48} />
        </View>
        <View style={[styles.caretakerRow, { marginTop: 10 }]}>
          <Skeleton height={28} width={28} borderRadius={14} />
          <Skeleton height={CARD_BODY_LINE_HEIGHT} width={100} style={{ marginLeft: 8 }} />
        </View>
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainer;

  return (
    <View style={styles.container}>
      {/* Header row: app name + notification icon/badge */}
      <View style={styles.headerRow}>
        <Skeleton height={28} width={110} />
        <View>
          <Skeleton height={24} width={24} borderRadius={12} />
          <Skeleton height={14} width={14} borderRadius={7} style={styles.badgeDot} />
        </View>
      </View>

      {/* Search + filter */}
      <View style={styles.searchFilterRow}>
        <Skeleton height={SearchFilterStyles.searchBarHeight} width="100%" style={styles.searchBar} />
        <Skeleton
          height={SearchFilterStyles.filterButtonSize}
          width={SearchFilterStyles.filterButtonSize}
          borderRadius={SearchFilterStyles.filterButtonBorderRadius}
        />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabsRow}>
        <Skeleton height={36} width={58} borderRadius={999} />
        <Skeleton height={36} width={88} borderRadius={999} />
        <Skeleton height={36} width={74} borderRadius={999} />
      </View>

      {/* Section title */}
      <View style={styles.sectionTitleRow}>
        <Skeleton height={18} width={132} />
        <Skeleton height={12} width={78} style={{ marginLeft: 8 }} />
      </View>

      {/* Pet cards */}
      {[1, 2, 3].map((i) => (
        <PetCardSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * Skeleton rows that match the pet-card feed layout,
 * without duplicating the Home header/search/filter UI.
 */
export function FeedRequestsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ paddingBottom: 24 }}>
      {[...Array(count)].map((_, i) => (
        <PetCardSkeleton key={i} />
      ))}
    </View>
  );
}

/** Horizontal taker row: avatar + text (matches `TakerCard` density). */
function TakerRowSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View
      style={[takerSkStyles.row, { backgroundColor: colors.surfaceBright }]}
    >
      <Skeleton height={64} width={64} borderRadius={32} />
      <View style={takerSkStyles.col}>
        <Skeleton height={16} width="55%" borderRadius={6} />
        <Skeleton height={12} width="40%" borderRadius={4} style={{ marginTop: 8 }} />
        <View style={takerSkStyles.chips}>
          <Skeleton height={24} width={72} borderRadius={999} />
          <Skeleton height={24} width={88} borderRadius={999} />
        </View>
      </View>
    </View>
  );
}

export function FeedTakersSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={{ paddingBottom: 24, gap: 12 }}>
      {[...Array(count)].map((_, i) => (
        <TakerRowSkeleton key={i} />
      ))}
    </View>
  );
}

const takerSkStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  col: {
    flex: 1,
    minWidth: 0,
  },
  chips: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
});

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    marginBottom: 8,
  },
  cardImage: {
    width: '100%',
    height: CARD_IMAGE_HEIGHT,
  },
  cardBody: {
    padding: 16,
  },
  metaTopRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLine: {
    marginTop: 8,
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  caretakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    position: 'absolute',
    right: -4,
    top: -2,
  },
});
