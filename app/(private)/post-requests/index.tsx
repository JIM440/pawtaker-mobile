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
import { useAuthStore } from "@/src/lib/store/auth.store";
import { supabase } from "@/src/lib/supabase/client";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { DataState } from "@/src/shared/components/ui";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { PetGridTile } from "@/src/shared/components/ui/PetGridTile";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

const TOTAL_STEPS = 4;

function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export default function LaunchRequestWizardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { width: windowWidth } = useWindowDimensions();
  const columnWidth = getPetGridColumnWidth(
    windowWidth,
    PAGE_HORIZONTAL_PADDING,
  );
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [step, setStep] = useState(0);
  const [pets, setPets] = useState<
    { id: string; name: string; imageUri: string | null }[]
  >([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsRefreshing, setPetsRefreshing] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const progress = (step + 1) / TOTAL_STEPS;

  const loadPets = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) {
      setPetsLoading(false);
      return;
    }
    if (!opts?.refresh) {
      setPetsLoading(true);
    }
    setPetsError(null);
    try {
      const { data, error } = await supabase
        .from("pets")
        .select("id,name,avatar_url")
        .eq("owner_id", user.id);
      if (error) throw error;
      const nextPets =
        data?.map((p) => ({ id: p.id, name: p.name, imageUri: p.avatar_url })) ?? [];
      setPets(nextPets);
    } catch (err) {
      setPetsError(err instanceof Error ? err.message : "Failed to load pets.");
    } finally {
      setPetsLoading(false);
    }
  };

  useEffect(() => {
    void loadPets();
  }, [user?.id]);

  const onRefreshPets = async () => {
    setPetsRefreshing(true);
    await loadPets({ refresh: true });
    setPetsRefreshing(false);
  };

  useEffect(() => {
    if (params.petId && typeof params.petId === "string") {
      setSelectedPet(params.petId);
    }
  }, [params.petId]);

  const selectedPetData = useMemo(
    () => pets.find((p) => p.id === selectedPet) ?? null,
    [pets, selectedPet],
  );

  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
    else router.back();
  };

  const timeRangeInvalid = () => {
    const startM = timeStart.getHours() * 60 + timeStart.getMinutes();
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
    if (step === 3) {
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

  const mapCareTypeToDb = (value: string): "sitting" | "walking" | "boarding" => {
    if (value === "playwalk") return "walking";
    if (value === "overnight" || value === "vacation") return "boarding";
    return "sitting";
  };

  const buildDescription = () => {
    const chunks = [
      specialNeeds.trim() ? `Special needs: ${specialNeeds.trim()}` : "",
      `Yard: ${yardType}`,
      `Age range: ${ageRange}`,
      `Energy level: ${energyLevel}`,
      days.length ? `Preferred days: ${days.join(", ")}` : "",
    ].filter(Boolean);
    return chunks.join("\n");
  };

  const launchRequest = async () => {
    if (!user?.id || !selectedPet) {
      Alert.alert(t("common.error", "Something went wrong"));
      return;
    }
    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      start.setHours(timeStart.getHours(), timeStart.getMinutes(), 0, 0);
      const endBase = multiDay ? endDate : startDate;
      const end = new Date(endBase);
      end.setHours(timeEnd.getHours(), timeEnd.getMinutes(), 0, 0);

      const { error } = await supabase.from("care_requests").insert({
        owner_id: user.id,
        pet_id: selectedPet,
        taker_id: null,
        care_type: mapCareTypeToDb(careTypes[0] ?? "daytime"),
        status: "open",
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        points_offered: 0,
        description: buildDescription() || null,
      });

      if (error) throw error;
      router.replace("/(private)/(tabs)" as any);
    } catch (err) {
      Alert.alert(
        t("common.error", "Something went wrong"),
        err instanceof Error ? err.message : t("common.error", "Something went wrong"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const goNext = () => {
    if (!validateCurrentStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      void launchRequest();
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
        refreshControl={
          <RefreshControl
            refreshing={petsRefreshing}
            onRefresh={() => void onRefreshPets()}
          />
        }
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
            {petsLoading ? (
              <DataState
                title="Loading pets..."
                message="Getting your pets from database."
                mode="inline"
              />
            ) : null}
            {petsError ? (
              <DataState
                title="Could not load pets"
                message={petsError}
                actionLabel="Retry"
                mode="inline"
                onAction={() => {
                  void loadPets();
                }}
              />
            ) : null}
            {!petsLoading && !petsError && pets.length > 0 ? (
              <View style={styles.petRow}>
                {pets.map((pet) => (
                  <PetGridTile
                    key={pet.id}
                    width={columnWidth}
                    imageUri={pet.imageUri || undefined}
                    name={pet.name}
                    selected={selectedPet === pet.id}
                    onPress={() => setSelectedPet(pet.id)}
                  />
                ))}
              </View>
            ) : null}

            {!petsLoading && !petsError && pets.length > 0 ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t(
                  "post.request.addAnotherPet",
                  "or add another pet",
                )}
                onPress={() => router.push("/(private)/pets/add" as any)}
                activeOpacity={0.8}
                style={styles.addPetRow}
              >
                <AppText
                  variant="body"
                  color={colors.primary}
                  style={{ fontWeight: "600" }}
                >
                  {"+ "}
                  {t("post.request.addAnotherPet", "or add another pet")}
                </AppText>
              </TouchableOpacity>
            ) : null}
            {!petsLoading && !petsError && pets.length === 0 ? (
              <DataState
                title={t("post.request.emptyPetsTitle", "No pets yet")}
                message={t(
                  "post.request.emptyPetsSubtitle",
                  "You have not uploaded any pets yet",
                )}
                illustration={
                  <AppImage
                    source={require("@/assets/illustrations/pets/no-pet.svg")}
                    type="svg"
                    width={200}
                    height={188}
                    style={styles.emptyIllustration}
                  />
                }
                actionLabel={t("post.request.addAPet", "Add a pet")}
                onAction={() => router.push("/(private)/pets/add" as any)}
                mode="inline"
              />
            ) : null}
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View>
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
            </View>
            <View style={styles.timeRowContainer}>
              <AppText variant="title" style={styles.stepTitle}>
                Select time
              </AppText>
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
          </View>
        )}

        {step === 3 && (
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
                        selectedPetData?.imageUri ||
                        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
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
                    {selectedPetData?.name || "—"}
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
                {multiDay ? (
                  <View style={styles.previewTimeRow}>
                    <View style={styles.previewTimeField}>
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
                        showErrorText={false}
                      />
                    </View>
                    <View style={styles.previewTimeField}>
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
                        showErrorText={false}
                      />
                    </View>
                  </View>
                ) : (
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
                    }}
                    placeholder={t("post.request.selectDatePlaceholder")}
                    showErrorText={false}
                  />
                )}
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
  scrollContent: {},
  stepContainer: {
    gap: 24,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  petRow: {
    flexDirection: "row",
    gap: PET_GRID_GAP,
    justifyContent: "space-between",
  },
  addPetRow: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  emptyState: {
    paddingVertical: 16,
  },
  emptyIllustration: {
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    gap: 20,
    marginVertical: 16,
  },
  timeRowContainer: {
    gap: 16,
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
