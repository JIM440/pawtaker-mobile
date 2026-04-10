import { Colors } from "@/src/constants/colors";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfileTabContent } from "@/src/features/profile/components/ProfileTabContent";
import {
  formatRequestDateRange,
  formatRequestTimeRange,
} from "@/src/lib/datetime/request-date-time-format";
import { formatReviewRelativeDate } from "@/src/lib/datetime/review-relative-date";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import {
  errorMessageFromUnknown,
  isMissingBackendResourceError,
} from "@/src/lib/supabase/errors";
import { isRequestSeekingActive } from "@/src/lib/requests/is-request-seeking-active";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { ProfileHeaderAndTabsSkeleton } from "@/src/shared/components/skeletons/ProfileScreenSkeleton";
import { AppText } from "@/src/shared/components/ui";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { router, useLocalSearchParams } from "expo-router";
import { Settings } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user, profile, fetchProfile } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("pets");
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [deletePetId, setDeletePetId] = useState<string | null>(null);
  const [deletePetLoading, setDeletePetLoading] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

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

  const [availability, setAvailability] = useState<Record<string, any> | null>(
    null,
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null,
  );

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
    if (requestedTab === "availability" && refreshAvailabilityFlag) {
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
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (petsError && !isMissingBackendResourceError(petsError))
        throw petsError;

      const basePets = petsData ?? [];
      const petIds = basePets.map((p: any) => p.id).filter(Boolean);

      let openRequestsByPetId: Record<string, any> = {};
      if (petIds.length > 0) {
        const { data: openReqs, error: openReqErr } = await supabase
          .from("care_requests")
          .select(
            "pet_id,start_date,end_date,start_time,end_time,created_at,status,taker_id",
          )
          .eq("owner_id", user.id)
          .eq("status", "open")
          .in("pet_id", petIds)
          .order("start_date", { ascending: false })
          .order("created_at", { ascending: false });

        if (openReqErr && !isMissingBackendResourceError(openReqErr))
          throw openReqErr;

        for (const req of openReqs ?? []) {
          const pid = req?.pet_id as string | undefined;
          if (!pid) continue;
          if (!isRequestSeekingActive(req)) continue;
          if (!openRequestsByPetId[pid]) openRequestsByPetId[pid] = req;
        }
      }

      const petsWithSeeking = basePets.map((p: any) => {
        const pid = p?.id as string | undefined;
        const req = pid ? openRequestsByPetId[pid] : undefined;
        const isSeeking = isRequestSeekingActive(req);

        const seekingDateRange = isSeeking
          ? formatRequestDateRange(req?.start_date, req?.end_date)
          : undefined;
        const seekingTime = isSeeking
          ? formatRequestTimeRange(req?.start_time, req?.end_time)
          : undefined;

        return {
          ...p,
          seekingDateRange: seekingDateRange || undefined,
          seekingTime: seekingTime || undefined,
        };
      });

      setPets(petsWithSeeking);
      setPetsLoaded(true);
    } catch (err) {
      setPetsError(errorMessageFromUnknown(err, "Failed to load pets."));
    } finally {
      setPetsLoading(false);
    }
  };

  const confirmDeletePet = async () => {
    if (!user?.id || !deletePetId) return;
    setDeletePetLoading(true);
    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", deletePetId)
        .eq("owner_id", user.id);
      if (error) throw error;

      showToast({
        variant: "success",
        message: t("pets.delete.success", "Pet deleted."),
        durationMs: 2400,
      });
      setDeletePetId(null);
      setPetsLoaded(false);
      void loadPetsTab({ refresh: true });
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t(
            "pets.delete.failed",
            "Couldn't delete this pet. Please try again.",
          ),
        ),
        durationMs: 3200,
      });
    } finally {
      setDeletePetLoading(false);
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
        ((takerProfileData as any)?.availability_json as Record<
          string,
          any
        > | null) ?? null,
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
      const [
        { data: contractsRows, error: cErr },
        { data: ratingRows, error: rErr },
      ] = await Promise.all([
        supabase
          .from("contracts")
          .select("id")
          .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`)
          .eq("status", "completed"),
        supabase.from("reviews").select("rating").eq("reviewee_id", user.id),
      ]);
      if (!cErr) {
        setCompletedContractsCount((contractsRows ?? []).length);
      }
      if (!rErr) {
        const rows = (ratingRows ?? []) as { rating: number | null }[];
        const n = rows.length;
        const avg =
          n > 0 ? rows.reduce((s, x) => s + (x.rating ?? 0), 0) / n : 0;
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
        const { data: reviewerUsers, error: reviewerUsersErr } = await supabase
          .from("users")
          .select("id,full_name,avatar_url,care_given_count,care_received_count")
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
      setReviewsError(errorMessageFromUnknown(err, "Failed to load reviews."));
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
          handshakes: reviewer?.care_given_count ?? 0,
          paws: reviewer?.care_received_count ?? 0,
          date: formatReviewRelativeDate(item.created_at),
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
                {
                  key: "bio",
                  label: t("auth.signup.profile.bio", "Short Bio"),
                },
                { key: "reviews", label: t("profile.reviews", "Reviews") },
              ]}
              activeKey={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />
          </>
        )}

        <ProfileTabContent
          activeTab={activeTab}
          t={(key, fallback) => t(key, fallback as string)}
          petsLoading={petsLoading}
          petsError={petsError}
          setPetsError={setPetsError}
          setPetsLoaded={setPetsLoaded}
          loadPetsTab={() => {
            void loadPetsTab({ refresh: true });
          }}
          pets={pets}
          onDeletePet={(id) => setDeletePetId(id)}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          setAvailabilityError={setAvailabilityError}
          setAvailabilityLoaded={setAvailabilityLoaded}
          loadAvailabilityTab={() => {
            void loadAvailabilityTab({ refresh: true });
          }}
          availability={availability}
          profileData={profileData}
          profileBio={profile?.bio}
          reviewsLoading={reviewsLoading}
          reviewsError={reviewsError}
          setReviewsError={setReviewsError}
          setReviewsLoaded={setReviewsLoaded}
          loadReviewsTab={() => {
            void loadReviewsTab({ refresh: true });
          }}
          reviewsUiItems={reviewsUiItems}
          router={router}
        />
      </ScrollView>
      <ImageViewerModal
        visible={avatarViewerOpen}
        images={profileData.avatarUri ? [{ uri: profileData.avatarUri }] : []}
        onRequestClose={() => setAvatarViewerOpen(false)}
      />

      <FeedbackModal
        visible={deletePetId !== null}
        title={t("common.deleteConfirmTitle", "Delete pet?")}
        description={t(
          "common.deleteConfirmMessage",
          "This will permanently delete the pet from your account.",
        )}
        primaryLabel={t("common.delete", "Delete")}
        onPrimary={() => void confirmDeletePet()}
        primaryLoading={deletePetLoading}
        secondaryLabel={t("common.cancel", "Cancel")}
        onSecondary={() => !deletePetLoading && setDeletePetId(null)}
        onRequestClose={() => !deletePetLoading && setDeletePetId(null)}
        destructive
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
