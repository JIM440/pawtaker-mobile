import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";

type Props = {
  bio?: string | null;
  emptyMessage?: string;
};

export function ProfileBioTab({ bio, emptyMessage = "No bio yet." }: Props) {
  const trimmedBio = bio?.trim();

  return (
    <View style={styles.container}>
      <AppText variant="body" style={styles.content}>
        {trimmedBio || emptyMessage}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
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
