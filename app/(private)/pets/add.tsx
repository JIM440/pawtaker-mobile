import { Colors } from "@/src/constants/colors";
import { BREEDS_BY_KIND } from "@/src/constants/pet-breeds";
import type { PetKindId } from "@/src/constants/pet-kinds";
import { PetBreedStep } from "@/src/features/pets/components/PetBreedStep";
import { PetFormFields } from "@/src/features/pets/components/PetFormFields";
import { PetKindPickGrid } from "@/src/features/pets/components/PetKindPickGrid";
import { PetPhotoSelector } from "@/src/features/pets/components/PetPhotoSelector";
import {
  CLOUDINARY_GALLERY_UPLOAD_PRESET,
  uploadToCloudinary,
} from "@/src/lib/cloudinary/upload";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import {
  shouldBlockImageLikeSubmission,
  shouldBlockTextSubmission,
} from "@/src/lib/moderation/content-moderation";
import { isRemotePetPhotoUri } from "@/src/lib/pets/petGalleryUrls";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { StepProgress } from "@/src/shared/components/ui/StepProgress";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type Step = "kind" | "breed" | "details";

export default function AddPetScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const showToast = useToastStore((s) => s.showToast);

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

  const [petName, setPetName] = useState("");
  const [petBio, setPetBio] = useState("");
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
      showToast({
        variant: "error",
        message: t("pets.add.signInRequired"),
        durationMs: 3000,
      });
      return;
    }
    if (!kind || !breed || !petName.trim()) {
      showToast({
        variant: "error",
        message: t("pets.add.requiredFields"),
        durationMs: 3000,
      });
      return;
    }

    if (
      shouldBlockTextSubmission(petBio) ||
      shouldBlockTextSubmission(specialNeedsText)
    ) {
      showToast({
        variant: "error",
        message: t(
          "moderation.blockedText",
          "This content was blocked because it may be explicit.",
        ),
        durationMs: 3600,
      });
      return;
    }

    const hasBlockedImageHint = photos.some((uri) =>
      shouldBlockImageLikeSubmission({ uri }),
    );
    if (hasBlockedImageHint) {
      showToast({
        variant: "error",
        message: t(
          "moderation.blockedImage",
          "One or more images were blocked because they may be explicit.",
        ),
        durationMs: 3600,
      });
      return;
    }

    setIsSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (const uri of photos) {
        if (!uri?.trim()) continue;
        const trimmed = uri.trim();
        if (isRemotePetPhotoUri(trimmed)) {
          uploadedUrls.push(trimmed);
          continue;
        }
        const uploaded = await uploadToCloudinary(
          trimmed,
          CLOUDINARY_GALLERY_UPLOAD_PRESET,
        );
        uploadedUrls.push(uploaded.secure_url);
      }
      // `pets.notes` stores only the pet bio + special needs.
      // Yard/age/energy are stored as dedicated columns.
      const notes = [
        petBio.trim(),
        specialNeeds && specialNeedsText.trim()
          ? `Special needs: ${specialNeedsText.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { data: insertedRaw, error } = await supabase
        .from("pets")
        .insert({
          owner_id: user.id,
          name: petName.trim(),
          species: kind,
          breed,
          photo_urls: uploadedUrls,
          notes: notes || null,
          yard_type: yardType,
          age_range: ageRange,
          energy_level: energyLevel,
        } as any)
        .select("*")
        .single();

      if (error || !insertedRaw) {
        throw error ?? new Error("Could not save pet");
      }
      const insertedPet = insertedRaw as { id: string };

      if (launchRequest) {
        showToast({
          variant: "success",
          message: t("pets.add.saved", "Pet saved successfully."),
          durationMs: 2400,
        });
        router.replace({
          pathname: "/(private)/post-requests",
          params: { petId: insertedPet.id },
        });
        return;
      }

      showToast({
        variant: "success",
        message: t("pets.add.saved", "Pet saved successfully."),
        durationMs: 2400,
      });
      router.replace({
        pathname: "/(private)/(tabs)/profile",
        params: { tab: "pets", refreshPets: "true" },
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: t("pets.add.saveFailed"),
        durationMs: 3400,
      });
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
        rightSlot={<StepProgress progress={progress} width={150} />}
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
        <PetBreedStep
          kind={kind}
          breed={breed}
          breedQuery={breedQuery}
          filteredBreeds={filteredBreeds}
          colors={colors}
          styles={styles}
          t={(key, fallback) => t(key, fallback as string)}
          setBreedQuery={setBreedQuery}
          setBreed={setBreed}
        />
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
            {t("pets.add.moreDetails")}
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
              label={
                isSaving
                  ? t("common.saving", "Saving...")
                  : t("common.save", "Save")
              }
              onPress={() => {
                void savePet(false);
              }}
              loading={isSaving}
              disabled={isSaving}
            />
            <Button
              label={
                isSaving
                  ? t("common.saving", "Saving...")
                  : t(
                      "post.request.publish.publish",
                      "Save and Launch Care Request",
                    )
              }
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
    borderWidth: 0,
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
