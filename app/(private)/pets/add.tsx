import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { StepProgress } from "@/src/shared/components/ui/StepProgress";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { DateTimeField } from "@/src/shared/components/forms/DateTimeField";
import { Input } from "@/src/shared/components/ui/Input";

type Step = "kind" | "breed" | "details";

const PET_KINDS = [
  "Dog",
  "Cat",
  "Small Furries",
  "Bird",
  "Reptile",
  "Other",
] as const;

const PET_KIND_ILLUSTRATIONS: Record<(typeof PET_KINDS)[number], number> = {
  Dog: require("@/assets/illustrations/dog.png") as number,
  Cat: require("@/assets/illustrations/cat.png") as number,
  "Small Furries": require("@/assets/illustrations/furry.png") as number,
  Bird: require("@/assets/illustrations/bird.png") as number,
  Reptile: require("@/assets/illustrations/reptile.png") as number,
  Other: require("@/assets/illustrations/other.png") as number,
};

const BREEDS_BY_KIND: Record<(typeof PET_KINDS)[number], string[]> = {
  Dog: ["Afghan Hound", "Africanis", "Barbet", "Basenji", "Cesky Terrier"],
  Cat: ["Tabby", "Siamese", "Persian", "Maine Coon", "Sphynx"],
  "Small Furries": ["Rabbit", "Guinea Pig", "Hamster", "Ferret"],
  Bird: ["Parakeet", "Cockatiel", "Parrot", "Canary"],
  Reptile: ["Bearded Dragon", "Leopard Gecko", "Corn Snake", "Turtle"],
  Other: ["Mixed", "Unknown"],
};

export default function AddPetScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<(typeof PET_KINDS)[number] | null>(null);
  const [breedQuery, setBreedQuery] = useState("");
  const [breed, setBreed] = useState<string | null>(null);

  const [petName, setPetName] = useState("Polo");
  const [petBio, setPetBio] = useState(
    "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained Retriever",
  );
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [specialNeedsText, setSpecialNeedsText] = useState("");
  const [yardType, setYardType] = useState<string | null>(null);
  const [dob, setDob] = useState<Date | null>(null);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [energyLevel, setEnergyLevel] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  const filteredBreeds = useMemo(() => {
    const baseBreeds = kind ? (BREEDS_BY_KIND[kind] ?? []) : [];
    const q = breedQuery.trim().toLowerCase();
    if (!q) return baseBreeds;
    return baseBreeds.filter((b) => b.toLowerCase().includes(q));
  }, [breedQuery, kind]);

  const progress = step === "kind" ? 0.33 : step === "breed" ? 0.66 : 1;

  const goNext = () => {
    if (step === "kind") {
      if (!kind) {
        return;
      }
      setStep("breed");
    } else if (step === "breed") {
      if (!breed) {
        return;
      }
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

  const handlePickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setPhotos((prev) => [...prev, ...uris]);
    }
  };

  const dobDisplay = dob
    ? dob.toLocaleDateString()
    : t("pets.add.dob.placeholder", "Select date of birth");

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackHeader
        title={t("pets.add.title", "Add Pet")}
        rightSlot={
          <StepProgress progress={progress} width={120} />
        }
      />

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
                  style={styles.kindCard}
                  activeOpacity={0.9}
                  onPress={() => {
                    setKind(k);
                    setBreed(null);
                    setBreedQuery("");
                  }}
                >
                  <View
                    style={[
                      styles.kindBox,
                      {
                        borderColor: active
                          ? colors.primary
                          : colors.surfaceContainer,
                        backgroundColor: colors.surfaceContainer,
                      },
                    ]}
                  >
                    <View style={styles.kindIllustrationWrapper}>
                      <AppImage
                        source={PET_KIND_ILLUSTRATIONS[k]}
                        style={{ backgroundColor: "transparent" }}
                        contentFit="contain"
                        height={98}
                        width={98}
                      />
                    </View>
                  </View>
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
              <View style={[styles.chip]}>
                <AppText variant="caption">
                  Your pet is a:{" "}
                  <AppText
                    variant="caption"
                    style={{
                      backgroundColor: colors.tertiaryContainer,
                      color: colors.tertiary,
                      paddingHorizontal: 4,
                      paddingVertical: 2,
                      borderRadius: 4,
                    }}
                  >
                    {kind}
                  </AppText>
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
            <Input
              containerStyle={{ marginBottom: 0 }}
              inputStyle={[styles.searchInput, { borderColor: "transparent", paddingHorizontal: 0, paddingVertical: 0 }]}
              placeholder={t("common.search", "Search")}
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
                      color={active ? colors.primary : colors.onSurfaceVariant}
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

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePickImages}
            style={[
              styles.photoCard,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            {photos.length === 0 ? (
              <AppText
                variant="body"
                color={colors.onSurfaceVariant}
                style={{ textAlign: "center" }}
              >
                + Add Pet Photos
              </AppText>
            ) : (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photoScrollContent}
              >
                {photos.map((uri) => (
                  <View key={uri} style={styles.photoSlide}>
                    <AppImage
                      source={{ uri }}
                      style={styles.photoImage}
                      contentFit="cover"
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.takePhotosBtn,
              {
                borderColor: colors.outlineVariant,
                backgroundColor: colors.surface,
              },
            ]}
            activeOpacity={0.9}
            onPress={handleTakePhoto}
          >
            <Camera size={18} color={colors.onSurface} />
            <AppText
              variant="body"
              color={colors.onSurface}
              style={{ marginLeft: 8 }}
            >
              or take new photos
            </AppText>
          </TouchableOpacity>

          <View style={styles.field}>
            <Input
              label="Pet name"
              value={petName}
              onChangeText={setPetName}
              containerStyle={{ marginBottom: 0 }}
              inputStyle={[styles.fieldInput, { backgroundColor: colors.surfaceContainerHighest }]}
            />
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.helperText}
            >
              {petName.length}/50
            </AppText>
          </View>

          <View style={styles.field}>
            <Input
              label="Pet Short Bio"
              value={petBio}
              onChangeText={setPetBio}
              containerStyle={{ marginBottom: 0 }}
              inputStyle={[
                styles.textArea,
                {
                  backgroundColor: colors.surfaceContainerHighest,
                  borderColor: colors.outlineVariant,
                },
              ]}
              multiline
            />
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.helperText}
            >
              {petBio.length}/300
            </AppText>
          </View>

          {/* Placeholder chips/controls for yard, age, energy etc. */}
          <AppText
            variant="label"
            color={colors.onSurface}
            style={styles.sectionTitle}
          >
            Details
          </AppText>

          <View style={styles.chipGroup}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.chipGroupLabel}
            >
              Yard Type
            </AppText>
            <View style={styles.chipRowWrap}>
              {["none needed", "fenced yard", "small yard", "high fence"].map(
                (label) => {
                  const active = yardType === label;
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[
                        styles.chipPill,
                        {
                          backgroundColor: active
                            ? colors.primary
                            : colors.surfaceContainerHighest,
                        },
                      ]}
                      onPress={() => setYardType(label)}
                    >
                      <AppText
                        variant="caption"
                        color={
                          active ? colors.onPrimary : colors.onSurfaceVariant
                        }
                      >
                        {label}
                      </AppText>
                    </TouchableOpacity>
                  );
                },
              )}
            </View>
          </View>

          <View style={styles.field}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.fieldLabel}
            >
              Date of birth
            </AppText>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowDobPicker(true)}
              style={[
                styles.fieldInput,
                styles.dateLikeInput,
                {
                  backgroundColor: colors.surfaceContainerHighest,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <AppText
                variant="body"
                color={
                  dob ? colors.onSurface : colors.onSurfaceVariant
                }
              >
                {dobDisplay}
              </AppText>
            </TouchableOpacity>
          </View>

          <View style={styles.chipGroup}>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.chipGroupLabel}
            >
              Energy Level
            </AppText>
            <View style={styles.chipRowWrap}>
              {["calm", "medium energy", "high energy"].map((label) => {
                const active = energyLevel === label;
                return (
                  <TouchableOpacity
                    key={label}
                    style={[
                      styles.chipPill,
                      {
                        backgroundColor: active
                          ? colors.primary
                          : colors.surfaceContainerHighest,
                      },
                    ]}
                    onPress={() => setEnergyLevel(label)}
                  >
                    <AppText
                      variant="caption"
                      color={
                        active ? colors.onPrimary : colors.onSurfaceVariant
                      }
                    >
                      {label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.toggleRow}>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={{ flex: 1 }}
            >
              Does your pet have special needs?
            </AppText>
            <Switch
              value={specialNeeds}
              onValueChange={setSpecialNeeds}
              trackColor={{
                false: colors.surfaceContainerHighest,
                true: colors.primary,
              }}
              thumbColor={colors.surface}
            />
          </View>
        </ScrollView>
      )}

      <View style={styles.footer}>
        {step === "details" ? (
          <>
            <Button
              label={t("common.save", "Save")}
              onPress={() => router.back()}
              fullWidth
              style={{ marginBottom: 8 }}
            />
            <Button
              label={t(
                "post.request.publish.publish",
                "Save and Launch Care Request",
              )}
              onPress={goNext}
              fullWidth
              variant="outline"
            />
          </>
        ) : (
          <Button
            label={primaryLabel}
            onPress={goNext}
            fullWidth
            disabled={
              (step === "kind" && !kind) || (step === "breed" && !breed)
            }
          />
        )}
      </View>

      {showDobPicker && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <DateTimeField
            mode="date"
            label={t("pets.add.age", "Age (years)")}
            value={dob}
            onChange={(d) => {
              setDob(d);
              setShowDobPicker(false);
            }}
            placeholder={t("availability.selectStart", "Select start")}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
    alignItems: "center",
    gap: 8,
  },
  kindBox: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
  },
  kindIllustrationWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
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
    height: 200,
    alignItems: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  photoScrollContent: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  photoSlide: {
    width: 260,
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 8,
  },
  photoImage: {
    width: 260,
    height: "100%",
    borderRadius: 12,
    marginHorizontal: 8,
  },
  field: {
    marginBottom: 12,
  },
  fieldLabel: {
    marginBottom: 4,
    fontSize: 12,
    fontWeight: "500",
  },
  fieldInput: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  dateLikeInput: {
    justifyContent: "center",
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
  chipGroup: {
    marginTop: 12,
  },
  chipGroupLabel: {
    marginBottom: 6,
    fontSize: 12,
    fontWeight: "500",
  },
  chipRowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chipPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  helperText: {
    marginTop: 4,
    fontSize: 10,
  },
  takePhotosBtn: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  progressInline: {
    width: 120,
    marginLeft: 12,
  },
});
