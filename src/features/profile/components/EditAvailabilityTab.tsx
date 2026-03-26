import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { ChipSelector } from "@/src/shared/components/ui/ChipSelector";
import { DaySelector } from "@/src/shared/components/ui/DaySelector";
import { Input } from "@/src/shared/components/ui/Input";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { PET_TYPE_OPTIONS } from "@/src/constants/pets";
import { PetKindSelector } from "@/src/shared/components/ui/PetKindSelector";

export type AvailabilityFormValues = {
  available: boolean;
  services: string[];
  days: string[];
  startTime: Date;
  endTime: Date;
  petOwner: string;
  yardType: string;
  petKinds: string[];
  note: string;
};

type Props = {
  initialValues?: AvailabilityFormValues;
  onSave?: (values: AvailabilityFormValues) => void;
  isSaving?: boolean;
  saveLabel?: string;
};

const defaultValues: AvailabilityFormValues = {
  available: true,
  services: [],
  days: [],
  startTime: (() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  })(),
  endTime: (() => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    return d;
  })(),
  petOwner: "no",
  yardType: "",
  petKinds: [],
  note: "",
};

export function EditAvailabilityTab({
  onSave,
  initialValues = defaultValues,
  isSaving = false,
  saveLabel,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [available, setAvailable] = useState(initialValues.available);
  const [services, setServices] = useState<string[]>(initialValues.services);
  const [days, setDays] = useState<string[]>(initialValues.days);
  const [startTime, setStartTime] = useState<Date>(initialValues.startTime);
  const [endTime, setEndTime] = useState<Date>(initialValues.endTime);
  const [petOwner, setPetOwner] = useState(initialValues.petOwner);
  const [yardType, setYardType] = useState(initialValues.yardType);
  const [petKinds, setPetKinds] = useState<string[]>(initialValues.petKinds);
  const [note, setNote] = useState(initialValues.note);

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
        <AppText variant="body" color={colors.onSurface} style={{ fontWeight: "600" }}>
          {t("availability.available", "Available")}
        </AppText>
        <AppSwitch
          value={available}
          onValueChange={setAvailable}
        />
      </View>

      <View style={styles.section}>
        {/* 1. Care you will provide */}
        <View style={styles.inlineCol}>
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.label}>
            Care you will provide:
          </AppText>
          <CareTypeSelector
            selectedKeys={services}
            onToggle={toggleService}
          />
        </View>

        {/* 2. Kind of pet */}
        <View style={styles.inlineCol}>
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.label}>
            Pet type:
          </AppText>
          <PetKindSelector
            options={Array.from(PET_TYPE_OPTIONS)}
            selectedKeys={petKinds}
            onToggle={togglePetKind}
            variant="large"
          />
        </View>


        {/* 3. Yard type */}
        <View style={styles.inlineCol}>
          <ChipSelector
            label="Yard type:"
            options={["fenced yard", "high fence", "no yard"]}
            selectedOption={yardType}
            onSelect={setYardType}
          />
        </View>

        {/* 4. Pet owner */}
        <View style={styles.inlineCol}>
          <ChipSelector
            label="Pet owner:"
            options={["yes", "no"]}
            selectedOption={petOwner}
            onSelect={setPetOwner}
          />
        </View>

        {/* 6. Days */}
        <View style={styles.inlineCol}>
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.label}>
            Days:
          </AppText>
          <DaySelector
            days={["M", "Tu", "W", "Th", "F", "Sa", "Su"]}
            selectedDays={days}
            onToggle={toggleDay}
          />
        </View>

        {/* 7. Time */}
        <View style={styles.inlineCol}>
          <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.label}>
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
          containerStyle={{ marginBottom: 0 }}
          inputStyle={styles.noteInput}
        />
      </View>

      <Button
        label={saveLabel ?? t("common.save", "Save")}
        onPress={() =>
          onSave?.({
            available,
            services,
            days,
            startTime,
            endTime,
            petOwner,
            yardType,
            petKinds,
            note,
          })
        }
        fullWidth
        loading={isSaving}
        disabled={isSaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  inlineCol: {
    gap: 8,
  },
  label: {
    fontWeight: "500",
  },
  petKindsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  petKindOption: {
    alignItems: "center",
    gap: 4,
  },
  petKindCircle: {
    width: 70,
    height: 70,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  petKindLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  timeRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeField: {
    flex: 1,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
    borderRadius: 12,
  },
});
