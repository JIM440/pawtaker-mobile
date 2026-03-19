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
import {
  Briefcase,
  Moon,
  PawPrint,
  Sun
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { PET_TYPE_OPTIONS } from "@/src/constants/pets";
import { PetKindSelector } from "@/src/shared/components/ui/PetKindSelector";

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
  const [petOwner, setPetOwner] = useState("yes");
  const [yardType, setYardType] = useState("fenced yard");
  const [petKinds, setPetKinds] = useState<string[]>(["Dog", "Cat"]);
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
            options={[
              { key: "daytime", label: "Daytime", Icon: Sun },
              { key: "playwalk", label: "Play/walk", Icon: PawPrint },
              { key: "overnight", label: "Overnight", Icon: Moon },
              { key: "vacation", label: "Vacation", Icon: Briefcase },
            ]}
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
