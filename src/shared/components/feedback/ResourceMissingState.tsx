import { DataState } from "@/src/shared/components/feedback/DataState";
import {
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/feedback/IllustratedEmptyState";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import React from "react";
import { useTranslation } from "react-i18next";

type Props = {
  /** Expo Router `+not-found` vs in-stack missing entity */
  variant?: "global" | "resource";
  onBack: () => void;
  onHome: () => void;
  mode?: "inline" | "full";
};

/**
 * Consistent “page or record isn’t available” UI (deleted, invalid deep link, etc.).
 */
export function ResourceMissingState({
  variant = "resource",
  onBack,
  onHome,
  mode = "full",
}: Props) {
  const { t } = useTranslation();
  const notFoundIllustration = (
    <AppImage
      source={IllustratedEmptyStateIllustrations.noSearchResult.source}
      type={IllustratedEmptyStateIllustrations.noSearchResult.type ?? "svg"}
      height={IllustratedEmptyStateIllustrations.noSearchResult.height}
      width={IllustratedEmptyStateIllustrations.noSearchResult.width}
      style={IllustratedEmptyStateIllustrations.noSearchResult.style}
      withBackground={false}
      contentFit="contain"
    />
  );

  if (variant === "global") {
    return (
      <DataState
        title={t("notFound.title")}
        message={t("notFound.message")}
        illustration={notFoundIllustration}
        actionLabel={t("common.goHome")}
        onAction={onHome}
        secondaryLabel={t("common.back")}
        onSecondary={onBack}
        mode={mode}
      />
    );
  }

  return (
    <DataState
      title={t("notFound.resourceTitle")}
      message={t("notFound.resourceMessage")}
      illustration={notFoundIllustration}
      actionLabel={t("common.back")}
      onAction={onBack}
      secondaryLabel={t("common.goHome")}
      onSecondary={onHome}
      mode={mode}
    />
  );
}
