import {
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";

type Props = {
  bio?: string | null;
  isMine?: boolean;
};

export function ProfileBioTab({ bio, isMine = false }: Props) {
  const { t } = useTranslation();
  const trimmedBio = bio?.trim();
  const isEmpty = !trimmedBio;

  if (isEmpty) {
    return (
      <View style={styles.emptyState}>
        <IllustratedEmptyState
          title={t("profile.bio.emptyTitle")}
          message={
            isMine ? t("profile.bio.emptyMine") : t("profile.bio.emptyOther")
          }
          illustration={IllustratedEmptyStateIllustrations.noBio}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppText variant="body" style={styles.content}>
        {trimmedBio}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  emptyState: {
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  emptyIllustration: {
    width: 140,
    borderRadius: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  content: {
    lineHeight: 22,
    fontSize: 14,
  },
});
