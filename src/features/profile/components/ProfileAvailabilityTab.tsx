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

function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: colors.surfaceBright,
          borderColor: colors.outlineVariant,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function ProfileAvailabilityTab({
  data,
  emptyMessage,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const resolvedEmptyMessage =
    emptyMessage ?? t("profile.availability.emptyMessage");
  const emptyTitle = t("profile.availability.emptyTitle", "No availability yet");

  const isEffectivelyEmpty =
    !data.note?.trim() &&
    !data.time?.trim() &&
    !data.days?.trim() &&
    !data.yardType?.trim() &&
    !data.isPetOwner?.trim() &&
    (data.card.petTypes?.length ?? 0) === 0 &&
    (data.card.services?.length ?? 0) === 0;

  if (isEffectivelyEmpty) {
    return (
      <View style={styles.container}>
        <AppText variant="title" color={colors.onSurface} style={styles.emptyTitle}>
          {emptyTitle}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={styles.emptyMessage}
        >
          {resolvedEmptyMessage}
        </AppText>
      </View>
    );
  }

  const DisplayField = ({
    label,
    value,
    style,
    icon,
  }: {
    label: string;
    value: string;
    style?: object;
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
    style?: object;
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
        <AppText variant="caption" color={colors.onSurface}>
          {value}
        </AppText>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AvailabilityPreviewCard {...data.card} />

      <View style={styles.cardStack}>
        <SectionCard>
          <DisplayField
            label={t("availability.note", "Short note")}
            value={data.note?.trim() || resolvedEmptyMessage}
          />
        </SectionCard>

        <View style={styles.row}>
          <SectionCard>
            <DisplayField
              label={t("availability.timeOnly", "Time")}
              value={data.time || resolvedEmptyMessage}
              icon={<Clock size={16} color={colors.primary} />}
            />
          </SectionCard>
          <SectionCard>
            <DisplayField
              label={t("availability.daysOnly", "Days")}
              value={data.days || resolvedEmptyMessage}
              icon={<CalendarDays size={16} color={colors.primary} />}
            />
          </SectionCard>
        </View>

        <View style={styles.row}>
          <SectionCard>
            <PillField
              label={t("availability.yardType", "Yard Type")}
              value={data.yardType || resolvedEmptyMessage}
            />
          </SectionCard>
          <SectionCard>
            <PillField
              label={t("availability.petOwner", "Pet Owner")}
              value={data.isPetOwner || resolvedEmptyMessage}
            />
          </SectionCard>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardStack: {
    marginTop: 16,
    gap: 12,
    paddingBottom: 40,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    flex: 1,
    minWidth: 0,
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
    gap: 12,
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
    flex: 1,
  },
});
