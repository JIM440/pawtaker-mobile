import {
  PET_GRID_COLUMNS,
  PET_GRID_GAP,
} from "@/src/constants/pet-grid";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import React from "react";
import { StyleSheet, View } from "react-native";

type PetSelectGridSkeletonProps = {
  /** Same width as `PetGridTile` / `getPetGridColumnWidth`. */
  columnWidth: number;
  /** Number of full rows (3 tiles each). Default 2 → 6 placeholders. */
  rowCount?: number;
};

function PetGridTileSkeleton({ columnWidth }: { columnWidth: number }) {
  const radius = Math.min(20, columnWidth * 0.2);
  return (
    <View style={[styles.tile, { width: columnWidth }]}>
      <Skeleton
        width={columnWidth}
        height={columnWidth}
        borderRadius={radius}
      />
      <Skeleton
        height={12}
        width={Math.round(columnWidth * 0.78)}
        borderRadius={4}
        style={styles.nameLine}
      />
      <Skeleton
        height={12}
        width={Math.round(columnWidth * 0.55)}
        borderRadius={4}
      />
    </View>
  );
}

/**
 * Loading placeholders for the launch-request “Select pet” grid (3 columns / row).
 */
export function PetSelectGridSkeleton({
  columnWidth,
  rowCount = 2,
}: PetSelectGridSkeletonProps) {
  return (
    <View style={styles.petGrid}>
      {Array.from({ length: rowCount }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.petRow}>
          {Array.from({ length: PET_GRID_COLUMNS }).map((_, colIndex) => (
            <PetGridTileSkeleton
              key={colIndex}
              columnWidth={columnWidth}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  petGrid: {
    width: "100%",
    gap: PET_GRID_GAP,
  },
  petRow: {
    flexDirection: "row",
    gap: PET_GRID_GAP,
    justifyContent: "flex-start",
    width: "100%",
  },
  tile: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  nameLine: {
    marginTop: 0,
  },
});
