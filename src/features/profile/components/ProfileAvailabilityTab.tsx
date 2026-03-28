import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
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
  /** Day labels from wizard (array) or a single joined string (legacy). */
  days?: string | string[];
};

function normalizeDayTokens(days: string | string[] | undefined): string[] {
  if (days == null) return [];
  if (Array.isArray(days)) {
    return days.map((d) => String(d).trim()).filter(Boolean);
  }
  const s = String(days).trim();
  if (!s) return [];
  return s
    .split(/\s*[•|,]\s*|\s*\n\s*/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

type Props = {
  data: AvailabilityData;
  emptyMessage?: string;
};

function SectionCard({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  return <View style={styles.sectionCard}>{children}</View>;
}

export function ProfileAvailabilityTab({ data, emptyMessage }: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const resolvedEmptyMessage =
    emptyMessage ?? t("profile.availability.emptyMessage");
  const emptyTitle = t("profile.availability.emptyTitle");

  const daysTokens = normalizeDayTokens(data.days);
  const hasDaysContent = daysTokens.length > 0;

  const isEffectivelyEmpty =
    !data.note?.trim() &&
    !data.time?.trim() &&
    !hasDaysContent &&
    !data.yardType?.trim() &&
    !data.isPetOwner?.trim() &&
    (data.card.petTypes?.length ?? 0) === 0 &&
    (data.card.services?.length ?? 0) === 0;

  if (isEffectivelyEmpty) {
    return (
      <View style={styles.emptyState}>
        <IllustratedEmptyState
          title={emptyTitle}
          message={resolvedEmptyMessage}
          illustration={IllustratedEmptyStateIllustrations.noAvailability}
          mode="inline"
        />
      </View>
    );
  }

  const PillField = ({
    label,
    values,
    style,
  }: {
    label: string;
    values: string[];
    style?: object;
  }) => (
    <View style={styles.fieldWrap}>
      <View style={[styles.field, style]}>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={styles.label}
        >
          {label}
        </AppText>
        <View style={styles.pillsRow}>
          {(values.length ? values : [resolvedEmptyMessage]).map((v, idx) => (
            <View
              key={`${v}-${idx}`}
              style={[styles.pill, { backgroundColor: colors.surfaceVariant }]}
            >
              <AppText
                variant="caption"
                color={colors.onSurface}
                numberOfLines={1}
              >
                {v}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const noteValue = data.note?.trim() || resolvedEmptyMessage;

  const petOwnerDisplay = (() => {
    const raw = data.isPetOwner?.trim();
    if (!raw) return resolvedEmptyMessage;
    const l = raw.toLowerCase();
    if (l === "yes") return t("post.availability.ownerYes");
    if (l === "no") return t("post.availability.ownerNo");
    return raw;
  })();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.cardStack}>
        <SectionCard>
          {/* Row 1: Pet owner + Pet types */}
          <View style={[styles.row, styles.rowFirst]}>
            <PillField
              label={t("availability.petOwner")}
              values={[petOwnerDisplay]}
            />
            <PillField
              label={t("availability.petTypes")}
              values={(data.card.petTypes ?? []).filter(Boolean)}
            />
          </View>

          {/* Row 2: Care types + Yard type */}
          <View style={styles.row}>
            <PillField
              label={t("availability.careTypes")}
              values={(data.card.services ?? []).filter(Boolean)}
            />
            <PillField
              label={t("availability.yardType")}
              values={[data.yardType?.trim() || resolvedEmptyMessage]}
            />
          </View>

          {/* Row 3: Dates + Time (same line) */}
          <View style={styles.row}>
            <View style={styles.fieldWrap}>
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.label}
              >
                {t("availability.dates")}
              </AppText>
              <View style={styles.dateChipsRow}>
                {(daysTokens.length ? daysTokens : [resolvedEmptyMessage]).map(
                  (d, idx) => (
                    <View
                      key={`${d}-${idx}`}
                      style={[
                        styles.dateChip,
                        { backgroundColor: colors.surfaceVariant },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={colors.onSurface}
                        numberOfLines={2}
                        style={styles.dateChipText}
                      >
                        {d}
                      </AppText>
                    </View>
                  ),
                )}
              </View>
            </View>
            <View style={styles.fieldWrap}>
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.label}
              >
                {t("availability.timeOnly")}
              </AppText>
              <View style={styles.noteBox}>
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  style={styles.noteText}
                >
                  {data.time || resolvedEmptyMessage}
                </AppText>
              </View>
            </View>
          </View>

          {/* Row 4: Note */}
          <View style={styles.rowSingle}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.label}
            >
              {t("availability.note")}
            </AppText>
            <View style={styles.noteBox}>
              <AppText
                variant="body"
                color={colors.onSurface}
                style={styles.noteText}
              >
                {noteValue}
              </AppText>
            </View>
          </View>
        </SectionCard>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  emptyState: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
  },
  cardStack: {
    gap: 12,
    paddingBottom: 40,
  },
  sectionCard: {
    flex: 1,
    minWidth: 0,
    gap: 12,
  },
  field: {
    gap: 4,
  },
  fieldWrap: {
    flex: 1,
    minWidth: 0,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  pill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  rowFirst: {
    marginTop: 0,
  },
  rowSingle: {
    marginTop: 12,
  },
  dateChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    alignItems: "center",
    alignContent: "flex-start",
  },
  dateChip: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 30,
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
    maxWidth: "100%",
  },
  dateChipText: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  noteBox: {
    marginTop: 6,
    // borderWidth: 1,
    borderRadius: 12,
    // paddingHorizontal: 12,
    // paddingVertical: 10,
  },
  noteBoxInline: {
    minHeight: 44,
    justifyContent: "center",
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
