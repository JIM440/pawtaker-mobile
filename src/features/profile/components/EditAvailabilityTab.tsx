import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { AvailabilityPreviewCard } from "@/src/shared/components/cards";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import {
  Briefcase,
  Moon,
  PawPrint,
  Sun
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, Switch, TouchableOpacity, View } from "react-native";

type Props = {
  onSave?: () => void;
};

export function EditAvailabilityTab({ onSave }: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [available, setAvailable] = useState(true);
  const [services, setServices] = useState<string[]>(["daytime", "playwalk"]);
  const [days, setDays] = useState<string[]>(["Sa", "Su"]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [endTime, setEndTime] = useState<Date>(() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d;
  });
  const [petOwner, setPetOwner] = useState<"yes" | "no">("yes");
  const [yardType, setYardType] = useState("fenced yard");
  const [petKinds, setPetKinds] = useState<string[]>(["dog", "cat"]);
  const [note, setNote] = useState(
    "Hi there! I'm Bob, a lifelong pet lover with years of experience caring for energetic pups and senior cats alike.",
  );

  const toggleService = (key: string) => {
    setServices((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key],
    );
  };

  const toggleDay = (label: string) => {
    setDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  const togglePetKind = (key: string) => {
    setPetKinds((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <AppText variant="body" color={colors.onSurface}>
          {t("availability.available", "Available")}
        </AppText>
        <Switch
          value={available}
          onValueChange={setAvailable}
          trackColor={{
            false: colors.surfaceContainerHighest,
            true: colors.primary,
          }}
          thumbColor={colors.surface}
        />
      </View>

      <View style={styles.section}>
        <View style={styles.inlineCol}>
          {/* 1. Care you will provide */}
          <AppText variant="caption" style={{ marginBottom: 4 }}>
            Care you will provide:
          </AppText>
          <View style={styles.serviceRow}>
            {(
              [
                { key: "daytime", label: "Daytime", Icon: Sun },
                { key: "playwalk", label: "Play/walk", Icon: PawPrint },
                { key: "overnight", label: "Overnight", Icon: Moon },
                { key: "vacation", label: "Vacation", Icon: Briefcase },
              ] as const
            ).map(({ key, label, Icon }) => {
              const active = services.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.9}
                  onPress={() => toggleService(key)}
                  style={styles.serviceOption}
                >
                  <View
                    style={[
                      styles.serviceCircle,
                      {
                        backgroundColor: colors.surfaceContainerHighest,
                        borderColor: active ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    <Icon
                      size={20}
                      color={active ? colors.primary : colors.onSurfaceVariant}
                    />
                  </View>
                  <AppText
                    variant="caption"
                    color={active ? colors.primary : colors.onSurfaceVariant}
                    style={styles.serviceOptionLabel}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Kind of pet */}
        <View style={styles.inlineCol}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: 4 }}
          >
            Pet type:
          </AppText>
          <View style={styles.petKindsRow}>
            {(
              [
                {
                  key: "dog",
                  label: "Dog",
                  asset: require("@/assets/illustrations/dog.svg") as number,
                },
                {
                  key: "cat",
                  label: "Cat",
                  asset: require("@/assets/illustrations/cat.svg") as number,
                },
                {
                  key: "small-furries",
                  label: "Small furries",
                  asset: require("@/assets/illustrations/furry.svg") as number,
                },
                {
                  key: "bird",
                  label: "Bird",
                  asset: require("@/assets/illustrations/bird.svg") as number,
                },
                {
                  key: "reptile",
                  label: "Reptile",
                  asset:
                    require("@/assets/illustrations/reptile.svg") as number,
                },
                {
                  key: "other",
                  label: "Other",
                  asset: require("@/assets/illustrations/other.svg") as number,
                },
              ] as const
            ).map(({ key, label, asset }) => {
              const active = petKinds.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.9}
                  onPress={() => togglePetKind(key)}
                  style={styles.petKindOption}
                >
                  <View
                    style={[
                      styles.petKindCircle,
                      {
                        backgroundColor: colors.surfaceContainerHighest,
                        borderColor: active ? colors.primary : "transparent",
                      },
                    ]}
                  >
                    <AppImage
                      source={asset}
                      type="svg"
                      width={60}
                      height={60}
                      style={{ backgroundColor: "transparent" }}
                    />
                  </View>
                  <AppText
                    variant="caption"
                    color={active ? colors.primary : colors.onSurfaceVariant}
                    style={styles.petKindLabel}
                    numberOfLines={1}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. Fence type (yard) */}
        <View style={styles.inlineCol}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: 4 }}
          >
            Yard type:
          </AppText>
          <View style={styles.inlineChips}>
            {["fenced yard", "high fence", "no yard"].map((opt) => {
              const active = yardType === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.smallPill,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                    },
                  ]}
                  onPress={() => setYardType(opt)}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                  >
                    {opt}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 4. Do you have any pets (pet owner) */}
        <View style={styles.inlineCol}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: 4 }}
          >
            Pet owner:
          </AppText>
          <View style={styles.inlineChips}>
            {(["yes", "no"] as const).map((opt) => {
              const active = petOwner === opt;
              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.smallPill,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                    },
                  ]}
                  onPress={() => setPetOwner(opt)}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                  >
                    {opt === "yes" ? "Yes" : "No"}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 6. Days of week chips */}
        <View style={styles.inlineCol}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: 4 }}
          >
            Days:
          </AppText>
          <View style={styles.daysRow}>
            {["M", "Tu", "W", "Th", "F", "Sa", "Su"].map((label) => {
              const active = days.includes(label);
              return (
                <TouchableOpacity
                  key={label}
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                      borderColor: active ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => toggleDay(label)}
                >
                  <AppText
                    variant="caption"
                    color={active ? colors.onPrimary : colors.onSurfaceVariant}
                    style={styles.dayLabel}
                  >
                    {label}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 7. Time range pickers (start / end) */}
        <View style={styles.inlineCol}>
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={{ marginBottom: 4 }}
          >
            Time:
          </AppText>
          <View style={styles.timeRow}>
            <View style={styles.timeField}>
              <DateTimeField
                mode="time"
                label="Start time"
                value={startTime}
                onChange={setStartTime}
              />
            </View>
            <View style={styles.timeField}>
              <DateTimeField
                mode="time"
                label="End time"
                value={endTime}
                onChange={setEndTime}
              />
            </View>
          </View>
        </View>
        <Input
          label="Short note"
          value={note}
          onChangeText={setNote}
          multiline
          containerStyle={{
            marginBottom: 0,
          }}
          inputStyle={[styles.noteInput]}
        />
      </View>

      {/* Preview card, mirroring availability preview design */}
      <AvailabilityPreviewCard
        avatarUri="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200"
        name="Bob Majors"
        rating={4.1}
        handshakes={12}
        paws={17}
        isAvailable={available}
        petTypes={["Cats", "Dog", "Bird"]}
        services={[
          services.includes("daytime") ? "Daytime" : null,
          services.includes("playwalk") ? "Play/walk" : null,
          services.includes("overnight") ? "Overnight" : null,
          services.includes("vacation") ? "Vacation" : null,
        ].filter(Boolean) as string[]}
        location="Syracuse, New York, US"
      />

      <Button
        label={t("common.save", "Save")}
        onPress={onSave}
        fullWidth
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 0,
    gap: 24,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  section: {
    gap: 20,
  },
  serviceRow: {
    flexDirection: "row",
    gap: 18,
    marginBottom: 8,
  },
  serviceOption: {
    alignItems: "center",
    gap: 4,
  },
  serviceCircle: {
    width: 60,
    height: 60,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  serviceOptionLabel: {
    fontSize: 12,
  },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  fieldLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  fieldText: {
    fontSize: 14,
  },
  inlineRow: {
    flexDirection: "row",
    gap: 16,
  },
  inlineCol: {
    flex: 1,
  },
  inlineChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  petKindsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 6,
  },
  petKindOption: {
    alignItems: "center",
    gap: 4,
  },
  petKindCircle: {
    width: 70,
    height: 70,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  petKindLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  smallPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  noteCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noteInput: {
    minHeight: 70,
    textAlignVertical: "top",
    borderRadius: 12,
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  daysRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  dayCircle: {
    width: 44,
    height: 44,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dayLabel: {
    fontSize: 14,
  },
  previewMenuBtn: {
    padding: 6,
    borderRadius: 999,
  },
  previewMetaRowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
