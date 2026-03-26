/** True when the URI is already a stored remote URL (skip re-upload). */
export function isRemotePetPhotoUri(uri: string): boolean {
  const t = uri.trim().toLowerCase();
  return t.startsWith("https://") || t.startsWith("http://");
}

/**
 * Ordered pet photo URLs from `pets.photo_urls` (empty array if none).
 */
export function petGalleryUrls(pet: {
  photo_urls?: string[] | null;
}): string[] {
  const raw = Array.isArray(pet.photo_urls) ? pet.photo_urls : [];
  return raw.filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0,
  );
}
