import { ProfilePetCard } from "@/src/shared/components/cards/ProfilePetCard";
import { IllustratedEmptyState } from "@/src/shared/components/ui";
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
  const hasPets = pets.length > 0;

  console.log(pets);

  if (!hasPets) {
    const title = "Aw aw!";
    const message = showAddPetButton
      ? "You have not uploaded any pets yet."
      : "This user has not uploaded any pets yet";
    return (
      <View style={styles.emptyState}>
        <IllustratedEmptyState
          title={title}
          message={message}
          illustration={{
            source: require("@/assets/illustrations/pets/no-pet.svg"),
            type: "svg",
            height: 145,
            width: 140,
            style: { backgroundColor: "transparent", borderRadius: 16 },
          }}
          actionLabel={
            showAddPetButton && onAddPet
              ? t("post.request.addAPet", "+ Add a pet")
              : undefined
          }
          onAction={showAddPetButton ? onAddPet : undefined}
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
            yardType={pet.yardType}
            ageRange={pet.ageRange}
            energyLevel={pet.energyLevel}
            tags={pet.tags ?? []}
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
    gap: 12,
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  addPetBtn: {
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
