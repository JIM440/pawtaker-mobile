/**
 * Visible name from `public.users` and auth metadata.
 * Uses `full_name` as the canonical visible name.
 */
export type UserNameFields = {
  full_name?: string | null;
};

export function resolveDisplayName(
  row: UserNameFields | null | undefined,
  fallbacks?: {
    email?: string | null;
    userMetadata?: Record<string, unknown> | null;
  },
): string {
  const trimmed = row?.full_name?.trim() || "";
  if (trimmed) return trimmed;

  const meta = fallbacks?.userMetadata;
  const metaFull =
    typeof meta?.full_name === "string" ? meta.full_name.trim() : "";
  if (metaFull) return metaFull;

  const email = fallbacks?.email?.trim();
  if (email && email.includes("@")) {
    return email.split("@")[0] ?? "";
  }
  return "";
}
