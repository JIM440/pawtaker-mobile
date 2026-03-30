import { PET_TYPE_OPTIONS } from "@/src/constants/pets";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { DaySelector } from "@/src/shared/components/ui/DaySelector";
import { Input } from "@/src/shared/components/ui/Input";
import { PetKindSelector } from "@/src/shared/components/ui/PetKindSelector";
import { RadioGroup } from "@/src/shared/components/ui/RadioGroup";
import React from "react";
import { View } from "react-native";

type Props = {
  t: (key: string, fallback?: string) => string;
  colors: Record<string, string>;
  styles: any;
  isAvailable: boolean;
  setIsAvailable: (v: boolean) => void;
  careTypes: string[];
  toggleCareType: (key: string) => void;
  petKinds: string[];
  togglePetKind: (key: string) => void;
  yardRadioOptions: { value: string; label: string }[];
  yardType: string;
  setYardType: (v: string) => void;
  petOwnerRadioOptions: { value: string; label: string }[];
  isPetOwner: string;
  setIsPetOwner: (v: string) => void;
  days: string[];
  toggleDay: (day: string) => void;
  startTime: Date;
  endTime: Date;
  setStartTime: (d: Date) => void;
  setEndTime: (d: Date) => void;
  setErrors: React.Dispatch<React.SetStateAction<{ timeRange?: string } & Record<string, any>>>;
  errors: { timeRange?: string };
  note: string;
  setNote: (s: string) => void;
};

export function AvailabilityPreviewStep({
  t,
  colors,
  styles,
  isAvailable,
  setIsAvailable,
  careTypes,
  toggleCareType,
  petKinds,
  togglePetKind,
  yardRadioOptions,
  yardType,
  setYardType,
  petOwnerRadioOptions,
  isPetOwner,
  setIsPetOwner,
  days,
  toggleDay,
  startTime,
  endTime,
  setStartTime,
  setEndTime,
  setErrors,
  errors,
  note,
  setNote,
}: Props) {
  return (
    <View style={styles.stepContainer}>
      <AppText variant="title" style={styles.stepTitle}>
        {t("post.availability.previewTitle")}
      </AppText>
      <AppText
        variant="body"
        color={colors.onSurfaceVariant}
        style={styles.previewSubtitle}
      >
        {t("post.availability.previewSubtitle")}
      </AppText>

      <View style={styles.editLikeSection}>
        <View style={styles.previewSwitchRow}>
          <AppText variant="body" color={colors.onSurface} style={{ fontWeight: "600" }}>
            {t("availability.available", "Available")}
          </AppText>
          <AppSwitch value={isAvailable} onValueChange={setIsAvailable} />
        </View>

        <View style={styles.previewFields}>
          <View style={styles.inlineCol}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
              {t("post.availability.careFieldLabel", "Care you will provide:")}
            </AppText>
            <CareTypeSelector selectedKeys={careTypes} onToggle={toggleCareType} />
          </View>

          <View style={styles.inlineCol}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
              {t("post.availability.petTypeLabel", "Pet type:")}
            </AppText>
            <PetKindSelector
              options={Array.from(PET_TYPE_OPTIONS)}
              selectedKeys={petKinds as any}
              onToggle={togglePetKind as any}
              variant="small"
              singleSelect={false}
            />
          </View>

          <View style={styles.inlineCol}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
              {t("post.availability.yardChipLabel", "Yard type:")}
            </AppText>
            <RadioGroup options={yardRadioOptions} value={yardType} onChange={setYardType} />
          </View>

          <View style={styles.inlineCol}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
              {t("post.availability.petOwnerChipLabel", "Pet owner:")}
            </AppText>
            <RadioGroup
              options={petOwnerRadioOptions}
              value={isPetOwner}
              onChange={setIsPetOwner}
            />
          </View>

          <View style={styles.inlineCol}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
              {t("post.availability.daysFieldLabel", "Days:")}
            </AppText>
            <DaySelector
              days={["M", "Tu", "W", "Th", "F", "Sa", "Su"]}
              selectedDays={days}
              onToggle={toggleDay}
            />
          </View>

          <View style={styles.inlineCol}>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.fieldLabel}>
              {t("post.availability.timeFieldLabel", "Time:")}
            </AppText>
            <View style={styles.timeRow}>
              <View style={styles.timeField}>
                <DateTimeField
                  mode="time"
                  label={t("post.availability.startTimeLabel", "Start time")}
                  value={startTime}
                  onChange={(d) => {
                    setStartTime(d);
                    setErrors((e) => ({ ...e, timeRange: undefined }));
                  }}
                  error={errors.timeRange}
                />
              </View>
              <View style={styles.timeField}>
                <DateTimeField
                  mode="time"
                  label={t("post.availability.endTimeLabel", "End time")}
                  value={endTime}
                  onChange={(d) => {
                    setEndTime(d);
                    setErrors((e) => ({ ...e, timeRange: undefined }));
                  }}
                  error={errors.timeRange}
                  showErrorText={false}
                />
              </View>
            </View>
          </View>

          <Input
            label={t("availability.note", "Short note")}
            value={note}
            onChangeText={setNote}
            multiline
            placeholder={t("post.availability.notePlaceholder")}
            containerStyle={{ marginBottom: 0 }}
            inputStyle={styles.previewNoteInput}
            showErrorOnlyAfterFocus={false}
          />
        </View>
      </View>

      <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.disclaimer}>
        {t("post.availability.previewDisclaimer")}
      </AppText>
    </View>
  );
}
