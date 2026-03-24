import { Colors } from "@/src/constants/colors";
import type { PetKindId } from "@/src/constants/pet-kinds";
import { PetFormFields } from "@/src/features/pets/components/PetFormFields";
import { PetKindPickGrid } from "@/src/features/pets/components/PetKindPickGrid";
import { PetPhotoSelector } from "@/src/features/pets/components/PetPhotoSelector";
import { uploadToCloudinary } from "@/src/lib/cloudinary/upload";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { supabase } from "@/src/lib/supabase/client";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import { StepProgress } from "@/src/shared/components/ui/StepProgress";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { Search } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

type Step = "kind" | "breed" | "details";

const BREEDS_BY_KIND: Record<PetKindId, string[]> = {
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
  const { user } = useAuthStore();
  const colors = Colors[resolvedTheme];

  useFocusEffect(
    useCallback(() => {
      if (blockIfKycNotApproved()) {
        router.back();
      }
    }, [router]),
  );

  const [step, setStep] = useState<Step>("kind");
  const [kind, setKind] = useState<PetKindId | null>(null);
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
  const [isSaving, setIsSaving] = useState(false);

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

  const savePet = async (launchRequest: boolean) => {
    if (!user?.id) {
      Alert.alert(t("common.error", "Something went wrong"));
      return;
    }
    if (!kind || !breed || !petName.trim()) {
      Alert.alert(
        t("common.error", "Something went wrong"),
        t("pets.add.requiredFields", "Please complete required pet fields."),
      );
      return;
    }

    setIsSaving(true);
    try {
      let avatarUrl: string | null = null;
      if (photos[0]) {
        const uploaded = await uploadToCloudinary(photos[0]);
        avatarUrl = uploaded.secure_url;
      }

      const details = [
        petBio.trim(),
        specialNeeds && specialNeedsText.trim()
          ? `Special needs: ${specialNeedsText.trim()}`
          : "",
        yardType ? `Yard: ${yardType}` : "",
        ageRange ? `Age range: ${ageRange}` : "",
        energyLevel ? `Energy level: ${energyLevel}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { data: insertedPet, error } = await supabase
        .from("pets")
        .insert({
          owner_id: user.id,
          name: petName.trim(),
          species: kind,
          breed,
          avatar_url: avatarUrl,
          notes: details || null,
        })
        .select("*")
        .single();

      if (error || !insertedPet) {
        throw error ?? new Error("Could not save pet");
      }

      if (launchRequest) {
        router.replace({
          pathname: "/(private)/post-requests",
          params: { petId: insertedPet.id },
        });
        return;
      }

      router.back();
    } catch (err) {
      Alert.alert(
        t("common.error", "Something went wrong"),
        err instanceof Error ? err.message : t("common.error", "Something went wrong"),
      );
    } finally {
      setIsSaving(false);
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
          <PetKindPickGrid
            questionKey="pets.add.whatKind"
            selectedKind={kind}
            onSelect={(k) => {
              setKind(k);
              setBreed(null);
              setBreedQuery("");
            }}
          />
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
            <Button
              label={t("common.save", "Save")}
              onPress={() => {
                void savePet(false);
              }}
              loading={isSaving}
              disabled={isSaving}
            />
            <Button
              label={t(
                "post.request.publish.publish",
                "Save and Launch Care Request",
              )}
              onPress={() => {
                void savePet(true);
              }}
              variant="outline"
              fullWidth
              loading={isSaving}
              disabled={isSaving}
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
