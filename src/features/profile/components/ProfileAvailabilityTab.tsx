import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AvailabilityPreviewCard } from "@/src/shared/components/cards";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CalendarDays, Clock } from "lucide-react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

type AvailabilityData = {
  card: {
    avatarUri: string | null;
    name: string;
    rating: number;
    handshakes: number;
    paws: number;
    isAvailable: boolean;
    petTypes: string[];
    services: string[];
    location: string;
  };
  yardType?: string;
  isPetOwner?: string;
  note?: string;
  time?: string;
  days?: string;
};

type Props = {
  data: AvailabilityData;
  emptyMessage?: string;
};

export function ProfileAvailabilityTab({
  data,
  emptyMessage = "No availability details yet.",
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const DisplayField = ({
    label,
    value,
    style,
    icon,
  }: {
    label: string;
    value: string;
    style?: any;
    icon?: React.ReactNode;
  }) => (
    <View style={[styles.field, style]}>
      <AppText
        variant="caption"
        color={colors.onSurfaceVariant}
        style={styles.label}
      >
        {label}
      </AppText>
      <View style={styles.iconContentRow}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <AppText variant="body" color={colors.onSurface} style={styles.content}>
          {value}
        </AppText>
      </View>
    </View>
  );

  const PillField = ({
    label,
    value,
    style,
  }: {
    label: string;
    value: string;
    style?: any;
  }) => (
    <View style={[styles.field, style]}>
      <AppText
        variant="caption"
        color={colors.onSurfaceVariant}
        style={styles.label}
      >
        {label}
      </AppText>
      <View
        style={[styles.pill, { backgroundColor: colors.surfaceVariant }]}
      >
        <AppText
          variant="caption"
          color={colors.onSurface}
        >
          {value}
        </AppText>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AvailabilityPreviewCard {...data.card} />

      <View style={styles.details}>
        <View style={styles.bio}>
          {/* Bio / Short note directly below card */}
          <DisplayField
            label={t("availability.note", "Short note")}
            value={data.note?.trim() || emptyMessage}
          />
        </View>

        {/* Time & Days in one line */}
        <View style={styles.row}>
          <DisplayField
            label={t("availability.timeOnly", "Time")}
            value={data.time || emptyMessage}
            icon={<Clock size={16} color={colors.primary} />}
            style={{ flex: 1.2 }}
          />
          <DisplayField
            label={t("availability.daysOnly", "Days")}
            value={data.days || emptyMessage}
            icon={<CalendarDays size={16} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Yard Type and Pet Owner in one line */}
        <View style={styles.row}>
          <PillField
            label={t("availability.yardType", "Yard Type")}
            value={data.yardType || emptyMessage}
            style={{ flex: 1 }}
          />
          <PillField
            label={t("availability.petOwner", "Pet Owner")}
            value={data.isPetOwner || emptyMessage}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bio: {
    paddingBottom: 16
  },
  container: {
    paddingHorizontal: 16,
  },
  details: {
    marginTop: 20,
    gap: 16,
    paddingBottom: 40,
  },
  field: {
    gap: 4,
  },
  iconContentRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    marginRight: 8,
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    gap: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  content: {
    lineHeight: 22,
    fontSize: 14,
  },
});

