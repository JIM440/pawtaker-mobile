/**
 * Thread list stores `last_message_preview` as plain text; image sends often
 * persist the Cloudinary (or other) URL. Detect those so the UI can show
 * "Photo" instead of a long URL.
 */
export function isImagePreviewContent(raw: string): boolean {
  const s = raw.trim();
  if (!s) return false;
  if (!/^https?:\/\//i.test(s)) return false;
  const lower = s.toLowerCase();
  if (lower.includes("cloudinary.com")) {
    if (lower.includes("/image/upload") || lower.includes("/image/fetch")) {
      return true;
    }
  }
  return /\.(jpe?g|png|gif|webp|heic|avif|bmp)(\?|#|$)/i.test(s);
}
