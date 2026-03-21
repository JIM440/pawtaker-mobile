import { Colors } from "@/src/constants/colors";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { ProfileSkeleton } from "@/src/shared/components/skeletons";
import { AppText } from "@/src/shared/components/ui";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { router } from "expo-router";
import { Settings } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const PROFILE = {
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

const MOCK_PETS = [
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
  {
    id: "2",
    imageSource:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=200",
    petName: "Bobby",
    breed: "Tabby",
    petType: "Cat",
    bio: "Bobby is an independent and affectionate tabby cat. He enjoys her alone time but also loves cuddles.",
    tags: ["indoors only", "calm", "1-3yrs"],
  },
  {
    id: "3",
    imageSource:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200",
    petName: "Rex",
    breed: "Mixed",
    petType: "Dog",
    bio: "Rex is a playful mixed-breed pup who loves the beach and meeting new people.",
    tags: ["beach lover", "medium energy"],
  },
  {
    id: "4",
    imageSource:
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=200",
    petName: "Luna",
    breed: "Siamese",
    petType: "Cat",
    bio: "Luna is a curious Siamese cat who enjoys sunny windowsills and quiet naps.",
    tags: ["indoor", "gentle"],
  },
  {
    id: "5",
    imageSource:
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=200",
    petName: "Milo",
    breed: "Beagle",
    petType: "Dog",
    bio: "Milo is a food-motivated beagle with a great nose and a friendly attitude.",
    tags: ["foodie", "good with kids"],
  },
];

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [loading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <ProfileSkeleton />
        </ScrollView>
      </PageContainer>
    );
  }

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      {/* Header: Profile + Edit Profile + Settings */}
      <View style={styles.header}>
        <AppText
          variant="bodyLarge"
          style={styles.title}
          color={colors.onSurface}
        >
          {t("profile.title", "Profile")}
        </AppText>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push("/(private)/(tabs)/profile/edit")}
            hitSlop={8}
          >
            <AppText
              variant="body"
              color={colors.onSurface}
              style={styles.editLink}
            >
              {t("settings.editProfile", "Edit Profile")}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/(private)/(tabs)/profile/settings")}
            hitSlop={12}
            style={styles.settingsBtn}
          >
            <Settings size={24} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ProfileHeader
          name={PROFILE.name}
          avatarUri={PROFILE.avatarUri}
          location={PROFILE.location}
          points={PROFILE.points}
          handshakes={PROFILE.handshakes}
          paws={PROFILE.paws}
          rating={PROFILE.rating}
          currentTask={PROFILE.currentTask}
          onAvatarPress={() => setAvatarViewerOpen(true)}
        />

        {/* Tabs */}
        <TabBar<ProfileTab>
          tabs={[
            { key: "pets", label: t("profile.edit.petsTab", "Your Pets") },
            {
              key: "availability",
              label: t("profile.edit.availabilityTab", "Availability"),
            },
            { key: "bio", label: t("auth.signup.profile.bio", "Short Bio") },
            { key: "reviews", label: t("profile.reviews", "Reviews") },
          ]}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />

        {/* Tab content */}
        {activeTab === "pets" && (
          <ProfilePetsTab
            pets={MOCK_PETS}
            onAddPet={() => router.push("/(private)/pets/add")}
            showAddPetButton
            onPetPress={(id) => router.push(`/(private)/pets/${id}`)}
          />
        )}
        {activeTab === "availability" && <ProfileAvailabilityTab />}
        {activeTab === "bio" && <ProfileBioTab />}
        {activeTab === "reviews" && (
          <ProfileReviewsTab
            rating={PROFILE.rating}
            handshakes={PROFILE.handshakes}
            paws={PROFILE.paws}
            onReviewerPress={(id) =>
              router.push({
                pathname: "/(private)/(tabs)/profile/users/[id]",
                params: { id },
              })
            }
          />
        )}
      </ScrollView>
      <ImageViewerModal
        visible={avatarViewerOpen}
        images={[{ uri: PROFILE.avatarUri }]}
        onRequestClose={() => setAvatarViewerOpen(false)}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 22,
    letterSpacing: -0.1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 32,
  },
  editLink: {
    textDecorationLine: "underline",
    fontSize: 16,
  },
  settingsBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
  },
});
