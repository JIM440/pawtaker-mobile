import { Colors } from "@/src/constants/colors";
import type { PetKindId } from "@/src/constants/pet-kinds";
import { PET_TYPE_OPTIONS } from "@/src/constants/pets";
import { CareTypeFirstStep } from "@/src/features/post/components/care-type-first-step";
import { AvailabilityPreviewStep } from "@/src/features/post/components/availability-preview-step";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { DaySelector } from "@/src/shared/components/ui/DaySelector";
import { Input } from "@/src/shared/components/ui/Input";
import { PetKindSelector } from "@/src/shared/components/ui/PetKindSelector";
import { RadioGroup } from "@/src/shared/components/ui/RadioGroup";
import { useLocationGate } from "@/src/lib/location/useLocationGate";
import { enforceLocationGate } from "@/src/shared/utils/locationGate";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BackHandler, ScrollView, StyleSheet, View } from "react-native";

const TOTAL_STEPS = 8;

const DAY_ORDER = ["M", "Tu", "W", "Th", "F", "Sa", "Su"] as const;

function formatEveryDaysLabel(
  selectedDays: string[],
  t: (key: string, opt?: Record<string, string>) => string,
): string {
  const sorted = DAY_ORDER.filter((d) => selectedDays.includes(d));
  if (sorted.length === 0) return "";
  const names = sorted.map((d) =>
    t(`post.availability.weekdays.${d}`, { defaultValue: d }),
  );
  return t("post.availability.everyDays", { days: names.join(", ") });
}

export default function AvailabilityWizardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const showToast = useToastStore((s) => s.showToast);
  const { checkLocation } = useLocationGate();

  useEffect(() => {
    checkLocation();
  }, []);

  const [careTypes, setCareTypes] = useState<string[]>([]);
  const [petKinds, setPetKinds] = useState<PetKindId[]>([]);
  const [yardType, setYardType] = useState("fenced yard");
  const [isPetOwner, setIsPetOwner] = useState("yes");
  const [days, setDays] = useState<string[]>([]);
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
  const [note, setNote] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    careTypes?: string;
    petKinds?: string;
    days?: string;
    timeRange?: string;
  }>({});

  const progress = (step + 1) / TOTAL_STEPS;

  const everyDaysText = useMemo(() => formatEveryDaysLabel(days, t), [days, t]);

  const yardRadioOptions = useMemo(
    () => [
      { value: "fenced yard", label: t("post.availability.yardFenced") },
      { value: "high fence", label: t("post.availability.yardHighFence") },
      { value: "no yard", label: t("post.availability.yardNone") },
    ],
    [t],
  );

  const petOwnerRadioOptions = useMemo(
    () => [
      { value: "yes", label: t("post.availability.ownerYes") },
      { value: "no", label: t("post.availability.ownerNo") },
    ],
    [t],
  );

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step > 0) {
        setStep((s) => s - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const timeRangeInvalid = () => {
    const startM = startTime.getHours() * 60 + startTime.getMinutes();
    const endM = endTime.getHours() * 60 + endTime.getMinutes();
    return endM <= startM;
  };

  const validateCurrentStep = (): boolean => {
    if (step === 0) {
      if (careTypes.length === 0) {
        setErrors({
          careTypes: t("post.availability.validation.careTypeRequired"),
        });
        return false;
      }
    }
    if (step === 1) {
      if (petKinds.length === 0) {
        setErrors({
          petKinds: t("post.availability.validation.petKindRequired"),
        });
        return false;
      }
    }
    if (step === 4) {
      if (days.length === 0) {
        setErrors({ days: t("post.availability.validation.daysRequired") });
        return false;
      }
    }
    if (step === 5) {
      if (timeRangeInvalid()) {
        setErrors({
          timeRange: t("post.availability.validation.timeRange"),
        });
        return false;
      }
    }
    setErrors({});
    return true;
  };

  const formatTime = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  const publishAvailability = async () => {
    if (!user?.id) {
      showToast({
        variant: "error",
        message: t("post.availability.signInRequired"),
        durationMs: 3200,
      });
      return;
    }
    if (!enforceLocationGate(profile, router, showToast, t)) return;

    setIsSubmitting(true);
    try {
      const availabilityJson = {
        available: isAvailable,
        services: careTypes,
        days,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        petOwner: isPetOwner,
        yardType,
        petKinds,
        note: note.trim(),
      };

      const { error } = await supabase.from("taker_profiles").upsert(
        {
          user_id: user.id,
          accepted_species: petKinds,
          max_pets: 0,
          hourly_points: 0,
          experience_years: 0,
          availability_json: availabilityJson,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;
      showToast({
        variant: "success",
        message: t("post.availability.saved", "Availability saved."),
        durationMs: 2400,
      });
      router.replace({
        pathname: "/(private)/(tabs)/profile",
        params: { tab: "availability", refreshAvailability: "true" },
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t("post.availability.saveFailed"),
        ),
        durationMs: 3400,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    if (step < TOTAL_STEPS - 1) setStep((s) => s + 1);
    else {
      void publishAvailability();
    }
  };

  const toggleCareType = (key: string) => {
    setErrors((e) => ({ ...e, careTypes: undefined }));
    setCareTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const togglePetKind = (key: string) => {
    setErrors((e) => ({ ...e, petKinds: undefined }));
    if (!key) return;
    setPetKinds((prev) =>
      prev.includes(key as PetKindId)
        ? prev.filter((k) => k !== key)
        : [...prev, key as PetKindId],
    );
  };

  const toggleDay = (label: string) => {
    setErrors((e) => ({ ...e, days: undefined }));
    setDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label],
    );
  };

  return (
    <PageContainer>
      <BackHeader
        onBack={goBack}
        className="pl-0 pr-0"
        style={{ padding: 0, paddingTop: 0, justifyContent: "space-between" }}
        rightSlot={
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progress * 100}%`,
                },
              ]}
            />
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && (
          <CareTypeFirstStep
            careTypes={careTypes}
            onToggle={toggleCareType}
            errorMessage={errors.careTypes}
          />
        )}

        {step === 1 && (
          <View style={styles.editSection}>
            <View
              style={
                errors.petKinds
                  ? {
                      borderWidth: 1,
                      borderColor: colors.error,
                      borderRadius: 12,
                      padding: 10,
                      backgroundColor: colors.errorContainer,
                    }
                  : undefined
              }
            >
              <AppText variant="title" style={styles.stepTitle}>
                {t("post.availability.petKindQuestion")}
              </AppText>
              <PetKindSelector
                options={Array.from(PET_TYPE_OPTIONS)}
                selectedKeys={petKinds}
                onToggle={togglePetKind}
                variant="grid"
                singleSelect={false}
              />
            </View>
            {errors.petKinds ? (
              <AppText
                variant="caption"
                color={colors.error}
                style={styles.fieldErrorText}
              >
                {errors.petKinds}
              </AppText>
            ) : null}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.availability.yardQuestion")}
            </AppText>
            <RadioGroup
              options={yardRadioOptions}
              value={yardType}
              onChange={setYardType}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.availability.petOwnerQuestion")}
            </AppText>
            <RadioGroup
              options={petOwnerRadioOptions}
              value={isPetOwner}
              onChange={setIsPetOwner}
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.availability.daysQuestion")}
            </AppText>

            <DaySelector
              days={["M", "Tu", "W", "Th", "F", "Sa", "Su"]}
              selectedDays={days}
              onToggle={toggleDay}
              error={errors.days}
            />
            {errors.days ? (
              <AppText
                variant="caption"
                color={colors.error}
                style={styles.fieldErrorText}
              >
                {errors.days}
              </AppText>
            ) : null}
            {everyDaysText ? (
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.everyDaysHint}
              >
                {everyDaysText}
              </AppText>
            ) : null}
          </View>
        )}

        {step === 5 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.availability.hoursTitle")}
            </AppText>
            <View style={styles.timeRow}>
              <View style={{ flex: 1 }}>
                <DateTimeField
                  mode="time"
                  label={t("availability.startTime", "Start")}
                  value={startTime}
                  onChange={(d) => {
                    setStartTime(d);
                    setErrors((e) => ({ ...e, timeRange: undefined }));
                  }}
                  error={errors.timeRange}
                />
              </View>
              <View style={{ flex: 1 }}>
                <DateTimeField
                  mode="time"
                  label={t("availability.endTime", "End")}
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
        )}

        {step === 6 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.availability.noteTitle")}
            </AppText>
            <Input
              label={t("post.availability.previewBio")}
              value={note}
              onChangeText={setNote}
              multiline
              placeholder={t("post.availability.notePlaceholder")}
              inputStyle={styles.noteInput}
            />
          </View>
        )}

        {step === 7 && (
          <AvailabilityPreviewStep
            t={(key, fallback) => t(key, fallback as string)}
            colors={colors}
            styles={styles}
            isAvailable={isAvailable}
            setIsAvailable={setIsAvailable}
            careTypes={careTypes}
            toggleCareType={toggleCareType}
            petKinds={petKinds as any}
            togglePetKind={togglePetKind as any}
            yardRadioOptions={yardRadioOptions}
            yardType={yardType}
            setYardType={setYardType}
            petOwnerRadioOptions={petOwnerRadioOptions}
            isPetOwner={isPetOwner}
            setIsPetOwner={setIsPetOwner}
            days={days}
            toggleDay={toggleDay}
            startTime={startTime}
            endTime={endTime}
            setStartTime={setStartTime}
            setEndTime={setEndTime}
            setErrors={setErrors as any}
            errors={errors}
            note={note}
            setNote={setNote}
          />
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={
            isSubmitting
              ? t("common.saving", "Saving...")
              : step === TOTAL_STEPS - 1
                ? t("post.availability.publish")
                : t("post.availability.next")
          }
          onPress={goNext}
          fullWidth
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </View>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    maxWidth: 150,
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  editSection: {
    paddingVertical: 8,
  },
  editLikeSection: {
    gap: 20,
  },
  inlineCol: {
    gap: 8,
  },
  fieldLabel: {
    fontWeight: "500",
  },
  previewSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewFields: {
    gap: 20,
  },
  timeField: {
    flex: 1,
  },
  fieldErrorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  everyDaysHint: {
    marginTop: 4,
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
  },
  noteInput: {
    minHeight: 150,
    textAlignVertical: "top",
  },
  previewSubtitle: {
    marginBottom: 8,
  },
  previewNoteInput: {
    minHeight: 80,
    textAlignVertical: "top",
    borderRadius: 12,
  },
  disclaimer: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
});
