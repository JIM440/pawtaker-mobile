import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { SearchFilterStyles } from '@/src/constants/searchFilter';
import { Skeleton } from '@/src/shared/components/ui/Skeleton';

const CARD_IMAGE_HEIGHT = 160;
const CARD_BODY_LINE_HEIGHT = 12;
const CARD_RADIUS = 20;

function PetCardSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const bg = colors.surfaceContainer;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceBright }]}>
      <View style={[styles.cardImage, { backgroundColor: bg }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Skeleton height={CARD_BODY_LINE_HEIGHT} width={120} />
          <Skeleton height={24} width={24} borderRadius={12} />
        </View>
        <Skeleton height={CARD_BODY_LINE_HEIGHT} width="80%" style={styles.cardLine} />
        <Skeleton height={CARD_BODY_LINE_HEIGHT} width={180} style={styles.cardLine} />
        <View style={styles.cardMeta}>
          <Skeleton height={CARD_BODY_LINE_HEIGHT} width={60} />
          <Skeleton height={CARD_BODY_LINE_HEIGHT} width={80} />
        </View>
        <View style={[styles.caretakerRow, { marginTop: 8 }]}>
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
      {/* Header row: title + bell placeholder */}
      <View style={styles.headerRow}>
        <Skeleton height={28} width={140} />
        <Skeleton height={24} width={24} borderRadius={12} />
      </View>

      {/* Search + filter */}
      <View style={styles.searchFilterRow}>
        <View style={[styles.searchBar, { backgroundColor: bg }]} />
        <View style={[styles.filterButton, { backgroundColor: bg }]} />
      </View>

      {/* Filter tabs */}
      <View style={styles.filterTabsRow}>
        <Skeleton height={36} width={72} borderRadius={999} />
        <Skeleton height={36} width={88} borderRadius={999} />
        <Skeleton height={36} width={72} borderRadius={999} />
      </View>

      {/* Section title */}
      <View style={styles.sectionTitleRow}>
        <Skeleton height={18} width={160} />
        <Skeleton height={14} width={60} style={{ marginLeft: 8 }} />
      </View>

      {/* Pet cards */}
      {[1, 2, 3].map((i) => (
        <PetCardSkeleton key={i} />
      ))}
    </View>
  );
}

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
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    height: SearchFilterStyles.searchBarHeight,
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
  },
  filterButton: {
    width: SearchFilterStyles.filterButtonSize,
    height: SearchFilterStyles.filterButtonSize,
    borderRadius: SearchFilterStyles.filterButtonBorderRadius,
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLine: {
    marginTop: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  caretakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
