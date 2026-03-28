import React from "react";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import { IllustratedEmptyState, IllustratedEmptyStateIllustrations } from "./IllustratedEmptyState";

function friendlyErrorMessage(error: unknown): string {
  return errorMessageFromUnknown(
    error,
    "Please try again.",
    "Check your internet connection.",
  );
}

type Props = {
  error: unknown;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  mode?: "inline" | "full";
};

export function ErrorState({
  error,
  title = "Unable to load data",
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  mode = "full",
}: Props) {
  return (
    <IllustratedEmptyState
      title={title}
      message={friendlyErrorMessage(error)}
      illustration={IllustratedEmptyStateIllustrations.errorTryAgain}
      actionLabel={actionLabel}
      onAction={onAction}
      secondaryLabel={secondaryLabel}
      onSecondary={onSecondary}
      mode={mode}
    />
  );
}

