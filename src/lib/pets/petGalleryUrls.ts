/**
 * Ordered pet photo URLs for carousels (`photo_urls`) with fallback to legacy `avatar_url`.
 */
export function petGalleryUrls(pet: {
  avatar_url?: string | null;
  photo_urls?: string[] | null;
}): string[] {
  const raw =
    Array.isArray(pet.photo_urls) && pet.photo_urls.length > 0
      ? pet.photo_urls
      : [];
  const cleaned = raw.filter(
    (u): u is string => typeof u === "string" && u.trim().length > 0,
  );
  if (cleaned.length > 0) return cleaned;
  const a = pet.avatar_url?.trim();
  return a ? [a] : [];
}
