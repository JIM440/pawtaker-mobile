import { Colors } from "@/src/constants/colors";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
  const { id: _profileId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
      <View style={styles.header}>
        <BackHeader
          rightSlot={
            <TouchableOpacity
              onPress={() => setOptionsVisible(true)}
              hitSlop={8}
              style={[
                styles.headerIconButton,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <MoreHorizontal size={24} color={colors.onSurface} />
            </TouchableOpacity>
          }
        />
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={PUBLIC_PROFILE.name}
          avatarUri={PUBLIC_PROFILE.avatarUri}
          location={PUBLIC_PROFILE.location}
          points={PUBLIC_PROFILE.points}
          handshakes={PUBLIC_PROFILE.handshakes}
          paws={PUBLIC_PROFILE.paws}
          rating={PUBLIC_PROFILE.rating}
          currentTask={PUBLIC_PROFILE.currentTask}
          onAvatarPress={() => setAvatarViewerOpen(true)}
        />

        {/* Tabs */}
        <TabBar<ProfileTab>
          tabs={[
            { key: "pets", label: t("profile.pets.tab", "Pets") },
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
          <ProfilePetsTab pets={PUBLIC_PETS} showAddPetButton={false} />
        )}
        {activeTab === "availability" && <ProfileAvailabilityTab />}
        {activeTab === "bio" && <ProfileBioTab />}
        {activeTab === "reviews" && (
          <ProfileReviewsTab
            rating={PUBLIC_PROFILE.rating}
            handshakes={PUBLIC_PROFILE.handshakes}
            paws={PUBLIC_PROFILE.paws}
            onReviewerPress={(reviewerId) =>
              router.push({
                pathname: "/(private)/(tabs)/profile/users/[id]",
                params: { id: reviewerId },
              })
            }
          />
        )}
      </ScrollView>

      {optionsVisible && (
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setOptionsVisible(false)}
        >
          <View
            style={[
              styles.menuContainer,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
              onPress={() => setOptionsVisible(false)}
            >
              <AppText variant="body" color={colors.onSurface}>
                Send request
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.menuItem,
                {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.outlineVariant,
                },
              ]}
              onPress={() => setOptionsVisible(false)}
            >
              <AppText variant="body" color={colors.onSurface}>
                Go to chat
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setOptionsVisible(false);
                setShowBlockConfirm(true);
              }}
            >
              <AppText variant="body" color={colors.error}>
                Block this user
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      )}

      <FeedbackModal
        visible={showBlockConfirm}
        title={t("profile.blockConfirmTitle")}
        description={t("profile.blockConfirmDescription")}
        primaryLabel={t("profile.blockUser")}
        secondaryLabel={t("common.cancel")}
        destructive
        onPrimary={() => {
          // TODO: wire real block user flow
          setShowBlockConfirm(false);
        }}
        onSecondary={() => setShowBlockConfirm(false)}
        onRequestClose={() => setShowBlockConfirm(false)}
      />
      <ImageViewerModal
        visible={avatarViewerOpen}
        images={[{ uri: PUBLIC_PROFILE.avatarUri }]}
        onRequestClose={() => setAvatarViewerOpen(false)}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 0,
  },
  headerIconButton: {
    padding: 6,
    borderRadius: 999,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
    backgroundColor: "transparent",
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 180,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
});
