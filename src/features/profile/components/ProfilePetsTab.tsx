import { ProfilePetCard } from "@/src/shared/components/cards";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { Button } from "@/src/shared/components/ui/Button";
import { DataState } from "@/src/shared/components/ui";
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
              style={styles.emptyIllustration}
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
          <ProfilePetCard
            key={pet.id}
            imageSource={pet.imageSource}
            petName={pet.petName}
            breed={pet.breed}
            petType={pet.petType}
            bio={pet.bio}
            tags={pet.tags}
            seekingDateRange={pet.seekingDateRange}
            seekingTime={pet.seekingTime}
            onPress={() => onPetPress?.(pet.id)}
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
  },
  addPetBtn: {
    marginTop: 8,
    gap: 8,
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
