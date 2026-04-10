import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

export function ContractDetailSkeleton() {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Carousel Skeleton */}
        <View style={styles.carouselSk}>
          <Skeleton height={216} width="100%" borderRadius={16} />
        </View>

        {/* Header Section Skeleton */}
        <View style={styles.headerSk}>
          <Skeleton height={28} width="60%" borderRadius={8} />
          <Skeleton height={14} width="80%" borderRadius={6} />
          <Skeleton height={14} width="40%" borderRadius={6} />
          <Skeleton height={60} width="100%" borderRadius={12} style={{ marginTop: 8 }} />
        </View>

        {/* Detail Pills Skeleton */}
        <View style={styles.pillsSk}>
          <Skeleton height={18} width={80} borderRadius={4} />
          <View style={styles.pillsRow}>
            <Skeleton height={36} width={80} borderRadius={20} />
            <Skeleton height={36} width={80} borderRadius={20} />
            <Skeleton height={36} width={80} borderRadius={20} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  carouselSk: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  headerSk: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  cardsSk: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
  },
  takerCardSk: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  takerCardBody: {
    flex: 1,
    gap: 8,
  },
  pillsSk: {
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
