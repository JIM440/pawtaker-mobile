import { Colors } from "@/src/constants/colors";
import {
  getPetGridColumnWidth,
  PAGE_HORIZONTAL_PADDING,
  PET_GRID_GAP,
} from "@/src/constants/pet-grid";
import { CareTypeFirstStep } from "@/src/features/post/components/care-type-first-step";
import {
  RequestPreviewCard,
  RequestPreviewRow,
} from "@/src/features/post/components/request-preview-card";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { ChipSelector } from "@/src/shared/components/ui/ChipSelector";
import { DaySelector } from "@/src/shared/components/ui/DaySelector";
import { Input } from "@/src/shared/components/ui/Input";
import {
  PetGridAddTile,
  PetGridTile,
} from "@/src/shared/components/ui/PetGridTile";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const TOTAL_STEPS = 5;

function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function formatPreviewDate(d: Date) {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MOCK_PETS = [
  {
    id: "1",
    name: "Polo",
    imageUri:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
  },
  {
    id: "2",
    name: "Luna",
    imageUri:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200",
  },
  {
    id: "3",
    name: "Bobby",
    imageUri: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=200",
  },
];

export default function LaunchRequestWizardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const columnWidth = getPetGridColumnWidth(
    windowWidth,
    PAGE_HORIZONTAL_PADDING,
  );
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const [careTypes, setCareTypes] = useState<string[]>(["daytime"]);
  const [multiDay, setMultiDay] = useState(false);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });
  const [timeStart, setTimeStart] = useState<Date>(() => {
    const d = new Date();
    d.setHours(8, 0, 0, 0);
    return d;
  });
  const [timeEnd, setTimeEnd] = useState<Date>(() => {
    const d = new Date();
    d.setHours(17, 0, 0, 0);
    return d;
  });
  const [selectedPet, setSelectedPet] = useState<string | null>(null);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [yardType, setYardType] = useState("fenced yard");
  const [ageRange, setAgeRange] = useState("3-8 yrs");
  const [energyLevel, setEnergyLevel] = useState("medium energy");
  const [days, setDays] = useState<string[]>(["Sa", "Su"]);
  const [errors, setErrors] = useState<{
    careTypes?: string;
    pet?: string;
    timeRange?: string;
    days?: string;
    dateRange?: string;
  }>({});
  const progress = (step + 1) / TOTAL_STEPS;

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const timeRangeInvalid = () => {
    const startM =
      timeStart.getHours() * 60 + timeStart.getMinutes();
    const endM = timeEnd.getHours() * 60 + timeEnd.getMinutes();
    return endM <= startM;
  };

  const multiDayDateRangeInvalid = () => {
    if (!multiDay) return false;
    return startOfDayMs(endDate) <= startOfDayMs(startDate);
  };

  const validateCurrentStep = (): boolean => {
    if (step === 0) {
      if (careTypes.length === 0) {
        setErrors({
          careTypes: t("post.request.validation.careTypeRequired"),
        });
        return false;
      }
    }
    if (step === 1) {
      if (!selectedPet) {
        setErrors({ pet: t("post.request.validation.petRequired") });
        return false;
      }
    }
    if (step === 2) {
      if (timeRangeInvalid()) {
        setErrors({ timeRange: t("post.request.validation.timeRange") });
        return false;
      }
    }
    if (step === 4) {
      if (days.length === 0) {
        setErrors({ days: t("post.request.validation.daysRequired") });
        return false;
      }
      if (timeRangeInvalid()) {
        setErrors({ timeRange: t("post.request.validation.timeRange") });
        return false;
      }
    }
    setErrors({});
    return true;
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      router.replace("/(private)/(tabs)" as any);
    }
  };

  const toggleCareType = (key: string) => {
    setErrors((e) => ({ ...e, careTypes: undefined }));
    setCareTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
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
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              Select pet
            </AppText>
            {MOCK_PETS.length > 0 ? (
              <View style={styles.petGrid}>
                {MOCK_PETS.map((pet) => (
                  <PetGridTile
                    key={pet.id}
                    width={columnWidth}
                    imageUri={pet.imageUri}
                    name={pet.name}
                    selected={selectedPet === pet.id}
                    onPress={() => setSelectedPet(pet.id)}
                  />
                ))}
                <PetGridAddTile
                  width={columnWidth}
                  label={t("post.request.addAnotherPet", "or add another pet")}
                  onPress={() => {}}
                />
              </View>
            ) : (
              <View style={styles.emptyState}>
                <AppImage
                  source={require("@/assets/illustrations/pets/no-pet.svg")}
                  type="svg"
                  width={200}
                  height={188}
                  style={styles.emptyIllustration}
                />
                <AppText variant="title" style={styles.emptyTitle}>
                  Uh oh!
                </AppText>
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  style={styles.emptySubtitle}
                >
                  You have not uploaded any pets yet
                </AppText>
                <Button
                  label="Add a pet"
                  variant="outline"
                  onPress={() => {}}
                  style={styles.addPetPromptBtn}
                  leftIcon={
                    <AppText
                      variant="title"
                      color={colors.primary}
                      style={{ fontSize: 20 }}
                    >
                      +
                    </AppText>
                  }
                />
              </View>
            )}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              Select date
            </AppText>
            <View
              style={[
                styles.switchRow,
                { backgroundColor: colors.surfaceContainer },
              ]}
            >
              <AppText variant="body" color={colors.onSurface}>
                {t("post.request.multiDay")}
              </AppText>
              <AppSwitch
                value={multiDay}
                onValueChange={(v) => {
                  setMultiDay(v);
                  setErrors((e) => ({
                    ...e,
                    dateRange: undefined,
                  }));
                  if (v) {
                    setEndDate((ed) => {
                      if (startOfDayMs(ed) <= startOfDayMs(startDate)) {
                        const n = new Date(startDate);
                        n.setDate(n.getDate() + 1);
                        return n;
                      }
                      return ed;
                    });
                  }
                }}
              />
            </View>
            {multiDay ? (
              <View style={styles.timeRow}>
                <View style={{ flex: 1 }}>
                  <DateTimeField
                    mode="date"
                    label={t("post.request.startDate")}
                    value={startDate}
                    onChange={(d) => {
                      setStartDate(d);
                      setErrors((e) => ({
                        ...e,
                        dateRange: undefined,
                        timeRange: undefined,
                      }));
                      setEndDate((ed) => {
                        if (startOfDayMs(ed) <= startOfDayMs(d)) {
                          const n = new Date(d);
                          n.setDate(n.getDate() + 1);
                          return n;
                        }
                        return ed;
                      });
                    }}
                    placeholder={t("post.request.selectDatePlaceholder")}
                    error={errors.dateRange}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <DateTimeField
                    mode="date"
                    label={t("post.request.endDate")}
                    value={endDate}
                    onChange={(d) => {
                      setEndDate(d);
                      setErrors((e) => ({
                        ...e,
                        dateRange: undefined,
                        timeRange: undefined,
                      }));
                    }}
                    placeholder={t("post.request.selectDatePlaceholder")}
                    error={errors.dateRange}
                    showErrorText={false}
                  />
                </View>
              </View>
            ) : (
              <DateTimeField
                mode="date"
                label={t("post.request.date")}
                value={startDate}
                onChange={(d) => {
                  setStartDate(d);
                  setErrors((e) => ({ ...e, timeRange: undefined }));
                }}
                placeholder={t("post.request.selectDatePlaceholder")}
              />
            )}
            <View style={styles.timeRow}>
              <DateTimeField
                mode="time"
                label={t("post.request.startTime")}
                value={timeStart}
                onChange={(d) => {
                  setTimeStart(d);
                  setErrors((e) => ({ ...e, timeRange: undefined }));
                }}
                placeholder={t("availability.startTime")}
                error={errors.timeRange}
              />
              <DateTimeField
                mode="time"
                label={t("post.request.endTime")}
                value={timeEnd}
                onChange={(d) => {
                  setTimeEnd(d);
                  setErrors((e) => ({ ...e, timeRange: undefined }));
                }}
                placeholder={t("availability.endTime")}
                error={errors.timeRange}
                showErrorText={false}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.request.detailsTitle")}
            </AppText>
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.detailHint}
            >
              {t("post.request.detailsHint")}
            </AppText>
            <View style={styles.detailSections}>
              <ChipSelector
                label="Yard type:"
                options={["fenced yard", "high fence", "no yard"]}
                selectedOption={yardType}
                onSelect={setYardType}
              />
              <ChipSelector
                label="Age range:"
                options={["0-1 yr", "1-3 yrs", "3-8 yrs", "8+ yrs"]}
                selectedOption={ageRange}
                onSelect={setAgeRange}
              />
              <ChipSelector
                label="Energy level:"
                options={["low energy", "medium energy", "high energy"]}
                selectedOption={energyLevel}
                onSelect={setEnergyLevel}
              />
            </View>
            <Input
              label="Special needs (e.g. medication, diet)…"
              value={specialNeeds}
              onChangeText={setSpecialNeeds}
              multiline
              inputStyle={styles.specialNeedsInput}
            />
          </View>
        )}

        {step === 4 && (
          <View style={styles.stepContainer}>
            <AppText variant="title" style={styles.stepTitle}>
              {t("post.request.previewTitle", "Preview of your request")}
            </AppText>
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.previewSubtitle}
            >
              {t(
                "post.request.previewHint",
                "Tap chips or fields to adjust before launching.",
              )}
            </AppText>

            <RequestPreviewCard>
              <RequestPreviewRow
                label={t("post.request.preview.careTypes")}
                stacked
              >
                <CareTypeSelector
                  selectedKeys={careTypes}
                  onToggle={toggleCareType}
                  circleSize={56}
                  iconSize={20}
                />
              </RequestPreviewRow>

              <RequestPreviewRow label={t("post.request.preview.pet")}>
                <View style={styles.previewPetRow}>
                  <AppImage
                    source={{
                      uri:
                        MOCK_PETS.find((p) => p.id === selectedPet)?.imageUri ||
                        MOCK_PETS[0].imageUri,
                    }}
                    style={styles.selectedPetThumb}
                    contentFit="cover"
                  />
                  <AppText
                    variant="body"
                    color={colors.onSurface}
                    style={styles.previewPetName}
                    numberOfLines={1}
                  >
                    {MOCK_PETS.find((p) => p.id === selectedPet)?.name ||
                      "—"}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setStep(1)}
                    hitSlop={8}
                    style={styles.previewEditBtn}
                  >
                    <AppText variant="caption" color={colors.primary}>
                      {t("post.request.preview.edit")}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </RequestPreviewRow>

              <RequestPreviewRow
                label={
                  multiDay
                    ? t("post.request.preview.dates")
                    : t("post.request.preview.date")
                }
              >
                <View style={styles.previewDateRow}>
                  <AppText
                    variant="body"
                    color={colors.onSurface}
                    style={styles.previewDateText}
                    numberOfLines={2}
                  >
                    {multiDay
                      ? `${formatPreviewDate(startDate)} – ${formatPreviewDate(endDate)}`
                      : formatPreviewDate(startDate)}
                  </AppText>
                  <TouchableOpacity
                    onPress={() => setStep(2)}
                    hitSlop={8}
                  >
                    <AppText variant="caption" color={colors.primary}>
                      {t("post.request.preview.edit")}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </RequestPreviewRow>

              <RequestPreviewRow label={t("post.request.preview.yard")}>
                <ChipSelector
                  options={["fenced yard", "high fence", "no yard"]}
                  selectedOption={yardType}
                  onSelect={setYardType}
                  compact
                  variant="surface"
                />
              </RequestPreviewRow>

              <RequestPreviewRow label={t("post.request.preview.age")}>
                <ChipSelector
                  options={["0-1 yr", "1-3 yrs", "3-8 yrs", "8+ yrs"]}
                  selectedOption={ageRange}
                  onSelect={setAgeRange}
                  compact
                  variant="surface"
                />
              </RequestPreviewRow>

              <RequestPreviewRow label={t("post.request.preview.energy")}>
                <ChipSelector
                  options={["low energy", "medium energy", "high energy"]}
                  selectedOption={energyLevel}
                  onSelect={setEnergyLevel}
                  compact
                  variant="surface"
                />
              </RequestPreviewRow>

              <RequestPreviewRow label={t("post.request.preview.days")}>
                <DaySelector
                  days={["M", "Tu", "W", "Th", "F", "Sa", "Su"]}
                  selectedDays={days}
                  onToggle={toggleDay}
                  error={errors.days}
                  circleSize={40}
                />
              </RequestPreviewRow>

              <RequestPreviewRow label={t("post.request.preview.time")}>
                <View style={styles.previewTimeRow}>
                  <View style={styles.previewTimeField}>
                    <DateTimeField
                      mode="time"
                      label={t("post.request.start")}
                      value={timeStart}
                      onChange={(d) => {
                        setTimeStart(d);
                        setErrors((e) => ({ ...e, timeRange: undefined }));
                      }}
                      error={errors.timeRange}
                    />
                  </View>
                  <View style={styles.previewTimeField}>
                    <DateTimeField
                      mode="time"
                      label={t("post.request.end")}
                      value={timeEnd}
                      onChange={(d) => {
                        setTimeEnd(d);
                        setErrors((e) => ({ ...e, timeRange: undefined }));
                      }}
                      error={errors.timeRange}
                      showErrorText={false}
                    />
                  </View>
                </View>
              </RequestPreviewRow>

              <RequestPreviewRow
                label={t("post.request.preview.specialNeeds")}
                stacked
                isLast
              >
                <Input
                  label={undefined}
                  value={specialNeeds}
                  onChangeText={setSpecialNeeds}
                  multiline
                  placeholder={t(
                    "post.request.specialNeedsPlaceholder",
                    "Anything we should know?",
                  )}
                  inputStyle={styles.noteInput}
                  containerStyle={styles.previewSpecialNeedsInput}
                  showErrorOnlyAfterFocus={false}
                />
              </RequestPreviewRow>
            </RequestPreviewCard>

            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.disclaimer}
            >
              {t(
                "post.request.previewDisclaimer",
                "By tapping Launch, you approve that anyone in the community can apply or contact you in our chat system.",
              )}
            </AppText>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={step === TOTAL_STEPS - 1 ? "Launch" : "Next"}
          onPress={goNext}
          fullWidth
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
  scrollContent: {},
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  petGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PET_GRID_GAP,
    justifyContent: "flex-start",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyIllustration: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  emptySubtitle: {
    textAlign: "center",
  },
  addPetPromptBtn: {
    minWidth: 160,
    borderRadius: 999,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 16,
  },
  timeRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailSections: {
    gap: 20,
  },
  detailHint: {
    marginTop: -16,
    marginBottom: 4,
  },
  specialNeedsInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  previewSubtitle: {
    marginTop: -16,
    marginBottom: 8,
  },
  previewPetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  previewPetName: {
    flex: 1,
    fontWeight: "600",
    minWidth: 0,
  },
  previewEditBtn: {
    marginLeft: 4,
  },
  previewDateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
    width: "100%",
  },
  previewDateText: {
    flex: 1,
    minWidth: 0,
  },
  previewTimeRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  previewTimeField: {
    flex: 1,
    minWidth: 0,
  },
  previewSpecialNeedsInput: {
    marginBottom: 0,
  },
  selectedPetThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  disclaimer: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  fieldErrorText: {
    marginTop: 4,
    marginLeft: 4,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
  },
});
