import i18n from "@/src/lib/i18n";

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

/** Missing column in DB schema cache / migration not applied yet. */
export function isMissingColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  const message = (maybe.message || "").toLowerCase();
  return (
    maybe.code === "42703" ||
    (message.includes("could not find the") && message.includes("column")) ||
    (message.includes("column") && message.includes("does not exist"))
  );
}

/** Readable message for Supabase PostgREST errors, Error, or unknown thrown values */
export function errorMessageFromUnknown(
  err: unknown,
  fallback: string,
  networkFallback?: string,
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

  const pgCode =
    err && typeof err === "object" && "code" in err
      ? String((err as { code?: unknown }).code ?? "")
      : "";
  const lower = raw.toLowerCase();
  const netMsg =
    networkFallback ?? i18n.t("errors.networkError");
  const isNetwork =
    lower.includes("network") ||
    lower.includes("timed out") ||
    lower.includes("timeout") ||
    lower.includes("failed to fetch") ||
    lower.includes("connection");
  if (isNetwork) return netMsg;

  if (
    lower.includes("permission denied") ||
    lower.includes("forbidden") ||
    lower.includes("insufficient") ||
    lower.includes("rls")
  ) {
    return i18n.t("errors.permissionDenied");
  }
  if (lower.includes("jwt") || lower.includes("unauthorized")) {
    return i18n.t("errors.sessionExpired");
  }
  if (lower.includes("duplicate key") || lower.includes("already exists")) {
    return i18n.t("errors.duplicateExists");
  }
  if (lower.includes("row-level security")) {
    return i18n.t("errors.permissionDenied");
  }
  if (lower.includes("violates check constraint")) {
    const m = raw.match(/constraint\s+"([^"]+)"/i);
    const name = m?.[1];
    if (name?.includes("status")) {
      return i18n.t("errors.checkConstraintCareRequestStatus");
    }
    if (
      lower.includes("point_transactions") ||
      (name?.toLowerCase().includes("point_transaction") &&
        name?.toLowerCase().includes("type"))
    ) {
      return i18n.t("errors.checkConstraintPointTransactions");
    }
    return i18n.t("errors.invalidInput");
  }
  if (lower.includes("invalid input syntax")) {
    return i18n.t("errors.invalidInput");
  }
  if (lower.includes("violates foreign key")) {
    return i18n.t("errors.foreignKeyOrMissing");
  }
  if (lower.includes("violates")) {
    return i18n.t("errors.invalidInput");
  }
  if (pgCode === "23514") {
    if (lower.includes("point_transactions")) {
      return i18n.t("errors.checkConstraintPointTransactions");
    }
  }
  if (pgCode === "42703" || lower.includes("has no field")) {
    return i18n.t("errors.missingColumn42703");
  }
  if (lower.includes("42p01") || lower.includes("does not exist")) {
    return i18n.t("errors.featureTemporarilyUnavailable");
  }
  if (
    lower.includes("could not find function") ||
    (lower.includes("function") && lower.includes("does not exist"))
  ) {
    return i18n.t("errors.serverMissingFunction");
  }

  return raw.length > 120 ? `${raw.slice(0, 117)}...` : raw;
}
