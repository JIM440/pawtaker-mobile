import { DataState } from "@/src/shared/components/feedback/DataState";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import React from "react";

export type IllustratedEmptyStateIllustration = {
  source: any;
  type?: "svg" | "image";
  height?: number;
  width?: number;
  style?: any;
};

export const IllustratedEmptyStateIllustrations = {
  errorTryAgain: {
    source: require("@/assets/illustrations/pets/error-try again.svg"),
    type: "svg" as const,
    height: 145,
    width: 200,
  },
  noLikedPets: {
    source: require("@/assets/illustrations/pets/no-liked-pets.svg"),
    type: "svg" as const,
    height: 200,
    width: 240,
    style: { backgroundColor: "transparent" },
  },
  noChats: {
    source: require("@/assets/illustrations/pets/no-chats.svg"),
    type: "svg" as const,
    height: 145,
    width: 200,
  },
  noCare: {
    source: require("@/assets/illustrations/pets/no-care.svg"),
    type: "svg" as const,
    height: 145,
    width: 140,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
  noSearchResult: {
    source: require("@/assets/illustrations/pets/no-search-result.svg"),
    type: "svg" as const,
    height: 145,
    width: 140,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
  noAvailability: {
    source: require("@/assets/illustrations/pets/no-availability.svg"),
    type: "svg" as const,
    height: 145,
    width: 140,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
  noNotification: {
    source: require("@/assets/illustrations/pets/no-notification-graphic.svg"),
    type: "svg" as const,
    height: 145,
    width: 140,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
  noReview: {
    source: require("@/assets/illustrations/pets/no-review.svg"),
    type: "svg" as const,
    height: 145,
    width: 200,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
  noBio: {
    source: require("@/assets/illustrations/pets/no-bio.svg"),
    type: "svg" as const,
    height: 145,
    width: 200,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
  noPet: {
    source: require("@/assets/illustrations/pets/no-pet.svg"),
    type: "svg" as const,
    height: 145,
    width: 140,
    style: { backgroundColor: "transparent", borderRadius: 16 },
  },
} satisfies Record<string, IllustratedEmptyStateIllustration>;

type Props = {
  title: string;
  message?: string;
  illustration?: IllustratedEmptyStateIllustration;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  mode?: "inline" | "full";
};

/**
 * Standard empty state UI: centered title + optional description + illustration.
 * Callers only provide `title/message` and an SVG/image asset via `illustration.source`.
 */
export function IllustratedEmptyState({
  title,
  message,
  illustration,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  mode = "inline",
}: Props) {
  const illustrationNode = illustration ? (
    <AppImage
      source={illustration.source}
      type={illustration.type ?? "svg"}
      height={illustration.height ?? 145}
      width={illustration.width ?? 200}
      style={illustration.style}
      contentFit="contain"
    />
  ) : undefined;

  return (
    <DataState
      title={title}
      message={message}
      actionLabel={actionLabel}
      onAction={onAction}
      secondaryLabel={secondaryLabel}
      onSecondary={onSecondary}
      mode={mode}
      illustration={illustrationNode}
    />
  );
}
