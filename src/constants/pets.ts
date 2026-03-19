export const PET_TYPE_OPTIONS = [
  { key: 'Dog', label: 'Dog', asset: require('@/assets/illustrations/dog.svg') },
  { key: 'Cat', label: 'Cat', asset: require('@/assets/illustrations/cat.svg') },
  { key: 'Small Furries', label: 'Small furries', asset: require('@/assets/illustrations/furry.svg') },
  { key: 'Bird', label: 'Bird', asset: require('@/assets/illustrations/bird.svg') },
  { key: 'Reptile', label: 'Reptile', asset: require('@/assets/illustrations/reptile.svg') },
  { key: 'Other', label: 'Other', asset: require('@/assets/illustrations/other.svg') },
] as const;

export type PetKind = (typeof PET_TYPE_OPTIONS)[number]['key'];
