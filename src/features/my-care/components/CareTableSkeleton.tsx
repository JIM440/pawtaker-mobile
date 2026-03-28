import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  colors: any;
  rowCount?: number;
};

export function CareTableSkeleton({ colors, rowCount = 5 }: Props) {
  return (
    <View style={styles.tableContainer}>
      <View style={styles.tableSubHeader}>
        <Skeleton height={12} width={92} borderRadius={4} />
        <Skeleton height={12} width={40} borderRadius={4} />
        <Skeleton height={12} width={60} borderRadius={4} />
        <Skeleton height={12} width={52} borderRadius={4} />
      </View>

      {Array.from({ length: rowCount }).map((_, idx) => (
        <View
          key={idx}
          style={[
            styles.tableBodyRow,
            { borderBottomColor: colors.outlineVariant },
          ]}
        >
          <View style={styles.colOwner}>
            <Skeleton height={32} width={32} borderRadius={16} />
            <View style={styles.ownerText}>
              <Skeleton height={12} width={110} borderRadius={4} />
              <View style={styles.miniStatsRow}>
                <Skeleton height={14} width={34} borderRadius={999} />
                <Skeleton height={14} width={34} borderRadius={999} />
              </View>
            </View>
          </View>

          <View style={styles.colPet}>
            <Skeleton height={12} width={40} borderRadius={4} />
          </View>
          <View style={styles.colType}>
            <Skeleton height={12} width={64} borderRadius={4} />
          </View>
          <View style={styles.colDate}>
            <Skeleton height={12} width={54} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    marginHorizontal: -16,
  },
  tableSubHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: "space-between",
    gap: 10,
  },
  tableBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
  },
  colOwner: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 0,
  },
  ownerText: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  miniStatsRow: {
    flexDirection: "row",
    gap: 6,
  },
  colPet: {
    flex: 0.8,
  },
  colType: {
    flex: 1,
  },
  colDate: {
    flex: 0.7,
    alignItems: "flex-end",
  },
});

