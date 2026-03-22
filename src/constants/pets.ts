export const PET_TYPE_OPTIONS = [
  { key: 'Dog', label: 'Dog', asset: require('@/assets/illustrations/pets/dog.svg') },
  { key: 'Cat', label: 'Cat', asset: require('@/assets/illustrations/pets/cat.svg') },
  { key: 'Small Furries', label: 'Small furries', asset: require('@/assets/illustrations/pets/furry.svg') },
  { key: 'Bird', label: 'Bird', asset: require('@/assets/illustrations/pets/bird.svg') },
  { key: 'Reptile', label: 'Reptile', asset: require('@/assets/illustrations/pets/reptile.svg') },
  { key: 'Other', label: 'Other', asset: require('@/assets/illustrations/pets/other.svg') },
] as const;

export type PetKind = (typeof PET_TYPE_OPTIONS)[number]['key'];
