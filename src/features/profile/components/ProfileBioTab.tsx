import { AppText } from "@/src/shared/components/ui/AppText";
import React from "react";
import { StyleSheet, View } from "react-native";

export function ProfileBioTab() {
  return (
    <View style={styles.container}>
      <AppText variant="body" style={styles.content}>
        Hi! I&apos;m a passionate pet owner who loves connecting with fellow animal
        lovers in the community. I&apos;m always happy to help care for your furry
        friends and believe every pet deserves kindness and fun adventures!
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
