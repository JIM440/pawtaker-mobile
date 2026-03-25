import { Colors } from "@/src/constants/colors";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { supabase } from "@/src/lib/supabase/client";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppText } from "@/src/shared/components/ui/AppText";
import { DataState, ResourceMissingState } from "@/src/shared/components/ui";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

export default function PublicProfileScreen() {
  const { id: profileId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<any | null>(null);
  const [publicPets, setPublicPets] = useState<any[]>([]);
  const [publicAvailability, setPublicAvailability] = useState<Record<string, any> | null>(null);
  const [publicReviews, setPublicReviews] = useState<any[]>([]);

  const loadPublicProfile = async (opts?: { refresh?: boolean }) => {
    if (!profileId) {
      setLoading(false);
      setLoadError(RESOURCE_NOT_FOUND);
      return;
    }
    if (!opts?.refresh) setLoading(true);
    setLoadError(null);
    try {
      const [{ data: userData, error: userError }, { data: petsData }, { data: availabilityData }, { data: reviewsData }] =
        await Promise.all([
          supabase.from("users").select("*").eq("id", profileId).maybeSingle(),
          supabase.from("pets").select("*").eq("owner_id", profileId),
          supabase.from("taker_profiles").select("*").eq("user_id", profileId).maybeSingle(),
          supabase.from("reviews").select("*").eq("reviewee_id", profileId).order("created_at", { ascending: false }),
        ]);
      if (userError) throw userError;
      if (!userData) {
        setPublicProfile(null);
        setPublicPets([]);
        setPublicAvailability(null);
        setPublicReviews([]);
        setLoadError(RESOURCE_NOT_FOUND);
        return;
      }
      setPublicProfile(userData);
      setPublicPets(petsData ?? []);
      const takerRow = availabilityData as { availability_json?: unknown } | null;
      setPublicAvailability(
        (takerRow?.availability_json as Record<string, any> | null) ?? null,
      );
      setPublicReviews(reviewsData ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPublicProfile();
  }, [profileId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPublicProfile({ refresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  const derived = useMemo(() => {
    return {
      avatarUri: publicProfile?.avatar_url || null,
      name: resolveDisplayName(publicProfile) || "User",
      location: publicProfile?.city?.trim() || t("profile.noLocation", "No location"),
      points: publicProfile?.points_balance ?? 0,
      handshakes: 0,
      paws: publicReviews.length,
      rating:
        publicReviews.length > 0
          ? publicReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / publicReviews.length
          : 0,
      currentTask: undefined as string | undefined,
    };
  }, [publicProfile, publicReviews, t]);

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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        {loading ? (
          <DataState title={t("common.loading", "Loading...")} mode="full" />
        ) : isResourceNotFound(loadError) ? (
          <ResourceMissingState
            onBack={() => router.back()}
            onHome={() =>
              router.replace(
                "/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0],
              )
            }
          />
        ) : loadError ? (
          <DataState
            title={t("common.error", "Something went wrong")}
            message={loadError}
            actionLabel={t("common.retry", "Retry")}
            onAction={() => {
              void loadPublicProfile();
            }}
            mode="full"
          />
        ) : (
          <>
        <ProfileHeader
          name={derived.name}
          avatarUri={derived.avatarUri}
          location={derived.location}
          points={derived.points}
          handshakes={derived.handshakes}
          paws={derived.paws}
          rating={derived.rating}
          currentTask={derived.currentTask}
          isAvailable={Boolean(publicAvailability?.available)}
          isVerified={publicProfile?.kyc_status === "approved"}
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
          <ProfilePetsTab
            pets={publicPets.map((pet) => ({
              id: pet.id,
              imageSource: petGalleryUrls(pet)[0] ?? "",
              petName: pet.name || "Pet",
              breed: pet.breed || "Unknown breed",
              petType: pet.species || "Pet",
              bio: pet.notes || "No pet bio yet.",
            }))}
            showAddPetButton={false}
          />
        )}
        {activeTab === "availability" && (
          publicAvailability ? (
            <ProfileAvailabilityTab
              data={{
                card: {
                  avatarUri: derived.avatarUri,
                  name: derived.name,
                  rating: derived.rating,
                  handshakes: derived.handshakes,
                  paws: derived.paws,
                  isAvailable: publicAvailability.available ?? false,
                  petTypes: publicAvailability.petKinds ?? [],
                  services: publicAvailability.services ?? [],
                  location: derived.location,
                },
                note: publicAvailability.note ?? "",
                time:
                  publicAvailability.startTime && publicAvailability.endTime
                    ? `${publicAvailability.startTime} - ${publicAvailability.endTime}`
                    : "",
                days: publicAvailability.days?.join(" • ") ?? "",
                yardType: publicAvailability.yardType ?? "",
                isPetOwner: publicAvailability.petOwner ?? "",
              }}
              emptyMessage={t("profile.availability.publicEmptyMessage")}
            />
          ) : (
            <DataState
              title={t("profile.availability.emptyTitle")}
              message={t("profile.availability.publicEmptyMessage")}
            />
          )
        )}
        {activeTab === "bio" && <ProfileBioTab bio={publicProfile?.bio} />}
        {activeTab === "reviews" ? (
          publicReviews.length === 0 ? (
            <DataState
              title={t("profile.reviewsTab.emptyTitle")}
              message={t("profile.reviewsTab.emptyMessage")}
            />
          ) : (
            <ProfileReviewsTab
              rating={derived.rating}
              handshakes={derived.handshakes}
              paws={derived.paws}
              items={publicReviews.map((r) => ({
                id: r.id,
                reviewerId: r.reviewer_id,
                name: "Reviewer",
                avatar: null,
                rating: r.rating ?? 0,
                handshakes: 0,
                paws: 0,
                date: r.created_at
                  ? new Date(r.created_at).toLocaleDateString()
                  : "",
                review: r.comment || "No review comment.",
              }))}
              onReviewerPress={(reviewerId) => {
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: reviewerId },
                });
              }}
            />
          )
        ) : null}
          </>
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
        images={derived.avatarUri ? [{ uri: derived.avatarUri }] : []}
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
  scrollContent: {
    flexGrow: 1,
  },
});
