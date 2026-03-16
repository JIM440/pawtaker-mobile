import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type Step = "kind" | "breed" | "details";

const PET_KINDS = [
  "Dog",
  "Cat",
  "Small Furries",
  "Bird",
  "Reptile",
  "Other",
] as const;

const BREEDS = [
  "Afghan Hound",
  "Africanis",
  "Barbet",
  "Basenji",
  "Cesky Terrier",
];

export default function AddPetScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<string | null>(null);
  const [breedQuery, setBreedQuery] = useState("");
  const [breed, setBreed] = useState<string | null>(null);

  const [petName, setPetName] = useState("Polo");
  const [petBio, setPetBio] = useState(
    "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained Retriever"
  );
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [specialNeedsText, setSpecialNeedsText] = useState("");

  const filteredBreeds = useMemo(() => {
    const q = breedQuery.trim().toLowerCase();
    if (!q) return BREEDS;
    return BREEDS.filter((b) => b.toLowerCase().includes(q));
  }, [breedQuery]);

  const progress = step === "kind" ? 0.33 : step === "breed" ? 0.66 : 1;

  const goNext = () => {
    if (step === "kind") {
      setStep("breed");
    } else if (step === "breed") {
      setStep("details");
    } else {
      // final submit
      router.back();
    }
  };

  const primaryLabel =
    step === "details"
      ? t("post.request.publish.publish", "Save and Launch Care Request")
      : t("common.next", "Next");

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackHeader title={t("pets.add.title", "Add Pet")} />

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

      {step === "kind" && (
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
            What kind of pet?
          </AppText>
          <View style={styles.grid}>
            {PET_KINDS.map((k) => {
              const active = kind === k;
              return (
                <TouchableOpacity
                  key={k}
                  style={[
                    styles.kindCard,
                    {
                      borderColor: active
                        ? colors.primary
                        : colors.surfaceContainerHighest,
                      backgroundColor: colors.surfaceContainerHighest,
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setKind(k)}
                >
                  <View style={styles.kindIllustration} />
                  <AppText
                    variant="body"
                    style={styles.kindLabel}
                    color={active ? colors.primary : colors.onSurface}
                  >
                    {k}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {step === "breed" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            What breed is your pet?
          </AppText>
          {kind && (
            <View style={styles.chipRow}>
              <View
                style={[
                  styles.chip,
                  { backgroundColor: colors.secondaryContainer },
                ]}
              >
                <AppText
                  variant="caption"
                  color={colors.onSecondaryContainer}
                >
                  {t("pets.add.species", "Species")}: {kind}
                </AppText>
              </View>
            </View>
          )}
          <View
            style={[
              styles.searchField,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <TextInput
              style={[styles.searchInput, { color: colors.onSurface }]}
              placeholder={t("common.search", "Search")}
              placeholderTextColor={colors.onSurfaceVariant}
              value={breedQuery}
              onChangeText={setBreedQuery}
            />
          </View>
          <View
            style={[
              styles.breedList,
              {
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <FlatList
              data={filteredBreeds}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const active = breed === item;
                return (
                  <TouchableOpacity
                    style={styles.breedRow}
                    onPress={() => setBreed(item)}
                  >
                    <AppText
                      variant="body"
                      color={
                        active ? colors.primary : colors.onSurfaceVariant
                      }
                    >
                      {item}
                    </AppText>
                  </TouchableOpacity>
                );
              }}
              ItemSeparatorComponent={() => (
                <View
                  style={{
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: colors.outlineVariant,
                  }}
                />
              )}
              style={{ maxHeight: 220 }}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </ScrollView>
      )}

      {step === "details" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.question}
          >
            Just some more details
          </AppText>

          <View
            style={[
              styles.photoCard,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={{ textAlign: "center" }}
            >
              + Add Pet Photos
            </AppText>
          </View>

          <View style={styles.field}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.fieldLabel}
            >
              Pet name
            </AppText>
            <TextInput
              style={[
                styles.fieldInput,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
              value={petName}
              onChangeText={setPetName}
            />
          </View>

          <View style={styles.field}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.fieldLabel}
            >
              Pet Short Bio
            </AppText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surfaceContainerHighest,
                  borderColor: colors.outlineVariant,
                },
              ]}
              multiline
              value={petBio}
              onChangeText={setPetBio}
            />
          </View>

          {/* Placeholder chips/controls for yard, age, energy etc. */}
          <AppText
            variant="label"
            color={colors.onSurface}
            style={styles.sectionTitle}
          >
            Details
          </AppText>
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  kindCard: {
    width: "48%",
    borderRadius: 16,
    borderWidth: 2,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  kindIllustration: {
    width: 80,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#F9E4E8",
  },
  kindLabel: {
    fontSize: 14,
  },
  chipRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  searchField: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    fontSize: 14,
  },
  breedList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  breedRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  photoCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 40,
    alignItems: "center",
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 4,
    fontSize: 12,
  },
  fieldInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 96,
    textAlignVertical: "top",
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

