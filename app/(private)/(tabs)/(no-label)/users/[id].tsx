import { Colors } from "@/src/constants/colors";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Activity,
  BadgeCheck,
  Handshake,
  MapPin,
  PawPrint,
  Star,
} from "lucide-react-native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";

const PUBLIC_PROFILE = {
  avatarUri:
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200",
  name: "Jane Ambers",
  location: "Lake Placid, New York, US",
  points: 58,
  handshakes: 12,
  paws: 17,
  rating: 4.1,
  currentTask: "Caring for Bob Majors",
};

const PUBLIC_PETS = [
  {
    id: "1",
    imageSource:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200",
    petName: "Polo",
    breed: "Golden Retriever",
    petType: "Dog",
    bio: "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained.",
    tags: ["fenced yard", "high energy", "1-3yrs"],
    seekingDateRange: "Mar 14-Apr 02",
    seekingTime: "8am-4pm",
  },
];

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      {/* Back is handled by stack header; this is nested profile content */}
      <View style={styles.profileHead}>
        <View style={styles.avatarWrap}>
          <AppImage
            source={{ uri: PUBLIC_PROFILE.avatarUri }}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>
        <View
          style={[
            styles.availablePill,
            { backgroundColor: colors.tertiaryContainer },
          ]}
        >
          <AppText variant="caption" color={colors.onTertiaryContainer}>
            Available
          </AppText>
        </View>
        <View style={styles.nameRow}>
          <AppText variant="headline" style={styles.userName}>
            {PUBLIC_PROFILE.name}
          </AppText>
          <BadgeCheck size={20} color={colors.primary} />
        </View>
        <View style={styles.locationRow}>
          <MapPin size={20} color={colors.onSurfaceVariant} />
          <AppText variant="caption" color={colors.onSurfaceVariant}>
            {PUBLIC_PROFILE.location}
          </AppText>
        </View>
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statPill,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <Activity size={16} color={colors.onSurfaceVariant} />
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.statText}
            >
              {PUBLIC_PROFILE.points} Points
            </AppText>
          </View>
          <View
            style={[
              styles.statPill,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <View
              style={[
                styles.statInner,
                {
                  backgroundColor: colors.tertiaryContainer,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <Handshake size={12} color={colors.tertiary} />
              <AppText
                variant="caption"
                color={colors.tertiary}
                style={styles.statText}
              >
                {PUBLIC_PROFILE.handshakes}
              </AppText>
            </View>
            <View
              style={[
                styles.statInner,
                {
                  backgroundColor: colors.secondaryContainer,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              <PawPrint size={12} color={colors.onSurfaceVariant} />
              <AppText
                variant="caption"
                color={colors.onSecondaryContainer}
                style={styles.statText}
              >
                {PUBLIC_PROFILE.paws}
              </AppText>
            </View>
          </View>
          <View
            style={[
              styles.statPill,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {PUBLIC_PROFILE.rating.toFixed(1)}
            </AppText>
            <Star size={12} color={colors.primary} fill={colors.primary} />
          </View>
        </View>
        <View style={styles.currentTaskPill}>
          <AppText variant="label" color={colors.onSurfaceVariant}>
            {PUBLIC_PROFILE.currentTask}
          </AppText>
        </View>
      </View>

      {/* Tabs */}
      <TabBar<ProfileTab>
        tabs={[
          { key: "pets", label: "Your Pets" },
          { key: "availability", label: "Availability" },
          { key: "bio", label: "Short Bio" },
          { key: "reviews", label: "Reviews" },
        ]}
        activeKey={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* Tab content */}
      {activeTab === "pets" && (
        <ProfilePetsTab pets={PUBLIC_PETS} onAddPet={() => {}} />
      )}
      {activeTab === "availability" && <ProfileAvailabilityTab />}
      {activeTab === "bio" && <ProfileBioTab />}
      {activeTab === "reviews" && (
        <ProfileReviewsTab
          rating={PUBLIC_PROFILE.rating}
          handshakes={PUBLIC_PROFILE.handshakes}
          paws={PUBLIC_PROFILE.paws}
          onReviewerPress={(reviewerId) =>
            router.push(`/(private)/(tabs)/(no-label)/users/${reviewerId}`)
          }
        />
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  profileHead: {
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  availablePill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginBottom: 8,
  },
  statText: {
    fontSize: 9,
    lineHeight: 16,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  currentTaskPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
});
