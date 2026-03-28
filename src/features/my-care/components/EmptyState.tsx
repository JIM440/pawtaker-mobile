import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

interface EmptyStateProps {
  variant?: "given" | "received" | "liked";
}

export function EmptyState({ variant }: EmptyStateProps) {
  const { t } = useTranslation();
  const title =
    variant === "given"
      ? t("myCare.emptyState.nothingTitle", "Nothing to show yet")
      : variant === "received"
        ? t("myCare.emptyState.nothingTitle", "Nothing to show yet")
        : t("myCare.emptyState.noLikedTitle", "No liked pets yet");

  const message =
    variant === "given"
      ? t("myCare.emptyState.givenMessage", "Start giving care to see your history here")
      : variant === "received"
        ? t("myCare.emptyState.receivedMessage", "Start receiving care to see your history here")
        : t("myCare.emptyState.likedMessage", "Tap the heart icon on requests, and they'll show up here");

  const illustration =
    variant === "liked"
      ? IllustratedEmptyStateIllustrations.noLikedPets
      : IllustratedEmptyStateIllustrations.noCare;

  return (
    <View style={{ paddingVertical: 16 }}>
      <IllustratedEmptyState
        title={title}
        message={message}
        illustration={illustration}
        mode="inline"
      />
    </View>
  );
}
