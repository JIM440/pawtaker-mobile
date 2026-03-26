/** Set on failed detail loads when the row no longer exists (deleted, invalid id, RLS empty). */
export const RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND" as const;

export function isResourceNotFound(
  error: string | null | undefined,
): boolean {
  return error === RESOURCE_NOT_FOUND;
}
