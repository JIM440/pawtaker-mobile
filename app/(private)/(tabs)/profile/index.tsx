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
import { router } from "expo-router";
import {
  Activity,
  BadgeCheck,
  Handshake,
  MapPin,
  PawPrint,
  Settings,
  Star,
} from "lucide-react-native";
import React, { useState } from "react";
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
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const hasPets = MOCK_PETS.length > 0;

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      {/* Header: Profile + Edit Profile + Settings */}
      <View style={styles.header}>
        <AppText
          variant="bodyLarge"
          style={styles.title}
          color={colors.onSurface}
        >
          Profile
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
              Edit Profile
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
      >
        {/* Profile head: avatar, Available, name, location, stats */}
        <View style={styles.profileHead}>
          <View style={styles.avatarWrap}>
            <AppImage
              source={{ uri: PROFILE.avatarUri }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View
              style={[styles.onlineBadge, { backgroundColor: colors.primary }]}
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
              {PROFILE.name}
            </AppText>
            <BadgeCheck size={20} color={colors.primary} />
          </View>
          <View style={styles.locationRow}>
            <MapPin size={20} color={colors.onSurfaceVariant} />
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {PROFILE.location}
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
                {PROFILE.points} Points
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
                  {PROFILE.handshakes}
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
                  {PROFILE.paws}
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
                {PROFILE.rating.toFixed(1)}
              </AppText>
              <Star size={12} color={colors.primary} fill={colors.primary} />
            </View>
          </View>
          <View style={[styles.currentTaskPill]}>
            <AppText variant="label" color={colors.onSurfaceVariant}>
              {PROFILE.currentTask}
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
        {activeTab === "pets" && hasPets && (
          <ProfilePetsTab
            pets={MOCK_PETS}
            onAddPet={() => router.push("/(private)/pets/add")}
            showAddPetButton
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
                pathname: "/(private)/(tabs)/(no-label)/users/[id]",
                params: { id },
              })
            }
          />
        )}
      </ScrollView>
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
  onlineBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
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
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    marginBottom: 16,
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabActive: {},
  tabLabelActive: {
    fontWeight: "600",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
  },
  reviewTitleCol: {
    flex: 1,
    gap: 2,
  },
  reviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  scroll: {
    flex: 1,
  },
});
