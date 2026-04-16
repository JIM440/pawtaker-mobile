import { ArrowLeft, Forward, Trash2 } from "lucide-react-native";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  colors: Record<string, string>;
  styles: {
    header: object;
    backBtn: object;
    selectionHeaderSpacer: object;
    selectionHeaderActions: object;
    selectionHeaderIconBtn: object;
  };
  selectedCount: number;
  showDelete: boolean;
  onBack: () => void;
  onForward: () => void;
  onDelete: () => void;
};

export function ThreadSelectionHeader({
  colors,
  styles,
  selectedCount,
  showDelete,
  onBack,
  onForward,
  onDelete,
}: Props) {
  return (
    <View style={[styles.header, { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
        <ArrowLeft size={24} color={colors.onSurface} />
      </TouchableOpacity>
      <Text style={{ flex: 1, color: colors.onSurface, fontSize: 16, fontWeight: "600", marginLeft: 4 }}>
        {selectedCount}
      </Text>
      <View style={styles.selectionHeaderActions}>
        <TouchableOpacity
          onPress={onForward}
          style={styles.selectionHeaderIconBtn}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Forward"
        >
          <Forward size={24} color={colors.onSurface} />
        </TouchableOpacity>
        {showDelete ? (
          <TouchableOpacity
            onPress={onDelete}
            style={styles.selectionHeaderIconBtn}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Delete"
          >
            <Trash2 size={24} color={colors.onSurface} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
