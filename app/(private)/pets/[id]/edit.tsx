import { Colors } from "@/src/constants/colors";
import { PET_TYPE_OPTIONS, PetKind } from "@/src/constants/pets";
import { PetFormFields } from "@/src/features/pets/components/PetFormFields";
import { PetPhotoSelector } from "@/src/features/pets/components/PetPhotoSelector";
import {
  CLOUDINARY_GALLERY_UPLOAD_PRESET,
  uploadToCloudinary,
} from "@/src/lib/cloudinary/upload";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import {
  isRemotePetPhotoUri,
  petGalleryUrls,
} from "@/src/lib/pets/petGalleryUrls";
import type { TablesRow } from "@/src/lib/supabase/types";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { Button } from "@/src/shared/components/ui/Button";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

import { AppText } from "@/src/shared/components/ui/AppText";
import { Input as AppInput } from "@/src/shared/components/ui/Input";
import { PetKindSelector } from "@/src/shared/components/ui/PetKindSelector";

const BREEDS_BY_KIND: Record<string, string[]> = {
  Dog: [
    "Afghan Hound",
    "Africanis",
    "Barbet",
    "Basenji",
    "Cesky Terrier",
    "Golden Retriever",
    "Beagle",
    "Poodle",
  ],
  Cat: ["Tabby", "Siamese", "Persian", "Maine Coon", "Sphynx"],
  "Small Furries": ["Rabbit", "Guinea Pig", "Hamster", "Ferret"],
  Bird: ["Parakeet", "Cockatiel", "Parrot", "Canary"],
  Reptile: ["Bearded Dragon", "Leopard Gecko", "Corn Snake", "Turtle"],
  Other: ["Mixed", "Unknown"],
};

export default function EditPetScreen() {
  const { id: _petId } = useLocalSearchParams<{ id: string }>();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const { t } = useTranslation();

  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const [petFeedback, setPetFeedback] = useState<{
    title: string;
    description: string;
    onAfterDismiss?: () => void;
  } | null>(null);

  // Load real pet details by id
  const [photos, setPhotos] = useState<string[]>([]);
  const [petName, setPetName] = useState("");
  const [petBio, setPetBio] = useState("");

  const [yardType, setYardType] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<string | null>(null);
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [specialNeedsText, setSpecialNeedsText] = useState("");

  const [kind, setKind] = useState<PetKind | "">("");
  const [breed, setBreed] = useState<string>("");
  const [breedQuery, setBreedQuery] = useState("");
  const [showBreedList, setShowBreedList] = useState(false);

  const handleSave = async () => {
    if (!user?.id || !_petId) return;
    if (!kind || !breed || !petName.trim()) {
      setPetFeedback({
        title: t("common.error", "Something went wrong"),
        description: t(
          "pets.add.requiredFields",
          "Please complete required pet fields.",
        ),
      });
      return;
    }

    try {
      setIsSaving(true);

      const nextUrls: string[] = [];
      for (const p of photos) {
        if (!p?.trim()) continue;
        const trimmed = p.trim();
        if (isRemotePetPhotoUri(trimmed)) {
          nextUrls.push(trimmed);
          continue;
        }
        const uploaded = await uploadToCloudinary(
          trimmed,
          CLOUDINARY_GALLERY_UPLOAD_PRESET,
        );
        nextUrls.push(uploaded.secure_url);
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

      const { error } = await supabase
        .from("pets")
        .update({
          name: petName.trim(),
          species: kind,
          breed,
          photo_urls: nextUrls,
          notes: details || null,
        })
        .eq("id", _petId)
        .eq("owner_id", user.id);

      if (error) throw error;

      router.replace({
        pathname: "/(private)/(tabs)/profile",
        params: { tab: "pets", refreshPets: "true" },
      });
      showToast({
        variant: "success",
        message: t("pets.edit.saved", "Pet updated successfully."),
        durationMs: 2400,
      });
    } catch (err) {
      const details =
        err instanceof Error ? err.message : t("common.error", "Something went wrong");
      const friendly = t("pets.edit.saveFailed", "Couldn't update this pet. Please try again.");
      setPetFeedback({
        title: t("common.error", "Something went wrong"),
        description: `${friendly}\n\nDetails: ${details}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !_petId) return;
    let mounted = true;
    void (async () => {
      try {
        setIsLoading(true);
        const { data: petRaw, error } = await supabase
          .from("pets")
          .select("*")
          .eq("id", _petId)
          .eq("owner_id", user.id)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;
        const pet = petRaw as TablesRow<"pets"> | null;
        if (!pet) {
          setPetFeedback({
            title: t("common.error", "Something went wrong"),
            description: t("pets.edit.petNotFound", "Pet not found."),
            onAfterDismiss: () => router.back(),
          });
          return;
        }

        const gallery = petGalleryUrls(pet);
        setPhotos(gallery.length > 0 ? gallery : []);
        setPetName(pet.name ?? "");

        const notes = typeof pet.notes === "string" ? pet.notes : "";
        const lines = notes
          .split("\n")
          .map((l: string) => l.trim())
          .filter(Boolean);

        setPetBio(lines[0] ?? "");

        const specialLine = lines.find((l: string) =>
          l.toLowerCase().startsWith("special needs:"),
        );
        if (specialLine) {
          setSpecialNeeds(true);
          setSpecialNeedsText(
            specialLine.replace(/special needs:\s*/i, ""),
          );
        } else {
          setSpecialNeeds(false);
          setSpecialNeedsText("");
        }

        const yardLine = lines.find((l: string) =>
          l.toLowerCase().startsWith("yard:"),
        );
        if (yardLine) setYardType(yardLine.replace(/yard:\s*/i, ""));

        const ageLine = lines.find((l: string) =>
          l.toLowerCase().startsWith("age range:"),
        );
        if (ageLine) setAgeRange(ageLine.replace(/age range:\s*/i, ""));

        const energyLine = lines.find((l: string) =>
          l.toLowerCase().startsWith("energy level:"),
        );
        if (energyLine) setEnergyLevel(energyLine.replace(/energy level:\s*/i, ""));

        setKind((pet.species as PetKind) || "");
        setBreed(pet.breed ?? "");
        setBreedQuery("");
        setShowBreedList(false);
      } catch (err) {
        const details =
          err instanceof Error ? err.message : t("common.error", "Something went wrong");
        const friendly = t("pets.edit.loadFailed", "Couldn't load pet details. Please try again.");
        setPetFeedback({
          title: t("common.error", "Something went wrong"),
          description: `${friendly}\n\nDetails: ${details}`,
          onAfterDismiss: () => router.back(),
        });
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [_petId, user?.id, t, router]);

  const filteredBreeds = useMemo(() => {
    const baseBreeds = kind ? (BREEDS_BY_KIND[kind] ?? []) : [];
    const q = breedQuery.trim().toLowerCase();
    if (!q) return baseBreeds;
    return baseBreeds.filter((b: string) => b.toLowerCase().includes(q));
  }, [breedQuery, kind]);

  return (
    <PageContainer style={{ paddingHorizontal: 0 }}>
      <BackHeader title={t("pets.edit.title", "Edit pet")} className="pl-0" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PetPhotoSelector photos={photos} setPhotos={setPhotos} />

        <View style={styles.section}>
          <AppText variant="label" style={styles.sectionTitle}>
            {t("pets.edit.kind", "Pet kind")}
          </AppText>
          <PetKindSelector
            options={Array.from(PET_TYPE_OPTIONS)}
            selectedKeys={kind ? [kind] : []}
            onToggle={(k) => {
              setKind(k as PetKind);
              setBreed("");
              setBreedQuery("");
            }}
            variant="small"
          />
        </View>

        <View style={styles.section}>
          <AppInput
            label={t("pets.edit.breed", "Breed")}
            placeholder={t("pets.add.breedSearch", "Search pet breed")}
            value={breed || breedQuery}
            onChangeText={(v) => {
              setBreed("");
              setBreedQuery(v);
              setShowBreedList(true);
            }}
            onFocus={() => setShowBreedList(true)}
          />
          {showBreedList && filteredBreeds.length > 0 && (
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
                    style={[
                      styles.breedRow,
                      {
                        backgroundColor: active
                          ? colors.surfaceContainer
                          : colors.surfaceBright,
                        borderBottomWidth: isLast ? 0 : 0.8,
                        borderBottomColor: colors.outlineVariant,
                      },
                    ]}
                    onPress={() => {
                      setBreed(item);
                      setBreedQuery(item);
                      setShowBreedList(false);
                    }}
                  >
                    <AppText
                      variant="body"
                      color={colors.onSurfaceVariant}
                      style={{ paddingHorizontal: 16 }}
                    >
                      {item}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

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
          premiumStyle={true}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={
            isSaving
              ? t("common.saving", "Saving...")
              : t("common.save", "Save")
          }
          variant="primary"
          fullWidth
          onPress={() => void handleSave()}
          loading={isSaving}
          disabled={isSaving || isLoading}
        />
      </View>

      <FeedbackModal
        visible={petFeedback !== null}
        title={petFeedback?.title ?? ""}
        description={petFeedback?.description}
        primaryLabel={t("common.ok", "OK")}
        onPrimary={() => {
          const cb = petFeedback?.onAfterDismiss;
          setPetFeedback(null);
          cb?.();
        }}
        onRequestClose={() => {
          const cb = petFeedback?.onAfterDismiss;
          setPetFeedback(null);
          cb?.();
        }}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  breedList: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: -8,
    marginBottom: 16,
  },
  breedRow: {
    paddingVertical: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});
