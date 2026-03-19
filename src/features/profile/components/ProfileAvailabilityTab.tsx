import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AvailabilityPreviewCard } from "@/src/shared/components/cards";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

const MOCK_AVAILABILITY = {
  avatarUri:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  name: "Jane Ambers",
  rating: 4.1,
  handshakes: 12,
  paws: 17,
  isAvailable: true,
  petTypes: ["Cats", "Dog", "Bird"],
  services: ["Daytime", "Play/walk"],
  location: "Lake Placid, New York, US",
  yardType: "Fenced yard",
  isPetOwner: "Yes",
  note: "Hi there! I'm Bob, a lifelong pet lover with years of experience caring for energetic pups and senior cats alike.",
  time: "08:00 AM - 09:00 PM",
  days: "Sat • Sun",
};

import { CalendarDays, Clock } from "lucide-react-native";

export function ProfileAvailabilityTab() {
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
      <AvailabilityPreviewCard {...MOCK_AVAILABILITY} />

      <View style={styles.details}>
        <View style={styles.bio}>
          {/* Bio / Short note directly below card */}
          <DisplayField
            label={t("availability.note", "Short note")}
            value={MOCK_AVAILABILITY.note}
          />
        </View>

        {/* Time & Days in one line */}
        <View style={styles.row}>
          <DisplayField
            label={t("availability.timeOnly", "Time")}
            value={MOCK_AVAILABILITY.time}
            icon={<Clock size={16} color={colors.primary} />}
            style={{ flex: 1.2 }}
          />
          <DisplayField
            label={t("availability.daysOnly", "Days")}
            value={MOCK_AVAILABILITY.days}
            icon={<CalendarDays size={16} color={colors.primary} />}
            style={{ flex: 1 }}
          />
        </View>

        {/* Yard Type and Pet Owner in one line */}
        <View style={styles.row}>
          <PillField
            label={t("availability.yardType", "Yard Type")}
            value={MOCK_AVAILABILITY.yardType}
            style={{ flex: 1 }}
          />
          <PillField
            label={t("availability.petOwner", "Pet Owner")}
            value={MOCK_AVAILABILITY.isPetOwner}
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

