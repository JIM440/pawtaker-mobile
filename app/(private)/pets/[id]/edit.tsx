import { Colors } from "@/src/constants/colors";
import { PET_TYPE_OPTIONS, PetKind } from "@/src/constants/pets";
import { PetFormFields } from "@/src/features/pets/components/PetFormFields";
import { PetPhotoSelector } from "@/src/features/pets/components/PetPhotoSelector";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { Button } from "@/src/shared/components/ui/Button";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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

  // TODO: replace with real data load by id
  const [photos, setPhotos] = useState<string[]>([]);
  const [petName, setPetName] = useState("Polo");
  const [petBio, setPetBio] = useState(
    "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch.",
  );

  const [yardType, setYardType] = useState("fenced yard");
  const [ageRange, setAgeRange] = useState("1-3yrs");
  const [energyLevel, setEnergyLevel] = useState("medium energy");
  const [specialNeeds, setSpecialNeeds] = useState(false);
  const [specialNeedsText, setSpecialNeedsText] = useState("");

  const handleSave = () => {
    // TODO: persist edited pet
    router.back();
  };

  const [kind, setKind] = useState<PetKind>("Dog");
  const [breed, setBreed] = useState<string>("Golden Retriever");
  const [breedQuery, setBreedQuery] = useState("");
  const [showBreedList, setShowBreedList] = useState(false);

  const filteredBreeds = useMemo(() => {
    const baseBreeds = BREEDS_BY_KIND[kind] ?? [];
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
            selectedKeys={[kind]}
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
          label={t("common.save", "Save")}
          variant="primary"
          fullWidth
          onPress={handleSave}
        />
      </View>
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
