import { AppText } from "@/src/shared/components/ui/AppText";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { Handshake, PawPrint } from "lucide-react-native";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export interface CareRow {
  id: string;
  personName: string;
  personAvatar: string;
  personId?: string;
  handshakes: number;
  paws: number;
  pet: string;
  petId?: string;
  careType: string;
  date: string;
  contractId?: string;
}

interface CareTableProps {
  colors: any;
  rows: CareRow[];
  headerLabel: string;
  footerText?: React.ReactNode;
  onPressPerson?: (row: CareRow) => void;
  onPressPet?: (row: CareRow) => void;
}

export function CareTable({
  colors,
  rows,
  headerLabel,
  footerText,
  onPressPerson,
  onPressPet,
}: CareTableProps) {
  return (
    <View style={styles.tableContainer}>
      <View style={[styles.tableSubHeader]}>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.colOwner}
        >
          {headerLabel}
        </AppText>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.colPet}
        >
          Pet
        </AppText>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.colType}
        >
          Care type
        </AppText>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.colDate}
        >
          Date
        </AppText>
      </View>
      {rows.map((row) => (
        <View key={row.id} style={styles.tableBodyRow}>
          <Pressable
            style={styles.colOwner}
            onPress={() => onPressPerson?.(row)}
            disabled={!onPressPerson}
          >
            <UserAvatar
              uri={row.personAvatar}
              name={row.personName}
              size={32}
              style={styles.rowAvatar}
            />
            <View style={styles.rowOwnerDetails}>
              <AppText
                variant="body"
                style={{ fontSize: 13, fontWeight: "600", lineHeight: 14 }}
                numberOfLines={1}
              >
                {row.personName}
              </AppText>
              <View style={styles.miniStatsBadge}>
                <View
                  className="flex-row items-center gap-1"
                  style={{
                    backgroundColor: colors.surfaceBright,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <Handshake size={10} color={colors.tertiary} />
                  <AppText variant="caption" style={{ fontSize: 10 }}>
                    {row.handshakes}
                  </AppText>
                </View>
                <View
                  className="flex-row items-center gap-1"
                  style={{
                    backgroundColor: colors.surfaceBright,
                    paddingHorizontal: 4,
                    paddingVertical: 2,
                    borderRadius: 12,
                  }}
                >
                  <PawPrint size={10} color={colors.tertiary} />
                  <AppText variant="caption" style={{ fontSize: 10 }}>
                    {row.paws}
                  </AppText>
                </View>
              </View>
            </View>
          </Pressable>
          <Pressable
            style={styles.colPet}
            onPress={() => onPressPet?.(row)}
            disabled={!onPressPet}
          >
            <AppText variant="caption" numberOfLines={1}>
              {row.pet}
            </AppText>
          </Pressable>
          <AppText variant="caption" style={styles.colType} numberOfLines={1}>
            {row.careType}
          </AppText>
          <AppText variant="caption" style={styles.colDate} numberOfLines={1}>
            {row.date}
          </AppText>
        </View>
      ))}
      {footerText && (
        <View className="py-8 items-center">
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ textAlign: "center" }}
          >
            {footerText}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tableContainer: {
    marginHorizontal: 0,
  },
  tableSubHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableBodyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  colOwner: {
    flex: 2, // Increased as requested
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colPet: {
    flex: 0.8,
  },
  colType: {
    flex: 1,
  },
  colDate: {
    flex: 0.7, // Decreased as requested
    textAlign: "right",
  },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  rowOwnerDetails: {
    flex: 1,
    gap: 2,
  },
  miniStatsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});
