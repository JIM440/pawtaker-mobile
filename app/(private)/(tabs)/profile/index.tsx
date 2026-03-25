import { Colors } from "@/src/constants/colors";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { ProfileSkeleton } from "@/src/shared/components/skeletons";
import { AppText } from "@/src/shared/components/ui";
import { DataState } from "@/src/shared/components/ui";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { router } from "expo-router";
import { Settings } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user, profile, fetchProfile } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [pets, setPets] = useState<any[]>([]);
  const [availability, setAvailability] = useState<Record<string, any> | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewersById, setReviewersById] = useState<Record<string, any>>({});
  const [completedContractsCount, setCompletedContractsCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfileData = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoadError(null);
    if (!opts?.refresh) {
      setLoading(true);
    }
    try {
      if (!profile) await fetchProfile(user.id);

      const [{ data: petsData }, { data: takerProfileData }, { data: reviewsData }, { data: contractsData }] =
        await Promise.all([
          supabase.from("pets").select("*").eq("owner_id", user.id),
          supabase.from("taker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
          supabase
            .from("reviews")
            .select("*")
            .eq("reviewee_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("contracts")
            .select("id")
            .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`)
            .eq("status", "completed"),
        ]);

      const reviewerIds = (reviewsData ?? []).map((r) => r.reviewer_id);
      const uniqueReviewerIds = Array.from(new Set(reviewerIds));
      let reviewerMap: Record<string, any> = {};

      if (uniqueReviewerIds.length > 0) {
        const { data: reviewerUsers } = await supabase
          .from("users")
          .select("id,full_name,avatar_url")
          .in("id", uniqueReviewerIds);
        reviewerMap =
          reviewerUsers?.reduce(
            (acc, item) => ({ ...acc, [item.id]: item }),
            {} as Record<string, any>,
          ) ?? {};
      }

      setPets(petsData ?? []);
      setAvailability((takerProfileData?.availability_json as Record<string, any> | null) ?? null);
      setReviews(reviewsData ?? []);
      setReviewersById(reviewerMap);
      setCompletedContractsCount((contractsData ?? []).length);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      await loadProfileData();
      if (!mounted) return;
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [fetchProfile, profile, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData({ refresh: true });
    setRefreshing(false);
  };

  const profileData = useMemo(() => {
    const name =
      resolveDisplayName(profile ?? undefined, {
        email: user?.email,
        userMetadata: user?.user_metadata as Record<string, unknown> | undefined,
      }).trim() || t("profile.defaultName", "Pawtaker User");

    return {
      avatarUri: profile?.avatar_url || null,
      name,
      location: profile?.city || t("profile.locationUnknown", "Location not set"),
      points: profile?.points_balance ?? 0,
      handshakes: completedContractsCount,
      paws: reviews.length,
      rating:
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / reviews.length
          : 0,
      currentTask: undefined as string | undefined,
    };
  }, [
    completedContractsCount,
    profile,
    reviews,
    t,
    user?.email,
    user?.user_metadata,
  ]);

  const reviewsUiItems = useMemo(
    () =>
      reviews.map((item) => {
        const reviewer = reviewersById[item.reviewer_id];
        return {
          id: item.id,
          reviewerId: item.reviewer_id,
          name: resolveDisplayName(reviewer) || "Anonymous",
          avatar: reviewer?.avatar_url || null,
          rating: item.rating ?? 0,
          handshakes: 0,
          paws: 0,
          date: new Date(item.created_at).toLocaleDateString(),
          review: item.comment || "No review comment.",
        };
      }),
    [reviewersById, reviews],
  );

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

  if (loadError) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
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
        <DataState
          title={t("common.error", "Something went wrong")}
          message={loadError}
          mode="full"
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void loadProfileData();
          }}
        />
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <ProfileHeader
          name={profileData.name}
          avatarUri={profileData.avatarUri}
          location={profileData.location}
          points={profileData.points}
          handshakes={profileData.handshakes}
          paws={profileData.paws}
          rating={profileData.rating}
          currentTask={profileData.currentTask}
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
            pets={pets.map((pet) => ({
              id: pet.id,
              imageSource: pet.avatar_url || "",
              petName: pet.name || "Unnamed pet",
              breed: pet.breed || "Unknown breed",
              petType: pet.species || "Pet",
              bio: pet.notes || "No pet bio yet.",
            }))}
            onAddPet={() => {
              if (blockIfKycNotApproved()) return;
              router.push("/(private)/pets/add");
            }}
            showAddPetButton
            onPetPress={(id) => router.push(`/(private)/pets/${id}`)}
          />
        )}
        {activeTab === "availability" &&
          (availability ? (
            <ProfileAvailabilityTab
              data={{
                card: {
                  avatarUri: profileData.avatarUri,
                  name: profileData.name,
                  rating: profileData.rating,
                  handshakes: profileData.handshakes,
                  paws: profileData.paws,
                  isAvailable: availability?.available ?? false,
                  petTypes:
                    availability?.petKinds?.length > 0
                      ? availability.petKinds
                      : ["No pet types set yet"],
                  services:
                    availability?.services?.length > 0
                      ? availability.services
                      : ["No services set yet"],
                  location: profileData.location,
                },
                note: availability?.note || "",
                time:
                  availability?.startTime && availability?.endTime
                    ? `${availability.startTime} - ${availability.endTime}`
                    : "",
                days:
                  availability?.days?.length > 0
                    ? availability.days.join(" • ")
                    : "",
                yardType: availability?.yardType || "",
                isPetOwner: availability?.petOwner || "",
              }}
              emptyMessage="No availability data yet."
            />
          ) : (
            <DataState
              title="No availability yet"
              message="Create your availability from Edit Profile to show it here."
            />
          ))}
        {activeTab === "bio" && (
          <ProfileBioTab bio={profile?.bio} emptyMessage="No bio yet." />
        )}
        {activeTab === "reviews" && (
          <ProfileReviewsTab
            rating={profileData.rating}
            handshakes={profileData.handshakes}
            paws={profileData.paws}
            items={reviewsUiItems}
            emptyMessage="No reviews yet."
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
        images={profileData.avatarUri ? [{ uri: profileData.avatarUri }] : []}
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
