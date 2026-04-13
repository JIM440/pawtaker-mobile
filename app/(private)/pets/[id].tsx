import { Colors } from "@/src/constants/colors";
import { PetDetailPill } from "@/src/features/pets/components/PetDetailPill";
import { ApplyConfirmModal } from "@/src/features/post/components/ApplyConfirmModal";
import { RequestPetDetailView } from "@/src/features/requests/components/RequestPetDetailView";
import { hasUserBlockRelation } from "@/src/lib/blocks/user-blocks";
import { getRequestEligibility } from "@/src/lib/contracts/request-eligibility";
import {
  formatRequestDateRange,
  formatRequestTimeRange,
} from "@/src/lib/datetime/request-date-time-format";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { getOrCreateThreadForUsers } from "@/src/lib/messages/get-or-create-thread";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { isRequestSeekingActive } from "@/src/lib/requests/is-request-seeking-active";
import {
  computeCarePoints,
  normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
import { hasAvailabilityProfile } from "@/src/lib/taker/availability-profile";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { PetDetailHeaderSection } from "@/src/shared/components/pets/PetDetailHeaderSection";
import { PetPhotoCarousel } from "@/src/shared/components/pets/PetPhotoCarousel";
import { RequestDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { ErrorState, ResourceMissingState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Handshake, PawPrint, Star } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const H_PADDING = 16;
const IMAGE_HEIGHT = 216;

function localYyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PetDetailScreen() {
  const { id: _petId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showToast = useToastStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState<any | null>(null);
  const [owner, setOwner] = useState<any | null>(null);
  const [openRequest, setOpenRequest] = useState<any | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!_petId) {
      setLoading(false);
      setError("Missing pet id.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: petRaw, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("id", _petId)
        .maybeSingle();
      if (petError) throw petError;
      const petRow = petRaw as TablesRow<"pets"> | null;
      if (!petRow) {
        setPet(null);
        setOwner(null);
        setOpenRequest(null);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const [
        { data: ownerRow, error: ownerError },
        { data: reqRows, error: reqError },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id,full_name,avatar_url,city,latitude,longitude")
          .eq("id", petRow.owner_id)
          .maybeSingle(),
        supabase
          .from("care_requests")
          .select("id,status,taker_id,start_date,end_date,start_time,end_time,care_type")
          .eq("pet_id", petRow.id)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      if (ownerError) throw ownerError;
      if (reqError) throw reqError;

      setPet(petRow);
      setOwner(ownerRow ?? null);
      setOpenRequest((reqRows?.[0] as any) ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "pet.detail.loadFailed",
              "We couldn't load this pet right now. Please try again.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [_petId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!openRequest?.id) return;

    const channel = supabase
      .channel(`pet-request-${openRequest.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "care_requests",
          filter: `id=eq.${openRequest.id}`,
        },
        (payload) => {
          setOpenRequest((prev: any) =>
            prev ? { ...prev, ...payload.new } : payload.new,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [openRequest?.id]);

  const parsedNotes = useMemo(() => parsePetNotes(pet?.notes), [pet?.notes]);
  const yardType = (pet as any)?.yard_type ?? parsedNotes.yardType;
  const ageRange = (pet as any)?.age_range ?? parsedNotes.ageRange;
  const energyLevel = (pet as any)?.energy_level ?? parsedNotes.energyLevel;

  const images = useMemo(() => petGalleryUrls(pet ?? {}), [pet]);

  const careTypeLabel = useMemo(() => {
    const key = normalizeCareTypeForPoints(
      openRequest?.care_type as string | undefined,
    );
    return t(`feed.careTypes.${key}`);
  }, [openRequest?.care_type, t]);

  const seekingDateRange = useMemo(
    () =>
      formatRequestDateRange(openRequest?.start_date, openRequest?.end_date),
    [openRequest?.end_date, openRequest?.start_date],
  );

  const seekingTime = useMemo(
    () =>
      formatRequestTimeRange(openRequest?.start_time, openRequest?.end_time),
    [openRequest?.end_time, openRequest?.start_time],
  );
  const isSeeking = useMemo(
    () => isRequestSeekingActive(openRequest),
    [openRequest],
  );

  const isOwner = Boolean(
    user?.id && pet?.owner_id && user.id === pet.owner_id,
  );

  const canApply = useMemo(() => {
    if (!openRequest?.id) return false;
    if (isOwner) return false;
    if (openRequest?.status !== "open") return false;
    if (!openRequest?.end_date) return true;
    const today = localYyyyMmDd(new Date());
    return String(openRequest.end_date) >= today;
  }, [isOwner, openRequest?.end_date, openRequest?.id, openRequest?.status]);
  const requestAcceptedByAnother =
    Boolean(
      !isOwner &&
        openRequest?.status === "accepted" &&
        openRequest?.taker_id &&
        openRequest.taker_id !== user?.id,
    );

  const location = owner?.city?.trim() || t("profile.noLocation");

  const ownerName =
    resolveDisplayName(owner) || t("requestDetails.owner", "Owner");
  const openThreadForExistingApply = useCallback(
    async (requestId: string, ownerId: string) => {
      if (!user?.id) return false;
      const participants = [user.id, ownerId].sort();
      const { data: existing, error: existingError } = await supabase
        .from("threads")
        .select("id")
        .eq("request_id", requestId)
        .contains("participant_ids", participants)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing?.id) return false;

      const { data: myProposal, error: proposalError } = await supabase
        .from("messages")
        .select("id")
        .eq("thread_id", existing.id)
        .eq("type", "proposal")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (proposalError) throw proposalError;
      if (!myProposal?.id) return false;

      const formulaPoints =
        openRequest?.start_date && openRequest?.end_date
          ? computeCarePoints(
              openRequest.care_type,
              openRequest.start_date as string,
              openRequest.end_date as string,
            )
          : null;
      const price = formulaPoints != null ? `${formulaPoints} pts` : "";

      showToast({
        variant: "info",
        message: t(
          "requestDetails.alreadyApplied",
          "You already applied for this request. Opening your message thread.",
        ),
        durationMs: 3000,
      });
      router.push({
        pathname: "/(private)/chat/[threadId]" as any,
        params: {
          threadId: existing.id,
          mode: "applying",
          petName: pet?.name ?? t("pets.add.name", "Pet"),
          breed: pet?.breed ?? t("pets.add.breed", "Breed"),
          date: seekingDateRange,
          time: seekingTime,
          price,
          offerId: requestId,
          focusMessageId: myProposal.id,
        } as any,
      });
      return true;
    },
    [
      openRequest?.care_type,
      openRequest?.end_date,
      openRequest?.start_date,
      pet?.breed,
      pet?.name,
      router,
      seekingDateRange,
      seekingTime,
      showToast,
      t,
      user?.id,
    ],
  );

  const openApplyConfirm = useCallback(() => {
    void (async () => {
      if (blockIfKycNotApproved()) return;
      if (!user?.id || !openRequest?.id || !owner?.id) {
        showToast({
          variant: "error",
          message: t(
            "requestDetails.applyStartFailed",
            "We couldn't start your application for this request.",
          ),
          durationMs: 4200,
        });
        return;
      }
      if (isOwner) {
        showToast({
          variant: "info",
          message: t(
            "requestDetails.cannotApplyOwnRequest",
            "You cannot apply to your own request.",
          ),
          durationMs: 4200,
        });
        return;
      }
      if (!canApply) {
        showToast({
          variant: "info",
          message: t(
            "requestDetails.requestExpired",
            "This request has ended and is no longer accepting applications.",
          ),
          durationMs: 4200,
        });
        return;
      }
      const hasProfile = await hasAvailabilityProfile(user.id);
      if (!hasProfile) {
        showToast({
          variant: "info",
          message: t(
            "offer.availabilityProfileRequired",
            "Add your availability profile before applying to pet requests.",
          ),
          durationMs: 4200,
        });
        return;
      }
      const eligibility = await getRequestEligibility(openRequest.id as string);
      if (!eligibility.eligible) {
        showToast({
          variant: "info",
          message:
            eligibility.selectedTakerId &&
            eligibility.selectedTakerId !== user.id
              ? t(
                  "requestDetails.requestAcceptedByAnother",
                  "Another caregiver has already accepted this request.",
                )
              : t(
                  "requestDetails.requestClosedForApplications",
                  "This request is no longer accepting applications.",
                ),
          durationMs: 4200,
        });
        return;
      }
      const blocked = await hasUserBlockRelation(user.id, owner.id as string);
      if (blocked) {
        showToast({
          variant: "error",
          message: t(
            "messages.blockedNoMessaging",
            "You cannot message this user because one of you has blocked the other.",
          ),
          durationMs: 4800,
        });
        return;
      }
      const handled = await openThreadForExistingApply(
        openRequest.id as string,
        owner.id as string,
      );
      if (handled) return;
      setApplyConfirmOpen(true);
    })();
  }, [
    canApply,
    isOwner,
    openRequest?.id,
    openThreadForExistingApply,
    owner?.id,
    showToast,
    t,
    user?.id,
  ]);

  const runApply = useCallback(async () => {
    if (blockIfKycNotApproved()) {
      setApplyConfirmOpen(false);
      return;
    }
    if (!user?.id || !openRequest?.id || !owner?.id) return;
    const hasProfile = await hasAvailabilityProfile(user.id);
    if (!hasProfile) {
      throw new Error(
        t(
          "offer.availabilityProfileRequired",
          "Add your availability profile before applying to pet requests.",
        ),
      );
    }
    const requestId = openRequest.id as string;
    const ownerId = owner.id as string;
    const blocked = await hasUserBlockRelation(user.id, ownerId);
    if (blocked) {
      throw new Error(
        t(
          "messages.blockedNoMessaging",
          "You cannot message this user because one of you has blocked the other.",
        ),
      );
    }
    const threadId = await getOrCreateThreadForUsers({
      userA: user.id,
      userB: ownerId,
      requestId,
    });
    if (!threadId) throw new Error("Could not create chat thread.");

    const formulaPoints =
      openRequest.start_date && openRequest.end_date
        ? computeCarePoints(
            openRequest.care_type,
            openRequest.start_date as string,
            openRequest.end_date as string,
          )
        : null;
    const price = formulaPoints != null ? `${formulaPoints} pts` : "";
    const { error: msgError } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      content: t("requestDetails.applyNow"),
      type: "proposal",
      metadata: {
        requestId,
        pointsOffered: formulaPoints,
      },
    });
    if (msgError) throw msgError;

    await supabase
      .from("threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", threadId);

    setApplyConfirmOpen(false);
    router.push({
      pathname: "/(private)/chat/[threadId]" as any,
      params: {
        threadId,
        mode: "applying",
        petName: pet?.name ?? t("pets.add.name", "Pet"),
        breed: pet?.breed ?? t("pets.add.breed", "Breed"),
        date: seekingDateRange,
        time: seekingTime,
        price,
        offerId: requestId,
      } as any,
    });
  }, [
    openRequest,
    owner?.id,
    pet?.breed,
    pet?.name,
    router,
    seekingDateRange,
    seekingTime,
    t,
    user?.id,
  ]);

  const onApplyConfirmed = useCallback(() => {
    void (async () => {
      setApplying(true);
      try {
        await runApply();
      } catch (err) {
        showToast({
          variant: "error",
          message: errorMessageFromUnknown(
            err,
            t("requestDetails.applyFailed"),
          ),
          durationMs: 3200,
        });
      } finally {
        setApplying(false);
      }
    })();
  }, [runApply, showToast, t]);

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader className="pl-0" title="" onBack={() => router.back()} />
        <RequestDetailScreenSkeleton />
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader className="pl-0" title="" onBack={() => router.back()} />
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
      </PageContainer>
    );
  }

  if (error || !pet) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader className="pl-0" title="" onBack={() => router.back()} />
        <ErrorState
          error={error}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void load();
          }}
          mode="full"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <BackHeader title="" onBack={() => router.back()} style={{}} />
      <RequestPetDetailView
        colors={colors}
        t={(key: string, fallback?: string) => t(key, fallback as string)}
        images={images}
        request={{
          petName: pet.name ?? t("pets.add.name", "Pet"),
          breed: pet.breed || t("pets.add.breed", "Breed"),
          petType: pet.species || t("pets.add.kind", "Pet"),
          dateRange: isSeeking ? seekingDateRange : "",
          time: isSeeking ? seekingTime : "",
          careType: isSeeking ? careTypeLabel : "",
          location,
          distance: "",
          description:
            parsedNotes.bio ||
            (typeof pet?.notes === "string" ? pet.notes : "") ||
            t("post.request.noDescription", "No description yet."),
          owner: {
            id: owner?.id ?? "",
            name: ownerName,
            avatar: owner?.avatar_url ?? "",
            rating: 0,
            handshakes: 0,
            paws: 0,
          },
          details: {
            yardType: yardType ?? t("common.empty", "—"),
            age: ageRange ?? t("common.empty", "—"),
            energyLevel: energyLevel ?? t("common.empty", "—"),
          },
          specialNeeds: parsedNotes.specialNeeds ?? t("pet.detail.none", "None"),
        }}
        isOwner={isOwner}
        isFavorite={isFavorite}
        onViewProfile={() => {
          if (!owner?.id) return;
          if (owner.id === user?.id) {
            router.push("/(private)/(tabs)/profile" as any);
            return;
          }
          router.push({
                pathname: "/(private)/(tabs)/(home)/users/[id]",
            params: { id: owner.id },
          });
        }}
        topNotice={
          !openRequest
            ? t(
                "pet.detail.noOpenRequest",
                "This pet doesn’t have an open care request right now.",
              )
            : requestAcceptedByAnother
              ? t(
                  "requestDetails.requestAcceptedByAnother",
                  "Another caregiver has already accepted this request.",
                )
              : openRequest?.status !== "open"
                ? t(
                    "requestDetails.requestClosedForApplications",
                    "This request is no longer accepting applications.",
                  )
                : null
        }
        apply={{
          visible: canApply,
          label: t("requestDetails.applyNow", "Apply now"),
          onPress: openApplyConfirm,
          loading: applying,
          disabled: applying,
        }}
      />
      <ApplyConfirmModal
        visible={applyConfirmOpen}
        applying={applying}
        colors={colors}
        t={(key, fallback) => t(key, fallback as string)}
        onClose={() => setApplyConfirmOpen(false)}
        onConfirm={onApplyConfirmed}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  screenWrap: {
    flex: 1,
    position: "relative",
  },
  imageContainer: {
    width: "100%",
    // minHeight: 300,
    position: "relative",
    marginBottom: 8,
  },
  emptyGalleryPlaceholder: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  petName: {
    fontSize: 28,
    marginBottom: 4,
  },
  seekingPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownerNameText: {
    fontWeight: "600",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
  },
  description: {
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 13,
    fontSize: 11,
  },
  ownerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 999,
    marginBottom: 24,
  },
  viewProfileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  ownerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 999,
    overflow: "hidden",
  },
  ownerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  ownerName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  ownerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ownerStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    borderRadius: 999,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  detailsCard: {
    marginBottom: 20,
  },
  detailPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  detailPillGroup: {
    gap: 6,
  },
  pillLabel: {
    fontSize: 12,
    paddingHorizontal: 4,
    paddingBottom: 6,
  },
  pillValue: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  specialLabel: {
    marginBottom: 8,
    marginTop: 12,
    fontSize: 12,
  },
  specialText: {
    lineHeight: 20,
    marginBottom: 28,
    fontSize: 12,
  },
  fixedFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: Platform.OS === "ios" ? 38 : 22,
    alignItems: "center",
    zIndex: 10,
  },
  fixedFooterInner: {
    width: "100%",
    paddingHorizontal: 16,
  },
  applyBtn: {
    alignSelf: "stretch",
    paddingVertical: 14,
  },
});

