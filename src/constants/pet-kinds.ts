/**
 * Canonical pet kind list — matches add-pet flow and PET_TYPE_OPTIONS keys.
 */
export const PET_KINDS = [
  "Dog",
  "Cat",
  "Small Furries",
  "Bird",
  "Reptile",
  "Other",
] as const;

export type PetKindId = (typeof PET_KINDS)[number];

export const PET_KIND_ILLUSTRATIONS: Record<PetKindId, number> = {
  Dog: require("@/assets/illustrations/pets/dog.svg") as number,
  Cat: require("@/assets/illustrations/pets/cat.svg") as number,
  "Small Furries": require("@/assets/illustrations/pets/furry.svg") as number,
  Bird: require("@/assets/illustrations/pets/bird.svg") as number,
  Reptile: require("@/assets/illustrations/pets/reptile.svg") as number,
  Other: require("@/assets/illustrations/pets/other.svg") as number,
};
