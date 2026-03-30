import { PetSelectGridSkeleton } from "@/src/shared/components/skeletons";
import { DataState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { IllustratedEmptyState, IllustratedEmptyStateIllustrations } from "@/src/shared/components/ui";
import { PetGridTile } from "@/src/shared/components/ui/PetGridTile";
import React from "react";
import { TouchableOpacity, View } from "react-native";

type Pet = { id: string; name: string; imageUri: string | null };

type Props = {
  t: (key: string, fallback?: string) => string;
  colors: Record<string, string>;
  styles: any;
  columnWidth: number;
  petsLoading: boolean;
  petsError: string | null;
  pets: Pet[];
  petRows: Pet[][];
  selectedPet: string | null;
  petSeekingDateRangeById: Record<string, string>;
  onRetry: () => void;
  onSelectPet: (id: string) => void;
  onAddPet: () => void;
};

export function RequestPetSelectionStep({
  t,
  colors,
  styles,
  columnWidth,
  petsLoading,
  petsError,
  pets,
  petRows,
  selectedPet,
  petSeekingDateRangeById,
  onRetry,
  onSelectPet,
  onAddPet,
}: Props) {
  return (
    <View style={styles.stepContainer}>
      <AppText variant="title" style={styles.stepTitle}>
        {t("post.request.selectPetTitle")}
      </AppText>
      {petsLoading ? <PetSelectGridSkeleton columnWidth={columnWidth} rowCount={2} /> : null}
      {petsError ? (
        <DataState
          title={t("post.request.petsLoadFailedTitle")}
          message={petsError}
          actionLabel={t("common.retry")}
          mode="inline"
          onAction={onRetry}
        />
      ) : null}
      {!petsLoading && !petsError && pets.length > 0 ? (
        <View style={styles.petGrid}>
          {petRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.petRow}>
              {row.map((pet) => (
                <PetGridTile
                  key={pet.id}
                  width={columnWidth}
                  imageUri={pet.imageUri ?? ""}
                  name={pet.name}
                  selected={selectedPet === pet.id}
                  onPress={() => onSelectPet(pet.id)}
                  seekingDateRange={petSeekingDateRangeById[pet.id] ?? undefined}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}

      {!petsLoading && !petsError && pets.length > 0 ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={t("post.request.addAnotherPet", "or add another pet")}
          onPress={onAddPet}
          activeOpacity={0.8}
          style={styles.addPetRow}
        >
          <AppText variant="body" color={colors.primary} style={{ fontWeight: "600" }}>
            {"+ "}
            {t("post.request.addAnotherPet", "or add another pet")}
          </AppText>
        </TouchableOpacity>
      ) : null}
      {!petsLoading && !petsError && pets.length === 0 ? (
        <IllustratedEmptyState
          title={t("post.request.emptyPetsTitle")}
          message={t("post.request.emptyPetsSubtitle")}
          illustration={{
            ...IllustratedEmptyStateIllustrations.noPet,
            width: 200,
            height: 188,
            style: [IllustratedEmptyStateIllustrations.noPet.style, styles.emptyIllustration],
          }}
          actionLabel={t("post.request.addAPet", "Add a pet")}
          onAction={onAddPet}
        />
      ) : null}
    </View>
  );
}
