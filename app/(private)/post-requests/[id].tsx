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
import {
  computeCarePoints,
  normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
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
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import type { CareTypeKey } from "@/src/shared/components/ui/CareTypeSelector";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Handshake, PawPrint, Star } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
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

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

function localYyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [isFavorite, setIsFavorite] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reqRow, setReqRow] = useState<any | null>(null);
  const [pet, setPet] = useState<any | null>(null);
  const [owner, setOwner] = useState<any | null>(null);
  const [viewer, setViewer] = useState<any | null>(null);
  const [ownerReviews, setOwnerReviews] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing request id.");
      return;
    }
    if (!user?.id) {
      setLoading(false);
      setError(t("common.error", "Something went wrong"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data: requestRaw, error: reqError } = await supabase
        .from("care_requests")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (reqError) throw reqError;
      const request = requestRaw as TablesRow<"care_requests"> | null;
      if (!request) {
        setReqRow(null);
        setPet(null);
        setOwner(null);
        setOwnerReviews([]);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const [
        { data: petRow, error: petError },
        { data: ownerRow, error: ownerError },
        { data: meRow, error: meError },
        { data: reviews, error: reviewsError },
      ] = await Promise.all([
        supabase
          .from("pets")
          .select("*")
          .eq("id", request.pet_id)
          .maybeSingle(),
        supabase
          .from("users")
          .select(
            "id,full_name,avatar_url,city,latitude,longitude,points_balance,care_given_count,care_received_count",
          )
          .eq("id", request.owner_id)
          .maybeSingle(),
        supabase
          .from("users")
          .select("id,latitude,longitude")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("reviews")
          .select("rating")
          .eq("reviewee_id", request.owner_id),
      ]);
      if (petError) throw petError;
      if (ownerError) throw ownerError;
      if (meError) throw meError;
      if (reviewsError) throw reviewsError;

      if (!petRow || !ownerRow) {
        setReqRow(null);
        setPet(null);
        setOwner(null);
        setViewer(null);
        setOwnerReviews([]);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      setReqRow(request);
      setPet(petRow);
      setOwner(ownerRow);
      setViewer(meRow ?? null);
      setOwnerReviews(reviews ?? []);

      const petForLike = petRow as TablesRow<"pets">;
      if (petForLike.id && user.id && petForLike.owner_id !== user.id) {
        const { data: likeRow } = await supabase
          .from("pet_likes")
          .select("pet_id")
          .eq("user_id", user.id)
          .eq("pet_id", petForLike.id)
          .maybeSingle();
        setIsFavorite(!!likeRow);
      } else {
        setIsFavorite(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("common.error", "Something went wrong"),
      );
    } finally {
      setLoading(false);
    }
  }, [id, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const parsedPetNotes = useMemo(() => parsePetNotes(pet?.notes), [pet?.notes]);

  const images = useMemo(() => petGalleryUrls(pet ?? {}), [pet]);

  const careReq = reqRow as TablesRow<"care_requests"> | null;

  const yardType =
    (typeof (pet as any)?.yard_type === "string" &&
    (pet as any).yard_type.trim().length > 0
      ? (pet as any).yard_type.trim()
      : null) ||
    parsedPetNotes.yardType ||
    null;
  const ageRange =
    (typeof (pet as any)?.age_range === "string" &&
    (pet as any).age_range.trim().length > 0
      ? (pet as any).age_range.trim()
      : null) ||
    parsedPetNotes.ageRange ||
    null;
  const energyLevel =
    (typeof (pet as any)?.energy_level === "string" &&
    (pet as any).energy_level.trim().length > 0
      ? (pet as any).energy_level.trim()
      : null) ||
    parsedPetNotes.energyLevel ||
    null;

  const careTypeKey: CareTypeKey = useMemo(
    () => normalizeCareTypeForPoints(reqRow?.care_type as string | undefined),
    [reqRow?.care_type],
  );

  const dateRange = useMemo(
    () => formatRequestDateRange(reqRow?.start_date, reqRow?.end_date),
    [reqRow?.end_date, reqRow?.start_date],
  );
  const timeRange = useMemo(
    () => formatRequestTimeRange(reqRow?.start_time, reqRow?.end_time),
    [reqRow?.end_time, reqRow?.start_time],
  );

  const isExpired = useMemo(() => {
    if (!reqRow?.end_date) return false;
    const today = localYyyyMmDd(new Date());
    // Compare as YYYY-MM-DD strings (timezone-safe)
    return String(reqRow.end_date) < today;
  }, [reqRow?.end_date]);

  const careTypeLabel = t(`feed.careTypes.${careTypeKey}`);

  const location = owner?.city?.trim() || t("profile.noLocation");

  const distanceLabel = useMemo(() => {
    const olat = owner?.latitude;
    const olon = owner?.longitude;
    const vlat = viewer?.latitude;
    const vlon = viewer?.longitude;
    if (
      typeof olat !== "number" ||
      typeof olon !== "number" ||
      typeof vlat !== "number" ||
      typeof vlon !== "number"
    ) {
      return "";
    }
    const km = haversineKm({ lat: vlat, lon: vlon }, { lat: olat, lon: olon });
    if (!Number.isFinite(km)) return "";
    return `${km < 10 ? km.toFixed(1) : Math.round(km)}km`;
  }, [owner?.latitude, owner?.longitude, viewer?.latitude, viewer?.longitude]);

  const petBioForCard = parsedPetNotes.bio?.trim() ?? "";

  const description = petBioForCard;

  const ownerRating =
    ownerReviews.length > 0
      ? ownerReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) /
        ownerReviews.length
      : 0;

  const request = {
    petName: pet?.name ?? t("pets.add.name", "Pet"),
    breed: pet?.breed ?? t("pets.add.breed", "Breed"),
    petType: pet?.species ?? t("pets.add.kind", "Pet"),
    dateRange,
    time: timeRange,
    careType: careTypeLabel,
    location,
    distance: distanceLabel,
    description,
    owner: {
      id: owner?.id ?? "",
      name: resolveDisplayName(owner) || t("requestDetails.owner", "Owner"),
      avatar: owner?.avatar_url ?? "",
      rating: ownerRating,
      handshakes: owner?.care_given_count ?? 0,
      paws: owner?.care_received_count ?? 0,
    },
    details: {
      yardType: yardType ?? t("common.empty", "—"),
      age: ageRange ?? t("common.empty", "—"),
      energyLevel: energyLevel ?? t("common.empty", "—"),
    },
    specialNeeds:
      [
        parsedPetNotes.specialNeeds?.trim(),
        typeof (pet as any)?.special_needs_description === "string"
          ? (pet as any).special_needs_description.trim()
          : "",
      ]
        .filter(Boolean)
        .join("\n\n") || t("pet.detail.none", "None"),
  };

  const isOwner = Boolean(
    user?.id && reqRow?.owner_id && user.id === reqRow.owner_id,
  );

  const togglePetLike = () => {
    if (!user?.id || !pet?.id || isOwner || likeBusy) return;
    void (async () => {
      const next = !isFavorite;
      setIsFavorite(next);
      setLikeBusy(true);
      try {
        if (next) {
          const { error } = await supabase.from("pet_likes").insert({
            user_id: user.id,
            pet_id: pet.id,
            care_request_id: id ?? null,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("pet_likes")
            .delete()
            .eq("user_id", user.id)
            .eq("pet_id", pet.id);
          if (error) throw error;
        }
      } catch (err) {
        setIsFavorite(!next);
        showToast({
          variant: "error",
          message: errorMessageFromUnknown(
            err,
            t("common.error", "Something went wrong"),
          ),
          durationMs: 3200,
        });
      } finally {
        setLikeBusy(false);
      }
    })();
  };

  const openApplyConfirm = () => {
    void (async () => {
      if (blockIfKycNotApproved()) return;
      if (!user?.id || !id || !reqRow?.owner_id) {
        showToast({
          variant: "error",
          message: t("common.error", "Something went wrong"),
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
      if (isExpired) {
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
      const eligibility = await getRequestEligibility(id);
      if (!eligibility.eligible) {
        showToast({
          variant: "info",
          message: t(
            "requestDetails.requestClosedForApplications",
            "This request is no longer accepting applications.",
          ),
          durationMs: 4200,
        });
        return;
      }
      const blocked = await hasUserBlockRelation(
        user.id,
        reqRow.owner_id as string,
      );
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
      setApplyConfirmOpen(true);
    })();
  };

  const runApply = async () => {
    if (blockIfKycNotApproved()) {
      setApplyConfirmOpen(false);
      return;
    }
    if (!user?.id || !id || !reqRow?.owner_id) return;
    const ownerId = reqRow.owner_id as string;
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
      requestId: id,
    });

    if (!threadId) throw new Error("Could not create chat thread.");

    const formulaPoints =
      reqRow.start_date && reqRow.end_date
        ? computeCarePoints(
            reqRow.care_type,
            reqRow.start_date as string,
            reqRow.end_date as string,
          )
        : null;
    const price = formulaPoints != null ? `${formulaPoints} pts` : "";

    const { error: msgError } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      content: t("requestDetails.applyNow"),
      type: "proposal",
      metadata: {
        requestId: id,
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
      pathname: "/(private)/(tabs)/messages/[threadId]" as any,
      params: {
        threadId,
        mode: "applying",
        petName: request.petName,
        breed: request.breed,
        date: request.dateRange,
        time: request.time,
        price,
        offerId: id,
      } as any,
    });
  };

  const onApplyConfirmed = () => {
    void (async () => {
      setApplying(true);
      try {
        await runApply();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t("common.error", "Something went wrong"),
        );
      } finally {
        setApplying(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader
          className="pl-0 pt-0"
          title=""
          onBack={() => router.back()}
        />
        <View style={styles.screenWrap}>
          <RequestDetailScreenSkeleton />
        </View>
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader
          className="pl-0 pt-0"
          title=""
          onBack={() => router.back()}
        />
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

  if (error || !reqRow || !pet || !owner) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader
          className="pl-0 pt-0"
          title=""
          onBack={() => router.back()}
        />
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
    <PageContainer contentStyle={{ paddingTop: 0, paddingHorizontal: 0 }}>
      <BackHeader title="" onBack={() => router.back()} />
      <RequestPetDetailView
        colors={colors}
        t={(key: string, fallback?: string) => t(key, fallback as string)}
        images={images}
        request={request}
        isOwner={isOwner}
        isFavorite={isFavorite}
        favoriteDisabled={likeBusy}
        onFavoritePress={togglePetLike}
        onPetNamePress={
          pet?.id
            ? () =>
                router.push({
                  pathname: "/(private)/pets/[id]",
                  params: { id: pet.id },
                })
            : undefined
        }
        onViewProfile={() =>
          request.owner.id === user?.id
            ? router.push("/(private)/(tabs)/profile" as any)
            : router.push({
                pathname: "/(private)/(tabs)/profile/users/[id]",
                params: { id: request.owner.id },
              })
        }
        apply={{
          visible: true,
          label: t("requestDetails.applyNow"),
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
  screen: {
    flex: 1,
  },
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
  contentPad: {
    paddingHorizontal: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  nameBreedRow: {
    flex: 1,
    gap: 4,
  },
  petName: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.1,
  },
  breedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
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
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
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
  miniPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
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
  applyBtn: {
    alignSelf: "stretch",
    paddingVertical: 14,
  },
});
