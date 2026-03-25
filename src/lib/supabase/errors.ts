/**
 * True when the failure is almost certainly a missing table/relation (stub DB / migration not applied).
 * Must NOT match RLS messages like `permission denied for relation "users"` — those contain "relation"
 * but are real auth errors and must surface to the UI.
 */
export function isMissingBackendResourceError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  if (maybe.code === "42P01") return true;

  const message = (maybe.message || "").toLowerCase();

  if (message.includes("does not exist")) {
    return (
      message.includes("relation") ||
      message.includes("table") ||
      message.includes("schema")
    );
  }

  return false;
}

/** Readable message for Supabase PostgREST errors, Error, or unknown thrown values */
export function errorMessageFromUnknown(
  err: unknown,
  fallback: string,
  networkFallback = "Network error. Check your connection.",
): string {
  const raw = (() => {
    if (err == null || err === undefined) return "";
    if (typeof err === "string") return err.trim();
    if (err instanceof Error) return (err.message ?? "").trim();
    if (typeof err === "object" && "message" in err) {
      return String((err as { message: unknown }).message ?? "").trim();
    }
    return "";
  })();

  if (!raw) return fallback;

  const lower = raw.toLowerCase();
  const isNetwork =
    lower.includes("network") ||
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("failed to fetch") ||
    lower.includes("connection");
  if (isNetwork) return networkFallback;

  const isTechnical =
    lower.includes("42p01") ||
    lower.includes("permission denied") ||
    lower.includes("invalid input syntax") ||
    lower.includes("jwt") ||
    lower.includes("violates") ||
    lower.includes("sqlstate");
  if (isTechnical) return fallback;

  return raw.length > 120 ? `${raw.slice(0, 117)}...` : raw;
}
