import { IllustratedEmptyState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  bio?: string | null;
  isMine?: boolean;
};

export function ProfileBioTab({ bio, isMine = false }: Props) {
  const trimmedBio = bio?.trim();
  const isEmpty = !trimmedBio;

  if (isEmpty) {
    return (
      <View style={styles.emptyState}>
        <IllustratedEmptyState
          title="A bit of mystery"
          message={
            isMine
              ? "You have not put up a bio yet"
              : "This user has not put up a bio yet."
          }
          illustration={{
            source: require("@/assets/illustrations/pets/no-bio.svg"),
            type: "svg",
            style: { backgroundColor: "transparent", borderRadius: 16 },
          }}
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
