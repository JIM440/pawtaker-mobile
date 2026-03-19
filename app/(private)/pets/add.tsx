import { Colors } from "@/src/constants/colors";
import { PetFormFields } from "@/src/features/pets/components/PetFormFields";
import { PetPhotoSelector } from "@/src/features/pets/components/PetPhotoSelector";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import { StepProgress } from "@/src/shared/components/ui/StepProgress";
import { useRouter } from "expo-router";
import { Search } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
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

const PET_KIND_ILLUSTRATIONS: Record<(typeof PET_KINDS)[number], number> = {
  Dog: require("@/assets/illustrations/dog.svg") as number,
  Cat: require("@/assets/illustrations/cat.svg") as number,
  "Small Furries": require("@/assets/illustrations/furry.svg") as number,
  Bird: require("@/assets/illustrations/bird.svg") as number,
  Reptile: require("@/assets/illustrations/reptile.svg") as number,
  Other: require("@/assets/illustrations/other.svg") as number,
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
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    const backAction = () => {
      if (step === "details") {
        setStep("breed");
        return true;
      } else if (step === "breed") {
        setStep("kind");
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [step]);

  const handleBack = () => {
    if (step === "details") {
      setStep("breed");
    } else if (step === "breed") {
      setStep("kind");
    } else {
      router.back();
    }
  };

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

  return (
    <PageContainer contentStyle={[styles.screen, { paddingHorizontal: 0 }]}>
      <BackHeader
        title=""
        onBack={handleBack}
        rightSlot={<StepProgress progress={progress} width={150} />

        }
      />

      {step === "kind" && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                          : colors.surfaceContainerHighest,
                        backgroundColor: colors.surfaceContainerHighest,
                      },
                    ]}
                  >
                    <View style={styles.kindIllustrationWrapper}>
                      <AppImage
                        source={PET_KIND_ILLUSTRATIONS[k]}
                        type="svg"
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
            <View style={{
              marginBottom: 16,

            }}>
              <AppText style={{ color: colors.onSurface, fontSize: 12 }}>
                Your pet is a:{" "}
                <Text
                  style={{
                    lineHeight: 0,
                    borderRadius: 8,
                    color: colors.primary,
                    fontSize: 12,
                  }}
                >
                  {kind}
                </Text>
              </AppText>
            </View>
          )}
          <Input
            placeholder={t("pets.add.breedSearch", "Search pet breed")}
            value={breedQuery}
            onChangeText={setBreedQuery}
            rightIcon={<Search size={22} color={colors.onSurfaceVariant} />}
            containerStyle={{ ...styles.searchField, backgroundColor: colors.surfaceContainerLow, marginBottom: 12 }}
            inputStyle={{ paddingTop: 0, paddingBottom: 0 }}
            onFocus={() => { }}
            onBlur={() => { }}
          />
          <View
            style={[
              styles.breedList,
              {
                backgroundColor: colors.surfaceBright,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            {filteredBreeds.map((item, index) => {
              const active = breed === item;
              const isLast = index === filteredBreeds.length - 1;
              return (
                <TouchableOpacity
                  key={item}
                  style={{
                    ...styles.breedRow,
                    backgroundColor: active
                      ? colors.surfaceContainer
                      : colors.surfaceBright,
                    borderBottomWidth: isLast ? 0 : 0.8,
                    borderBottomColor: colors.outlineVariant,
                  }}
                  onPress={() => setBreed(item)}
                >
                  <AppText
                    variant="body"
                    color={colors.onSurfaceVariant}
                    style={{
                      paddingHorizontal: 16,
                    }}
                  >
                    {item}
                  </AppText>
                </TouchableOpacity>
              );
            })}
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

          <PetPhotoSelector photos={photos} setPhotos={setPhotos} />

          <PetFormFields
            petName={petName}
            setPetName={setPetName}
            petBio={petBio}
            setPetBio={setPetBio}
            yardType={yardType}
            setYardType={setYardType}
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            energyLevel={energyLevel}
            setEnergyLevel={setEnergyLevel}
            specialNeeds={specialNeeds}
            setSpecialNeeds={setSpecialNeeds}
            specialNeedsText={specialNeedsText}
            setSpecialNeedsText={setSpecialNeedsText}
            premiumStyle={false}
          />
        </ScrollView>
      )}

      <View style={styles.footer}>
        {step === "kind" ? (
          <Button
            label={primaryLabel}
            onPress={goNext}
            fullWidth
            disabled={!kind}
          />
        ) : step === "breed" ? (
          <View style={styles.buttonRow}>
            <Button
              label={t("common.back", "Back")}
              onPress={handleBack}
              variant="secondary"
              style={{ flex: 1 }}
            />
            <Button
              label={primaryLabel}
              onPress={goNext}
              style={{ flex: 2 }}
              disabled={!breed}
            />
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            <Button label={t("common.save", "Save")} onPress={goNext} />
            <Button
              label={t(
                "post.request.publish.publish",
                "Save and Launch Care Request",
              )}
              onPress={goNext}
              variant="outline"
              fullWidth
            />
          </View>
        )}
      </View>
    </PageContainer>
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
    borderWidth: 3,
    padding: 20,
    height: 160
  },
  kindIllustrationWrapper: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    height: 98
  },
  kindLabel: {
    fontSize: 14,
    fontWeight: "600"
  },
  searchField: {
    borderRadius: 999,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 0
  },
  breedList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  breedRow: {
    paddingVertical: 10,
  },
  footer: {
    padding: 16,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
});
