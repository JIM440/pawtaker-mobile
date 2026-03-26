import { Colors } from "@/src/constants/colors";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import {
  errorMessageFromUnknown,
  isMissingBackendResourceError,
} from "@/src/lib/supabase/errors";
import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui";
import { DataState } from "@/src/shared/components/ui";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { ProfileHeaderAndTabsSkeleton } from "@/src/shared/components/skeletons/ProfileScreenSkeleton";
import {
  ProfileAvailabilityTabSkeleton,
  ProfilePetsTabSkeleton,
  ProfileReviewsTabSkeleton,
} from "@/src/shared/components/skeletons/ProfileTabSkeletons";
import { router, useLocalSearchParams } from "expo-router";
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
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);

  const params = useLocalSearchParams<{
    tab?: string;
    refreshPets?: string;
    refreshAvailability?: string;
    refreshReviews?: string;
  }>();

  const [pets, setPets] = useState<any[]>([]);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsLoaded, setPetsLoaded] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);

  const [availability, setAvailability] = useState<Record<string, any> | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  const [reviewersById, setReviewersById] = useState<Record<string, any>>({});
  const [completedContractsCount, setCompletedContractsCount] = useState(0);
  /** Header badges (handshakes / review avg / count) — loaded once per user, not tied to reviews tab. */
  const [headerReviewStats, setHeaderReviewStats] = useState({
    count: 0,
    avg: 0,
  });

  /** Header (avatar, stats) + tab strip: wait for `users` row fetch; tab bodies keep their own loaders. */
  const [profileHeaderLoading, setProfileHeaderLoading] = useState(true);

  const refreshPetsFlag =
    params.refreshPets === "1" || params.refreshPets === "true";
  const refreshAvailabilityFlag =
    params.refreshAvailability === "1" || params.refreshAvailability === "true";
  const refreshReviewsFlag =
    params.refreshReviews === "1" || params.refreshReviews === "true";

  useEffect(() => {
    if (!user?.id) {
      setProfileHeaderLoading(false);
      return;
    }
    let cancelled = false;
    setProfileHeaderLoading(true);
    void (async () => {
      try {
        await fetchProfile(user.id);
      } finally {
        if (!cancelled) setProfileHeaderLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProfile, user?.id]);

  useEffect(() => {
    const requestedTabRaw = params.tab;
    const allowedTabs: ProfileTab[] = [
      "pets",
      "availability",
      "bio",
      "reviews",
    ];
    const requestedTab = allowedTabs.includes(requestedTabRaw as ProfileTab)
      ? (requestedTabRaw as ProfileTab)
      : undefined;
    if (requestedTab) setActiveTab(requestedTab);

    if (requestedTab === "pets" && refreshPetsFlag) {
      setPetsLoaded(false);
      setPetsError(null);
    }
    if (
      requestedTab === "availability" &&
      refreshAvailabilityFlag
    ) {
      setAvailabilityLoaded(false);
      setAvailabilityError(null);
    }
    if (requestedTab === "reviews" && refreshReviewsFlag) {
      setReviewsLoaded(false);
      setReviewsError(null);
    }
  }, [
    params.tab,
    refreshPetsFlag,
    refreshAvailabilityFlag,
    refreshReviewsFlag,
  ]);
  const loadPetsTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setPetsLoading(true);
    setPetsError(null);
    try {
      const { data: petsData, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id);
      if (petsError && !isMissingBackendResourceError(petsError))
        throw petsError;
      setPets(petsData ?? []);
      setPetsLoaded(true);
    } catch (err) {
      setPetsError(errorMessageFromUnknown(err, "Failed to load pets."));
    } finally {
      setPetsLoading(false);
    }
  };

  const loadAvailabilityTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const { data: takerProfileData, error: availabilityDbError } =
        await supabase
          .from("taker_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
      if (
        availabilityDbError &&
        !isMissingBackendResourceError(availabilityDbError)
      )
        throw availabilityDbError;

      setAvailability(
        ((takerProfileData as any)?.availability_json as
          | Record<string, any>
          | null) ?? null,
      );
      setAvailabilityLoaded(true);
    } catch (err) {
      setAvailabilityError(
        errorMessageFromUnknown(err, "Failed to load availability."),
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadHeaderStats = async () => {
    if (!user?.id) return;
    try {
      const [{ data: contractsRows, error: cErr }, { data: ratingRows, error: rErr }] =
        await Promise.all([
          supabase
            .from("contracts")
            .select("id")
            .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`)
            .eq("status", "completed"),
          supabase
            .from("reviews")
            .select("rating")
            .eq("reviewee_id", user.id),
        ]);
      if (!cErr) {
        setCompletedContractsCount((contractsRows ?? []).length);
      }
      if (!rErr) {
        const rows = (ratingRows ?? []) as { rating: number | null }[];
        const n = rows.length;
        const avg =
          n > 0
            ? rows.reduce((s, x) => s + (x.rating ?? 0), 0) / n
            : 0;
        setHeaderReviewStats({ count: n, avg });
      }
    } catch {
      /* non-blocking for header */
    }
  };

  const loadReviewsTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setReviewsLoading(true);
    setReviewsError(null);
    try {
      const { data: reviewsData, error: reviewsDbError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", user.id)
        .order("created_at", { ascending: false });

      if (reviewsDbError && !isMissingBackendResourceError(reviewsDbError))
        throw reviewsDbError;

      const reviewerIds = ((reviewsData ?? []) as any[]).map(
        (r: any) => r.reviewer_id,
      );
      const uniqueReviewerIds = Array.from(new Set(reviewerIds));

      let reviewerMap: Record<string, any> = {};
      if (uniqueReviewerIds.length > 0) {
        const { data: reviewerUsers, error: reviewerUsersErr } =
          await supabase
            .from("users")
            .select("id,full_name,avatar_url")
            .in("id", uniqueReviewerIds);

        if (
          reviewerUsersErr &&
          !isMissingBackendResourceError(reviewerUsersErr)
        ) {
          throw reviewerUsersErr;
        }

        reviewerMap =
          reviewerUsers?.reduce(
            (acc, item) => ({ ...acc, [item.id]: item }),
            {} as Record<string, any>,
          ) ?? {};
      }

      setReviews(reviewsData ?? []);
      setReviewersById(reviewerMap);
      setReviewsLoaded(true);
    } catch (err) {
      setReviewsError(
        errorMessageFromUnknown(err, "Failed to load reviews."),
      );
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void loadHeaderStats();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || activeTab !== "pets") return;
    if (petsLoaded || petsLoading || petsError) return;
    void loadPetsTab();
  }, [user?.id, activeTab, petsLoaded, petsLoading, petsError]);

  useEffect(() => {
    if (!user?.id || activeTab !== "availability") return;
    if (availabilityLoaded || availabilityLoading || availabilityError) return;
    void loadAvailabilityTab();
  }, [
    user?.id,
    activeTab,
    availabilityLoaded,
    availabilityLoading,
    availabilityError,
  ]);

  useEffect(() => {
    if (!user?.id || activeTab !== "reviews") return;
    if (reviewsLoaded || reviewsLoading || reviewsError) return;
    void loadReviewsTab();
  }, [user?.id, activeTab, reviewsLoaded, reviewsLoading, reviewsError]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (user?.id) {
        await fetchProfile(user.id);
      }
      await loadHeaderStats();
      if (activeTab === "availability") {
        await loadAvailabilityTab({ refresh: true });
      } else if (activeTab === "reviews") {
        await loadReviewsTab({ refresh: true });
      } else if (activeTab === "pets") {
        await loadPetsTab({ refresh: true });
      }
      // "bio" tab uses `profile` from the store — refreshed via fetchProfile above.
    } finally {
      setRefreshing(false);
    }
  };

  const profileData = useMemo(() => {
    const loadingName = t("common.loading", "Loading...");
    const defaultName = t("profile.defaultName", "Pawtaker User");
    const name = profileHeaderLoading
      ? loadingName
      : profile?.full_name?.trim() || defaultName;

    return {
      avatarUri: profile?.avatar_url || null,
      name,
      location: profileHeaderLoading
        ? loadingName
        : profile?.city?.trim()
          ? profile.city.trim()
          : t("profile.noLocation", "No location"),
      points: profile?.points_balance ?? 0,
      handshakes: completedContractsCount,
      paws: headerReviewStats.count,
      rating: headerReviewStats.avg,
      currentTask: undefined as string | undefined,
    };
  }, [
    completedContractsCount,
    headerReviewStats.avg,
    headerReviewStats.count,
    profile,
    profileHeaderLoading,
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
        contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceContainerLow}
          />
        }
      >
        {profileHeaderLoading ? (
          <ProfileHeaderAndTabsSkeleton />
        ) : (
          <>
            <ProfileHeader
              name={profileData.name}
              avatarUri={profileData.avatarUri}
              location={profileData.location}
              points={profileData.points}
              handshakes={profileData.handshakes}
              paws={profileData.paws}
              rating={profileData.rating}
              currentTask={profileData.currentTask}
              isAvailable={Boolean(availability?.available)}
              isVerified={profile?.kyc_status === "approved"}
              onAvatarPress={() => setAvatarViewerOpen(true)}
            />

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
          </>
        )}

        {/* Tab content — each tab manages its own fetch/loading */}
        {activeTab === "pets" && (
          <>
            {petsLoading ? (
              <ProfilePetsTabSkeleton count={2} />
            ) : petsError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={petsError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setPetsError(null);
                  setPetsLoaded(false);
                  void loadPetsTab({ refresh: true });
                }}
              />
            ) : (
              <ProfilePetsTab
                pets={pets.map((pet) => ({
                  id: pet.id,
                  imageSource: petGalleryUrls(pet)[0] ?? "",
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
          </>
        )}
        {activeTab === "availability" && (
          <>
            {availabilityLoading ? (
              <ProfileAvailabilityTabSkeleton />
            ) : availabilityError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={availabilityError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setAvailabilityError(null);
                  setAvailabilityLoaded(false);
                  void loadAvailabilityTab({ refresh: true });
                }}
              />
            ) : availability ? (
              (() => {
                const hasMeaningfulAvailability =
                  Boolean(availability?.available) ||
                  Boolean(availability?.note?.trim()) ||
                  (availability?.services?.length ?? 0) > 0 ||
                  (availability?.petKinds?.length ?? 0) > 0 ||
                  (availability?.days?.length ?? 0) > 0 ||
                  Boolean(availability?.yardType?.trim()) ||
                  (availability?.petOwner ?? "") === "yes";

                if (!hasMeaningfulAvailability) {
                  return (
                    <View
                      style={{
                        flexGrow: 1,
                        minHeight: 220,
                        alignItems: "center",
                        justifyContent: "center",
                        paddingHorizontal: 20,
                        paddingVertical: 20,
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: colors.outlineVariant,
                          backgroundColor: colors.surfaceContainerLow,
                        }}
                      />
                      <AppText
                        variant="title"
                        color={colors.onSurface}
                        style={{ textAlign: "center" }}
                      >
                        {t("profile.availability.emptyTitle")}
                      </AppText>
                      <AppText
                        variant="body"
                        color={colors.onSurfaceVariant}
                        style={{ textAlign: "center", maxWidth: 320 }}
                      >
                        {t("profile.availability.emptyMessage")}
                      </AppText>
                    </View>
                  );
                }

                return (
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
                            : [],
                        services:
                          availability?.services?.length > 0
                            ? availability.services
                            : [],
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
                  />
                );
              })()
            ) : (
              <View
                style={{
                  flexGrow: 1,
                  minHeight: 220,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 20,
                  paddingVertical: 20,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    backgroundColor: colors.surfaceContainerLow,
                  }}
                />
                <AppText
                  variant="title"
                  color={colors.onSurface}
                  style={{ textAlign: "center" }}
                >
                  {t("profile.availability.emptyTitle")}
                </AppText>
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  style={{ textAlign: "center", maxWidth: 320 }}
                >
                  {t("profile.availability.emptyMessage")}
                </AppText>
              </View>
            )}
          </>
        )}
        {activeTab === "bio" && (
          <ProfileBioTab bio={profile?.bio} emptyMessage="No bio yet." />
        )}
        {activeTab === "reviews" && (
          <>
            {reviewsLoading ? (
              <ProfileReviewsTabSkeleton />
            ) : reviewsError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={reviewsError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setReviewsError(null);
                  setReviewsLoaded(false);
                  void loadReviewsTab({ refresh: true });
                }}
              />
            ) : reviews.length === 0 ? (
              <DataState
                title={t("profile.reviewsTab.emptyTitle")}
                message={t("profile.reviewsTab.emptyMessage")}
              />
            ) : (
              <ProfileReviewsTab
                rating={profileData.rating}
                handshakes={profileData.handshakes}
                paws={profileData.paws}
                items={reviewsUiItems}
                onReviewerPress={(id) =>
                  router.push({
                    pathname:
                      "/(private)/(tabs)/profile/users/[id]",
                    params: { id },
                  })
                }
              />
            )}
          </>
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
