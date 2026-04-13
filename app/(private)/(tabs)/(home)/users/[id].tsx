import { Colors } from "@/src/constants/colors";
import { useOrCreateThread } from "@/src/features/messages/hooks/useOrCreateThread";
import { ProfileAvailabilityTab } from "@/src/features/profile/components/ProfileAvailabilityTab";
import { ProfileBioTab } from "@/src/features/profile/components/ProfileBioTab";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { ProfilePetsTab } from "@/src/features/profile/components/ProfilePetsTab";
import { ProfileReviewsTab } from "@/src/features/profile/components/ProfileReviewsTab";
import { PublicProfileActionsMenu } from "@/src/features/profile/components/public-profile/PublicProfileActionsMenu";
import { SendRequestToUserModal } from "@/src/features/profile/components/public-profile/SendRequestToUserModal";
import {
  blockUser,
  getBlockDirection,
  type BlockDirection,
  unblockUser,
} from "@/src/lib/blocks/user-blocks";
import { getRequestEligibility } from "@/src/lib/contracts/request-eligibility";
import { formatLocalYyyyMmDd } from "@/src/lib/datetime/localDate";
import { formatRequestDateRange } from "@/src/lib/datetime/request-date-time-format";
import { formatReviewRelativeDate } from "@/src/lib/datetime/review-relative-date";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { getOrCreateThreadForUsers } from "@/src/lib/messages/get-or-create-thread";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { formatCarePointsPts } from "@/src/lib/points/carePoints";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { ProfileHeaderAndTabsSkeleton } from "@/src/shared/components/skeletons/ProfileScreenSkeleton";
import { ProfilePetsTabSkeleton } from "@/src/shared/components/skeletons/ProfileTabSkeletons";
import {
  DataState,
  ErrorState,
  IllustratedEmptyStateIllustrations,
  ResourceMissingState,
} from "@/src/shared/components/ui";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { Input } from "@/src/shared/components/ui/Input";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type ProfileTab = "pets" | "availability" | "bio" | "reviews";

function formatCurrentTimeForComparison(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function isRequestStillSeekable(
  request: Pick<any, "end_date" | "end_time"> | null | undefined,
  now: Date,
) {
  const endDate =
    typeof request?.end_date === "string" ? request.end_date.trim() : "";
  if (!endDate) return false;

  const today = formatLocalYyyyMmDd(now);
  if (endDate > today) return true;
  if (endDate < today) return false;

  const endTime =
    typeof request?.end_time === "string" ? request.end_time.trim().slice(0, 5) : "";
  if (!endTime) return true;

  return endTime >= formatCurrentTimeForComparison(now);
}

export default function PublicProfileScreen() {
  const { id: profileIdParam, initialTab: initialTabParam } = useLocalSearchParams<{
    id: string | string[];
    initialTab?: string;
  }>();
  const profileId =
    typeof profileIdParam === "string"
      ? profileIdParam
      : (profileIdParam?.[0] ?? "");
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { openThread, loading: chatOpening } = useOrCreateThread();
  const isOwnProfile = Boolean(user?.id && profileId && user.id === profileId);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const validInitialTab = (["pets", "availability", "bio", "reviews"] as ProfileTab[]).includes(initialTabParam as ProfileTab)
    ? (initialTabParam as ProfileTab)
    : "pets";
  const [activeTab, setActiveTab] = useState<ProfileTab>(validInitialTab);
  const [optionsVisible, setOptionsVisible] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [sendRequestBusy, setSendRequestBusy] = useState(false);
  const [sendRequestLoading, setSendRequestLoading] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockDirection>("none");
  const [sendRequestOpen, setSendRequestOpen] = useState(false);
  const [userPets, setUserPets] = useState<any[]>([]);
  const [selectedSeekingPet, setSelectedSeekingPet] = useState<any | null>(
    null,
  );
  const [petSendSubtitleById, setPetSendSubtitleById] = useState<
    Record<string, string>
  >({});
  const [openReqByPetId, setOpenReqByPetId] = useState<Record<string, any>>({});
  const [avatarViewerOpen, setAvatarViewerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<any | null>(null);
  const [publicPets, setPublicPets] = useState<any[]>([]);
  const [publicAvailability, setPublicAvailability] = useState<Record<
    string,
    any
  > | null>(null);
  const [publicReviews, setPublicReviews] = useState<any[]>([]);
  const [reviewerMap, setReviewerMap] = useState<
    Record<
      string,
      {
        full_name: string | null;
        avatar_url: string | null;
        care_given_count: number | null;
        care_received_count: number | null;
      }
    >
  >({});

  const loadPublicProfile = async (opts?: { refresh?: boolean }) => {
    if (!profileId) {
      setLoading(false);
      setLoadError(RESOURCE_NOT_FOUND);
      return;
    }
    if (!opts?.refresh) setLoading(true);
    setLoadError(null);
    try {
      const [
        { data: userData, error: userError },
        { data: petsData },
        { data: availabilityData },
        { data: reviewsData },
      ] = await Promise.all([
        supabase.from("users").select("*").eq("id", profileId).maybeSingle(),
        supabase
          .from("pets")
          .select("*")
          .eq("owner_id", profileId)
          .order("created_at", { ascending: false }),
        supabase
          .from("taker_profiles")
          .select("*")
          .eq("user_id", profileId)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("*")
          .eq("reviewee_id", profileId)
          .order("created_at", { ascending: false }),
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
      const takerRow = availabilityData as {
        availability_json?: unknown;
      } | null;
      setPublicAvailability(
        (takerRow?.availability_json as Record<string, any> | null) ?? null,
      );
      const reviews = reviewsData ?? [];
      setPublicReviews(reviews);

      // Fetch reviewer user data in one batch
      const reviewerIds = [...new Set(reviews.map((r: any) => r.reviewer_id as string).filter(Boolean))];
      if (reviewerIds.length > 0) {
        const { data: reviewerUsers } = await supabase
          .from("users")
          .select("id,full_name,avatar_url,care_given_count,care_received_count")
          .in("id", reviewerIds);
        const map: Record<
          string,
          {
            full_name: string | null;
            avatar_url: string | null;
            care_given_count: number | null;
            care_received_count: number | null;
          }
        > = {};
        for (const u of reviewerUsers ?? []) {
          map[(u as any).id] = {
            full_name: (u as any).full_name ?? null,
            avatar_url: (u as any).avatar_url ?? null,
            care_given_count: (u as any).care_given_count ?? 0,
            care_received_count: (u as any).care_received_count ?? 0,
          };
        }
        setReviewerMap(map);
      } else {
        setReviewerMap({});
      }
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load profile.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPublicProfile();
  }, [profileId]);

  useEffect(() => {
    let cancelled = false;

    const loadBlockStatus = async () => {
      if (!user?.id || !profileId || isOwnProfile) {
        if (!cancelled) setBlockStatus("none");
        return;
      }

      try {
        const next = await getBlockDirection(user.id, profileId);
        if (!cancelled) setBlockStatus(next);
      } catch {
        if (!cancelled) setBlockStatus("none");
      }
    };

    void loadBlockStatus();
    return () => {
      cancelled = true;
    };
  }, [isOwnProfile, profileId, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      const refreshBlockStatus = async () => {
        if (!user?.id || !profileId || isOwnProfile) return;
        try {
          const next = await getBlockDirection(user.id, profileId);
          if (!cancelled) setBlockStatus(next);
        } catch {
          // no-op
        }
      };
      void refreshBlockStatus();
      return () => {
        cancelled = true;
      };
    }, [isOwnProfile, profileId, user?.id]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPublicProfile({ refresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  const loadSendRequestPets = async () => {
    if (!sendRequestOpen || !user?.id) return;
    setSendRequestLoading(true);
    setSelectedSeekingPet(null);
    setPetSendSubtitleById({});
    setOpenReqByPetId({});
    try {
      const { data: pets, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (petsError) throw petsError;
      const nextPets = pets ?? [];
      setUserPets(nextPets);
      if (nextPets.length === 0) return;

      const { data: openReqRows, error: reqError } = await supabase
        .from("care_requests")
        .select("id,pet_id,care_type,start_date,end_date,end_time")
        .eq("owner_id", user.id)
        .eq("status", "open")
        .in(
          "pet_id",
          nextPets.map((p: any) => p.id),
        )
        .order("created_at", { ascending: false });
      if (reqError) throw reqError;

      const now = new Date();
      const reqByPet: Record<string, any> = {};
      (openReqRows ?? []).forEach((r: any) => {
        if (!isRequestStillSeekable(r, now)) return;
        if (!reqByPet[r.pet_id]) reqByPet[r.pet_id] = r;
      });

      const eligiblePets = nextPets.filter((p: any) => Boolean(reqByPet[p.id]));
      const subtitleByPet: Record<string, string> = {};
      Object.entries(reqByPet).forEach(([pid, r]: [string, any]) => {
        subtitleByPet[pid] = formatRequestDateRange(r.start_date, r.end_date);
      });

      setUserPets(eligiblePets);
      setOpenReqByPetId(reqByPet);
      setPetSendSubtitleById(subtitleByPet);

      const firstEligible = eligiblePets[0] ?? null;
      setSelectedSeekingPet(firstEligible);
    } catch (err) {
      showToast({
        message: errorMessageFromUnknown(
          err,
          t("errors.sendRequestFailed"),
        ),
      });
    } finally {
      setSendRequestLoading(false);
    }
  };

  useEffect(() => {
    void loadSendRequestPets();
  }, [sendRequestOpen, user?.id]);

  const handleSendRequest = async () => {
    if (
      !user?.id ||
      !profileId ||
      isOwnProfile ||
      sendRequestBusy ||
      !selectedSeekingPet
    )
      return;
    const blockDirection = await getBlockDirection(user.id, profileId);
    if (blockDirection !== "none") {
      showToast({
        message: t(
          blockDirection === "i_blocked"
            ? "messages.blockedBySelfSend"
            : "messages.blockedByOtherSend",
        ),
      });
      return;
    }
    const openReq = openReqByPetId[selectedSeekingPet.id];
    if (!openReq?.id) return;
    const eligibility = await getRequestEligibility(openReq.id);
    if (!eligibility.eligible) {
      showToast({
        message: t("requestDetails.requestClosedForApplications"),
      });
      return;
    }

    setSendRequestBusy(true);
    try {
      const threadId = await getOrCreateThreadForUsers({
        userA: user.id,
        userB: profileId,
        requestId: openReq.id,
      });
      if (!threadId) throw new Error(t("errors.chatThreadCreateFailed"));

      const { error: msgError } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user.id,
        content: t("common.sendRequest"),
        type: "proposal",
        metadata: { requestId: openReq.id },
      });
      if (msgError) throw msgError;

      await supabase
        .from("threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);

      const dateRange = formatRequestDateRange(
        openReq.start_date,
        openReq.end_date,
      );
      const price =
        openReq.start_date && openReq.end_date
          ? formatCarePointsPts(
              openReq.care_type,
              openReq.start_date,
              openReq.end_date,
            )
          : "";

      setSendRequestOpen(false);
      router.push({
        pathname: "/(private)/chat/[threadId]" as any,
        params: {
          threadId,
          mode: "seeking",
          petName: selectedSeekingPet.name ?? t("pets.add.name"),
          breed: selectedSeekingPet.breed ?? "",
          date: dateRange,
          time: "",
          price,
          offerId: openReq.id,
        } as any,
      });
    } catch (err) {
      showToast({
        message: errorMessageFromUnknown(
          err,
          t("errors.sendRequestFailed"),
        ),
      });
    } finally {
      setSendRequestBusy(false);
    }
  };

  const handleBlockUser = async () => {
    if (!user?.id || !profileId || blockBusy) return;
    setBlockBusy(true);
    try {
      await blockUser(user.id, profileId);
      setShowBlockConfirm(false);
      setBlockReason("");
      setBlockStatus("i_blocked");
      showToast({
        message: t("messages.blockedToast"),
      });
    } catch (err) {
      showToast({
        message: errorMessageFromUnknown(
          err,
          t("messages.blockUpdateFailed"),
        ),
      });
    } finally {
      setBlockBusy(false);
    }
  };

  const handleUnblock = async () => {
    if (!user?.id || !profileId || blockBusy) return;
    setBlockBusy(true);
    try {
      await unblockUser(user.id, profileId);
      setShowUnblockConfirm(false);
      setBlockStatus("none");
      showToast({
        variant: "success",
        message: t("messages.unblocked"),
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t("messages.unblockFailed"),
        ),
      });
    } finally {
      setBlockBusy(false);
    }
  };

  const derived = useMemo(() => {
    return {
      avatarUri: publicProfile?.avatar_url || null,
      name: resolveDisplayName(publicProfile) || "User",
      location:
        publicProfile?.city?.trim() || t("profile.noLocation"),
      points: publicProfile?.points_balance ?? 0,
      handshakes: 0,
      paws: publicReviews.length,
      rating:
        publicReviews.length > 0
          ? publicReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
            publicReviews.length
          : 0,
      currentTask: undefined as string | undefined,
    };
  }, [publicProfile, publicReviews, t]);

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
          />
        }
      >
        {loading ? (
          <>
            <ProfileHeaderAndTabsSkeleton />
            <ProfilePetsTabSkeleton count={3} />
          </>
        ) : isResourceNotFound(loadError) ? (
          <ResourceMissingState
            onBack={() => router.back()}
            onHome={() =>
              router.replace(
                "/(private)/(tabs)/(home)" as Parameters<
                  typeof router.replace
                >[0],
              )
            }
          />
        ) : loadError ? (
          <ErrorState
            error={loadError}
            actionLabel={t("common.retry")}
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
                { key: "pets", label: t("profile.pets.tab") },
                {
                  key: "availability",
                  label: t("profile.edit.availabilityTab"),
                },
                {
                  key: "bio",
                  label: t("auth.signup.profile.bio"),
                },
                { key: "reviews", label: t("profile.reviews") },
              ]}
              activeKey={activeTab}
              onChange={setActiveTab}
              variant="underline"
            />

            {/* Tab content */}
            {activeTab === "pets" && (
              <ProfilePetsTab
                pets={publicPets.map((pet) => {
                  const parsed = parsePetNotes(pet.notes);
                  return {
                    id: pet.id,
                    imageSource: petGalleryUrls(pet)[0] ?? "",
                    petName: pet.name || "Pet",
                    breed: pet.breed || "Unknown breed",
                    petType: pet.species || "Pet",
                    bio: parsed.bio || "No pet bio yet.",
                    yardType:
                      ((pet as any)?.yard_type ?? parsed.yardType) || undefined,
                    ageRange:
                      ((pet as any)?.age_range ?? parsed.ageRange) || undefined,
                    energyLevel:
                      ((pet as any)?.energy_level ?? parsed.energyLevel) ||
                      undefined,
                  };
                })}
                showAddPetButton={false}
                showPetActions={false}
                onPetPress={(id) => router.push(`/(private)/pets/${id}`)}
              />
            )}
            {activeTab === "availability" &&
              (publicAvailability ? (
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
                    days: publicAvailability.days ?? [],
                    yardType: publicAvailability.yardType ?? "",
                    isPetOwner: publicAvailability.petOwner ?? "",
                  }}
                  emptyMessage={t("profile.availability.publicEmptyMessage")}
                />
              ) : (
                <DataState
                  title={t("profile.availability.publicEmptyTitle")}
                  message={t("profile.availability.publicEmptyMessage")}
                  illustration={
                    <AppImage
                      source={
                        IllustratedEmptyStateIllustrations.noAvailability.source
                      }
                      type={
                        IllustratedEmptyStateIllustrations.noAvailability
                          .type ?? "svg"
                      }
                      height={
                        IllustratedEmptyStateIllustrations.noAvailability.height
                      }
                      width={
                        IllustratedEmptyStateIllustrations.noAvailability.width
                      }
                      style={
                        IllustratedEmptyStateIllustrations.noAvailability.style
                      }
                      contentFit="contain"
                    />
                  }
                />
              ))}
            {activeTab === "bio" && (
              <ProfileBioTab bio={publicProfile?.bio} isMine={false} />
            )}
            {activeTab === "reviews" ? (
              <ProfileReviewsTab
                rating={derived.rating}
                handshakes={derived.handshakes}
                paws={derived.paws}
                items={publicReviews.map((r) => {
                  const rev = reviewerMap[r.reviewer_id] ?? null;
                  return {
                    id: r.id,
                    reviewerId: r.reviewer_id,
                    name: rev?.full_name?.trim() || "User",
                    avatar: rev?.avatar_url ?? null,
                    rating: r.rating ?? 0,
                    handshakes: rev?.care_given_count ?? 0,
                    paws: rev?.care_received_count ?? 0,
                    date: formatReviewRelativeDate(r.created_at),
                    review: r.comment || "",
                  };
                })}
                onReviewerPress={(reviewerId) => {
                  router.push({
                    pathname: "/(private)/(tabs)/(home)/users/[id]",
                    params: { id: reviewerId },
                  });
                }}
                scrollEnabled={false}
              />
            ) : null}
          </>
        )}
      </ScrollView>

      <PublicProfileActionsMenu
        visible={optionsVisible}
        canSendRequest={
          !sendRequestBusy &&
          Boolean(profileId) &&
          !isOwnProfile &&
          blockStatus === "none"
        }
        canOpenChat={
          !chatOpening &&
          Boolean(profileId) &&
          !isOwnProfile &&
          blockStatus !== "they_blocked"
        }
        isBlockedByMe={blockStatus === "i_blocked"}
        colors={colors}
        t={(key, fallback) => t(key, fallback as string)}
        styles={styles}
        onClose={() => setOptionsVisible(false)}
        onSendRequest={() => {
          setOptionsVisible(false);
          setSendRequestLoading(true);
          setSendRequestOpen(true);
        }}
        onOpenChat={() => {
          void (async () => {
            setOptionsVisible(false);
            if (!profileId || isOwnProfile) return;
            const result = await openThread(profileId);
            if (!result.ok) {
              showToast({
                message: result.message,
              });
            }
          })();
        }}
        onToggleBlock={() => {
          setOptionsVisible(false);
          if (blockStatus === "i_blocked") {
            setShowUnblockConfirm(true);
            return;
          }
          setShowBlockConfirm(true);
        }}
      />

      <SendRequestToUserModal
        visible={sendRequestOpen}
        colors={colors}
        styles={styles}
        userPets={userPets}
        loading={sendRequestLoading}
        selectedSeekingPet={selectedSeekingPet}
        petSendSubtitleById={petSendSubtitleById}
        sendingToName={derived.name || ""}
        sendRequestBusy={sendRequestBusy}
        t={t as any}
        onClose={() => setSendRequestOpen(false)}
        onSelectPet={setSelectedSeekingPet}
        onSend={() => {
          void handleSendRequest();
        }}
        onAddRequest={() => {
          setSendRequestOpen(false);
          router.push({
            pathname: "/(private)/post-requests",
            params: userPets?.[0]?.id ? { petId: userPets[0].id } : undefined,
          } as any);
        }}
        onAddPet={() => {
          setSendRequestOpen(false);
          router.push("/(private)/pets/add" as any);
        }}
      />

      <FeedbackModal
        visible={showBlockConfirm}
        title={t("profile.blockConfirmTitle")}
        description={t("profile.blockConfirmDescription")}
        body={
          <Input
            label={t("messages.blockReasonLabel")}
            placeholder={t(
              "messages.blockReasonPlaceholder",
              "Tell us why you are blocking this user",
            )}
            value={blockReason}
            onChangeText={setBlockReason}
            maxLength={250}
            multiline
            inputStyle={{ minHeight: 88, textAlignVertical: "top" }}
            containerStyle={{ marginBottom: 0 }}
          />
        }
        primaryLabel={t("profile.blockUser")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={blockBusy}
        onPrimary={() => {
          void handleBlockUser();
        }}
        onSecondary={() => {
          if (blockBusy) return;
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
        onRequestClose={() => {
          if (blockBusy) return;
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
      />
      <FeedbackModal
        visible={showUnblockConfirm}
        title={t("messages.unblock")}
        description={t(
          "messages.unblockConfirmDescription",
          "You’ll be able to message this user again after unblocking them.",
        )}
        primaryLabel={t("messages.unblock")}
        secondaryLabel={t("common.cancel")}
        primaryLoading={blockBusy}
        onPrimary={() => {
          void handleUnblock();
        }}
        onSecondary={() => {
          if (blockBusy) return;
          setShowUnblockConfirm(false);
        }}
        onRequestClose={() => {
          if (blockBusy) return;
          setShowUnblockConfirm(false);
        }}
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
  sendRequestOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  sendRequestCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    maxHeight: "84%",
  },
  sendRequestTitle: {
    marginBottom: 12,
  },
  sendRequestListContent: {
    gap: 10,
  },
  sendRequestPetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 6,
  },
  sendRequestRadioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sendRequestRadioInner: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  sendRequestPetThumb: {
    width: 32,
    height: 32,
    borderRadius: 999,
  },
  sendRequestPetName: {
    fontSize: 14,
  },
  sendRequestPetMeta: {
    marginTop: 2,
  },
  sendRequestSendingTo: {
    marginTop: 12,
  },
  sendRequestActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  sendRequestActionBtn: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
