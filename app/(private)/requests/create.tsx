import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type RequestStep = "careType" | "pet" | "date" | "time" | "preview";

const CARE_TYPES = ["Daytime", "Play/walk", "Overnight", "Vacation"] as const;

const MOCK_PETS = [
  {
    id: "1",
    name: "Polo",
    image:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
  },
  {
    id: "2",
    name: "Luna",
    image:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=400",
  },
  {
    id: "3",
    name: "Bobby",
    image:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400",
  },
] as const;

export default function CreateRequestScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [step, setStep] = useState<RequestStep>("careType");
  const [careType, setCareType] = useState<typeof CARE_TYPES[number]>("Daytime");

  const [petId, setPetId] = useState<string>("1");
  const [multiDay, setMultiDay] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [startTime, setStartTime] = useState("08:00 AM");
  const [endTime, setEndTime] = useState("09:00 PM");

  const progress = useMemo(() => {
    switch (step) {
      case "careType":
        return 0.2;
      case "pet":
        return 0.4;
      case "date":
        return 0.6;
      case "time":
        return 0.8;
      case "preview":
        return 1;
      default:
        return 0.2;
    }
  }, [step]);

  const goNext = () => {
    if (step === "careType") setStep("pet");
    else if (step === "pet") setStep("date");
    else if (step === "date") setStep("time");
    else if (step === "time") setStep("preview");
    else router.back();
  };

  const primaryLabel =
    step === "preview"
      ? t("post.request.publish.publish", "Launch")
      : t("common.next", "Next");

  const selectedPet = MOCK_PETS.find((p) => p.id === petId) ?? MOCK_PETS[0];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackHeader
        onBack={() => router.back()}
        title={t("post.choose.requestCare", "Request care for my pet")}
      />

      {/* Progress bar */}
      <View style={styles.progressBarWrap}>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, flex: progress },
            ]}
          />
          <View style={{ flex: 1 - progress }} />
        </View>
      </View>

      {step === "careType" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            What type of care do you need?
          </AppText>

          <View style={styles.careRow}>
            {CARE_TYPES.map((type) => {
              const active = careType === type;
              return (
                <TouchableOpacity
                  key={type}
                  activeOpacity={0.9}
                  onPress={() => setCareType(type)}
                  style={[
                    styles.careChip,
                    {
                      backgroundColor: colors.surfaceDim,
                      borderColor: active
                        ? colors.primary
                        : colors.surfaceDim,
                    },
                  ]}
                >
                  <View style={styles.careIconPlaceholder} />
                  <AppText
                    variant="caption"
                    color={
                      active ? colors.primary : colors.onSurfaceVariant
                    }
                    style={styles.careLabel}
                  >
                    {type}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[
              styles.hintsCard,
              {
                backgroundColor: colors.surfaceContainerLow,
              },
            ]}
          >
            <View style={styles.hintsHeader}>
              <View
                style={[
                  styles.hintsIconCircle,
                  { backgroundColor: colors.tertiaryContainer },
                ]}
              />
              <AppText
                variant="headline"
                color={colors.onTertiaryContainer}
                style={{ fontSize: 20 }}
              >
                Hints
              </AppText>
            </View>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={{ lineHeight: 16 }}
            >
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                Daytime:
              </AppText>{" "}
              Full-day care while you're away{"\n"}
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                Play/walk:
              </AppText>{" "}
              Quick visits for fun exercises/breaks{"\n"}
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                Overnight:
              </AppText>{" "}
              A cozy 1 or 2 night sleepover{"\n"}
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                Vacation:
              </AppText>{" "}
              Extended care for your long trips away
            </AppText>
          </View>
        </ScrollView>
      )}

      {step === "pet" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            Select pet
          </AppText>
          <View style={styles.petRow}>
            {MOCK_PETS.map((pet) => {
              const active = pet.id === petId;
              return (
                <TouchableOpacity
                  key={pet.id}
                  style={styles.petCard}
                  activeOpacity={0.9}
                  onPress={() => setPetId(pet.id)}
                >
                  <AppImage
                    source={{ uri: pet.image }}
                    style={[
                      styles.petImage,
                      {
                        borderColor: active
                          ? colors.primary
                          : "transparent",
                      },
                    ]}
                  />
                  <AppText
                    variant="caption"
                    color={
                      active ? colors.primary : colors.onSurfaceVariant
                    }
                  >
                    {pet.name}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 24 }}>
            <AppText
              variant="body"
              color={colors.primary}
              style={{ textAlign: "center" }}
            >
              + or add another pet
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step === "date" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            Select date
          </AppText>
          <View style={styles.multiDayRow}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={{ flex: 1 }}
            >
              Need this service for more than 1 day
            </AppText>
            <Switch
              value={multiDay}
              onValueChange={setMultiDay}
              trackColor={{
                false: colors.surfaceContainerHighest,
                true: colors.primary,
              }}
              thumbColor={colors.onPrimary}
            />
          </View>
          <View style={styles.dateRow}>
            <View
              style={[
                styles.dateField,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.fieldLabel}
              >
                Start Date
              </AppText>
              <TextInput
                value={startDate}
                onChangeText={setStartDate}
                placeholder={t("post.request.details.startDate", "Start date")}
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.dateInput}
              />
            </View>
            <View
              style={[
                styles.dateField,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.fieldLabel}
              >
                End Date
              </AppText>
              <TextInput
                value={endDate}
                onChangeText={setEndDate}
                placeholder={t("post.request.details.endDate", "End date")}
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.dateInput}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {step === "time" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            Select start time
          </AppText>
          <View style={styles.dateRow}>
            <View
              style={[
                styles.dateField,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.fieldLabel}
              >
                Start Time
              </AppText>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="hh:mm"
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.dateInput}
              />
            </View>
            <View
              style={[
                styles.dateField,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.fieldLabel}
              >
                End Time
              </AppText>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="hh:mm"
                placeholderTextColor={colors.onSurfaceVariant}
                style={styles.dateInput}
              />
            </View>
          </View>
        </ScrollView>
      )}

      {step === "preview" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            Preview of your request
          </AppText>
          <View style={[styles.previewCard, { backgroundColor: colors.surface }]}>
            <AppImage
              source={{ uri: selectedPet.image }}
              style={styles.previewImage}
            />
            <View style={styles.previewContent}>
              <AppText variant="headline" style={{ fontSize: 18 }}>
                {selectedPet.name}
              </AppText>
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={{ marginTop: 4 }}
              >
                {careType} • {startDate || "Mar 14"} -{" "}
                {endDate || "Mar 18"} • {startTime} - {endTime}
              </AppText>
            </View>
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        <Button label={primaryLabel} onPress={goNext} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  progressBarWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  progressTrack: {
    height: 4,
    borderRadius: 999,
    flexDirection: "row",
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: 999,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  question: {
    fontSize: 16,
    marginBottom: 16,
  },
  careRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  careChip: {
    width: 72,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 2,
    paddingVertical: 10,
    gap: 4,
  },
  careIconPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F4D6D6",
  },
  careLabel: {
    fontSize: 12,
  },
  hintsCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  hintsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  hintsIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  petRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  petCard: {
    alignItems: "center",
    gap: 4,
  },
  petImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 3,
  },
  multiDayRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
  },
  dateField: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dateInput: {
    fontSize: 14,
  },
  previewCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 180,
  },
  previewContent: {
    padding: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

