import { Colors } from "@/src/constants/colors";
import {
  getPetGridColumnWidth,
  PAGE_HORIZONTAL_PADDING,
  PET_GRID_COLUMNS,
  PET_GRID_GAP,
} from "@/src/constants/pet-grid";
import { CareTypeFirstStep } from "@/src/features/post/components/care-type-first-step";
import { RequestPetSelectionStep } from "@/src/features/post/components/request-pet-selection-step";
import {
  RequestPreviewCard,
  RequestPreviewRow,
} from "@/src/features/post/components/request-preview-card";
import { formatRequestDateRange } from "@/src/lib/datetime/request-date-time-format";
import { formatLocalYyyyMmDd } from "@/src/lib/datetime/localDate";
import {
  careTypeForCareRequestDb,
  computeCarePoints,
} from "@/src/lib/points/carePoints";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { isRequestSeekingActive } from "@/src/lib/requests/is-request-seeking-active";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import {
  errorMessageFromUnknown,
  isMissingBackendResourceError,
} from "@/src/lib/supabase/errors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { PetGridTile } from "@/src/shared/components/ui/PetGridTile";
import { useLocationGate } from "@/src/lib/location/useLocationGate";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PawPrint } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { IllustratedEmptyState, IllustratedEmptyStateIllustrations } from "@/src/shared/components/ui";

const TOTAL_STEPS = 4;

function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export default function LaunchRequestWizardScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ petId?: string }>();
  const { checkLocation } = useLocationGate();

  useEffect(() => {
    checkLocation();
  }, []);
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
  const [petSeekingDateRangeById, setPetSeekingDateRangeById] = useState<
    Record<string, string>
  >({});
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
  const [errors, setErrors] = useState<{
    careTypes?: string;
    pet?: string;
    timeRange?: string;
    dateRange?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const progress = (step + 1) / TOTAL_STEPS;
  const minimumRequestDate = useMemo(() => startOfToday(), []);
  const minimumEndDate = useMemo(() => {
    const min = new Date(startDate);
    min.setHours(0, 0, 0, 0);
    min.setDate(min.getDate() + 1);
    return min;
  }, [startDate]);

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
        .select("id,name,photo_urls")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const nextPets =
        data?.map((p) => ({
          id: p.id,
          name: p.name,
          imageUri: petGalleryUrls(p)[0] ?? null,
        })) ?? [];

      const petIds = nextPets.map((p) => p.id).filter(Boolean);
      let nextPetSeekingById: Record<string, string> = {};

      if (petIds.length > 0) {
        const { data: openReqs, error: openReqErr } = await supabase
          .from("care_requests")
          .select("pet_id,start_date,end_date,created_at,status,taker_id")
          .eq("owner_id", user.id)
          .eq("status", "open")
          .in("pet_id", petIds)
          .order("start_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (openReqErr && !isMissingBackendResourceError(openReqErr))
          throw openReqErr;

        // Show "Seeking" only while the request is still open, active, and unassigned.
        for (const req of openReqs ?? []) {
          const pid = req?.pet_id as string | undefined;
          if (!pid) continue;
          if (nextPetSeekingById[pid]) continue;
          if (!isRequestSeekingActive(req)) continue;

          const seekingDateRange = formatRequestDateRange(
            req?.start_date,
            req?.end_date,
          );

          if (seekingDateRange) nextPetSeekingById[pid] = seekingDateRange;
        }
      }

      setPets(nextPets);
      setPetSeekingDateRangeById(nextPetSeekingById);
    } catch (err) {
      setPetsError(
        errorMessageFromUnknown(err, t("post.request.petsLoadFailedTitle")),
      );
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

  const petRows = useMemo(() => {
    const rows: (typeof pets)[] = [];
    for (let i = 0; i < pets.length; i += PET_GRID_COLUMNS) {
      rows.push(pets.slice(i, i + PET_GRID_COLUMNS));
    }
    return rows;
  }, [pets]);

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
      if (multiDay && multiDayDateRangeInvalid()) {
        setErrors({
          dateRange: t("post.request.validation.dateRangeOrder"),
        });
        return false;
      }
      if (timeRangeInvalid()) {
        setErrors({ timeRange: t("post.request.validation.timeRange") });
        return false;
      }
    }
    if (step === 3) {
      if (multiDay && multiDayDateRangeInvalid()) {
        setErrors({
          dateRange: t("post.request.validation.dateRangeOrder"),
        });
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

  const launchRequest = async () => {
    if (!user?.id || !selectedPet) {
      showToast({
        variant: "error",
        message: t(
          "post.request.launchFailed",
          "Couldn't create the pet request right now. Please try again.",
        ),
        durationMs: 3200,
      });
      return;
    }
    if (multiDayDateRangeInvalid()) {
      showToast({
        variant: "error",
        message: t("post.request.validation.dateRangeOrder"),
        durationMs: 3200,
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const startDay = new Date(startDate);
      const endDay = new Date(multiDay ? endDate : startDate);

      const startTimeStr = `${String(timeStart.getHours()).padStart(2, "0")}:${String(
        timeStart.getMinutes(),
      ).padStart(2, "0")}:00`;
      const endTimeStr = `${String(timeEnd.getHours()).padStart(2, "0")}:${String(
        timeEnd.getMinutes(),
      ).padStart(2, "0")}:00`;

      // Local calendar dates — `toISOString().slice(0,10)` can shift the day in non-UTC zones.
      const startDateStr = formatLocalYyyyMmDd(startDay);
      const endDateStr = formatLocalYyyyMmDd(endDay);

      const primaryCare = careTypes[0] ?? "daytime";
      const pointsOffered = Math.round(
        computeCarePoints(
          primaryCare,
          `${startDateStr}T${startTimeStr}`,
          `${endDateStr}T${endTimeStr}`,
        ),
      );
      const careTypeDb = careTypeForCareRequestDb(primaryCare);

      const { error } = await supabase.from("care_requests").insert({
        owner_id: user.id,
        pet_id: selectedPet,
        taker_id: null,
        care_type: careTypeDb,
        status: "open",
        start_date: startDateStr,
        end_date: endDateStr,
        start_time: startTimeStr,
        end_time: endTimeStr,
        points_offered: pointsOffered,
      });

      if (error) throw error;
      showToast({
        variant: "success",
        message: t(
          "post.request.launchSuccess",
          "Your care request is live.",
        ),
        durationMs: 2800,
      });
      router.replace("/(private)/(tabs)" as any);
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t(
            "post.request.launchFailed",
            "Couldn't create the pet request right now. Please try again.",
          ),
        ),
        durationMs: 3400,
      });
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
    setCareTypes([key]);
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
            titleText={t(
              "post.request.careStepTitle",
              "What type of care do you need?",
            )}
          />
        )}

        {step === 1 && (
          <RequestPetSelectionStep
            t={(key, fallback) => t(key, fallback as string)}
            colors={colors}
            styles={styles}
            columnWidth={columnWidth}
            petsLoading={petsLoading}
            petsError={petsError}
            pets={pets}
            petRows={petRows}
            selectedPet={selectedPet}
            petSeekingDateRangeById={petSeekingDateRangeById}
            onRetry={() => {
              void loadPets();
            }}
            onSelectPet={setSelectedPet}
            onAddPet={() => router.push("/(private)/pets/add" as any)}
          />
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <View>
              <AppText variant="title" style={styles.stepTitle}>
                {t("post.request.selectDate")}
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
                      minimumDate={minimumRequestDate}
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
                      minimumDate={minimumEndDate}
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
                  minimumDate={minimumRequestDate}
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
                {t("post.request.selectTime")}
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
                  {selectedPetData?.imageUri ? (
                    <AppImage
                      source={{ uri: selectedPetData.imageUri }}
                      style={styles.selectedPetThumb}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.selectedPetThumb,
                        { alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceContainerHighest },
                      ]}
                    >
                      <PawPrint size={18} color={colors.onSurfaceVariant} />
                    </View>
                  )}
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
                        minimumDate={minimumRequestDate}
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
                        minimumDate={minimumEndDate}
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
                    minimumDate={minimumRequestDate}
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
          label={step === TOTAL_STEPS - 1 ? t("post.request.launch") : t("common.next")}
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
  petGrid: {
    width: "100%",
    gap: PET_GRID_GAP,
  },
  petRow: {
    flexDirection: "row",
    gap: PET_GRID_GAP,
    justifyContent: "flex-start",
    width: "100%",
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
  selectedPetThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
