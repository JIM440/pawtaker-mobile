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
      height={145}
      width={200}
      style={illustration.style}
      contentFit="cover"
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
