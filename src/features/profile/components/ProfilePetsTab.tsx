import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { LikedPetCard } from "@/src/shared/components/cards/LikedPetCard";
import { DataState } from "@/src/shared/components/ui";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { Button } from "@/src/shared/components/ui/Button";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

export type ProfilePet = {
  id: string;
  imageSource: string;
  petName: string;
  breed: string;
  petType: string;
  bio: string;
  yardType?: string | null;
  ageRange?: string | null;
  energyLevel?: string | null;
  tags?: string[];
  seekingDateRange?: string;
  seekingTime?: string;
};

type Props = {
  pets: ProfilePet[];
  onAddPet?: () => void;
  showAddPetButton?: boolean;
  onPetPress?: (petId: string) => void;
};

export function ProfilePetsTab({
  pets,
  onAddPet,
  showAddPetButton = true,
  onPetPress,
}: Props) {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const themeColors = Colors[resolvedTheme];
  const hasPets = pets.length > 0;

  if (!hasPets) {
    return (
      <View style={styles.emptyState}>
        <DataState
          title={t("post.request.emptyPetsTitle", "No pets yet")}
          message={t(
            "post.request.emptyPetsSubtitle",
            "You have not added any pets yet",
          )}
          illustration={
            <AppImage
              source={require("@/assets/illustrations/pets/no-pet.svg")}
              type="svg"
              style={[
                styles.emptyIllustration,
                { backgroundColor: "transparent" },
              ]}
              height={145}
            />
          }
          actionLabel={
            showAddPetButton && onAddPet
              ? t("post.request.addAPet", "+ Add a pet")
              : undefined
          }
          onAction={showAddPetButton ? onAddPet : undefined}
          mode="inline"
        />
      </View>
    );
  }

  return (
    <View style={styles.petList}>
      {showAddPetButton && onAddPet && (
        <Button
          label="+ Add a pet"
          variant="outline"
          onPress={onAddPet}
          style={styles.addPetBtn}
        />
      )}
      <View style={styles.petListContainer}>
        {pets.map((pet) => (
          <LikedPetCard
            key={pet.id}
            colors={themeColors}
            imageSource={pet.imageSource}
            petName={pet.petName}
            breed={pet.breed}
            petType={pet.petType}
            dateRange={pet.seekingDateRange ?? ""}
            time={pet.seekingTime ?? ""}
            description={pet.bio}
            yardType={pet.yardType}
            ageRange={pet.ageRange}
            energyLevel={pet.energyLevel}
            tags={pet.tags ?? []}
            isSeeking={Boolean(pet.seekingDateRange)}
            showOverflowMenu={false}
            onCardPress={() => onPetPress?.(pet.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  petList: {
    gap: 8,
    paddingBottom: 24,
    paddingHorizontal: 16,
  },
  petListContainer: {
    marginTop: 12,
    gap: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  addPetBtn: {
    marginTop: 8,
    gap: 8,
    borderWidth: 0,
  },
  emptyState: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
  },
});
