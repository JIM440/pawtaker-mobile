import React from "react";
import { useTranslation } from "react-i18next";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import { IllustratedEmptyState, IllustratedEmptyStateIllustrations } from "./IllustratedEmptyState";

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
  title,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  mode = "full",
}: Props) {
  const { t } = useTranslation();
  const message = errorMessageFromUnknown(
    error,
    t("errors.tryAgainShort"),
    t("errors.networkError"),
  );
  const resolvedTitle = title ?? t("errors.unableToLoadData");

  return (
    <IllustratedEmptyState
      title={resolvedTitle}
      message={message}
      illustration={IllustratedEmptyStateIllustrations.errorTryAgain}
      actionLabel={actionLabel}
      onAction={onAction}
      secondaryLabel={secondaryLabel}
      onSecondary={onSecondary}
      mode={mode}
    />
  );
}
