import { Colors } from "@/src/constants/colors";
import { ApplyConfirmModal } from "@/src/features/post/components/ApplyConfirmModal";
import { RequestPetDetailView } from "@/src/features/requests/components/RequestPetDetailView";
import { getBlockDirection } from "@/src/lib/blocks/user-blocks";
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
import { hasAvailabilityProfile } from "@/src/lib/taker/availability-profile";
import { getOrCreateThreadForUsers } from "@/src/lib/messages/get-or-create-thread";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import {
    computeCarePoints,
    normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { enforceLocationGate } from "@/src/shared/utils/locationGate";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { RequestDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { ErrorState, ResourceMissingState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import type { CareTypeKey } from "@/src/shared/components/ui/CareTypeSelector";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { Input } from "@/src/shared/components/ui/Input";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Ellipsis,
  Flag,
    Pencil,
    Trash2
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    TouchableOpacity,
    View
} from "react-native";

const H_PADDING = 16;
const IMAGE_HEIGHT = 216;

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
  const { user, profile } = useAuthStore();
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
  const [assignedTaker, setAssignedTaker] = useState<any | null>(null);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyConfirmOpen, setApplyConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuBtnLayout, setMenuBtnLayout] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reportConfirmOpen, setReportConfirmOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [hasContract, setHasContract] = useState(false);
  const [distanceKmServer, setDistanceKmServer] = useState<number | null>(null);
  const [ownerDistanceKmServer, setOwnerDistanceKmServer] = useState<number | null>(
    null,
  );
  const menuBtnRef = useRef<View>(null);

  const load = useCallback(async () => {
    if (!id) {
      setLoading(false);
      setError("Missing request id.");
      return;
    }
    if (!user?.id) {
      setLoading(false);
      setError(
        t(
          "requestDetails.loadFailed",
          "We couldn't load this pet request right now. Please try again.",
        ),
      );
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
        setHasContract(false);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const [
        { data: petRow, error: petError },
        { data: ownerRow, error: ownerError },
        { data: meRow, error: meError },
        { data: reviews, error: reviewsError },
        { data: takerRow, error: takerError },
        { data: takerReviews, error: takerReviewsError },
        { data: existingContract, error: contractError },
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
        request.taker_id
          ? supabase
              .from("users")
              .select("id,full_name,avatar_url,care_given_count,care_received_count")
              .eq("id", request.taker_id)
              .maybeSingle()
          : Promise.resolve({ data: null, error: null }),
        request.taker_id
          ? supabase
              .from("reviews")
              .select("rating")
              .eq("reviewee_id", request.taker_id)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("contracts")
          .select("id")
          .eq("request_id", request.id)
          .maybeSingle(),
      ]);
      if (petError) throw petError;
      if (ownerError) throw ownerError;
      if (meError) throw meError;
      if (reviewsError) throw reviewsError;
      if (takerError) throw takerError;
      if (takerReviewsError) throw takerReviewsError;
      if (contractError) throw contractError;

      if (!petRow || !ownerRow) {
        setReqRow(null);
        setPet(null);
        setOwner(null);
        setViewer(null);
        setOwnerReviews([]);
        setHasContract(false);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      setReqRow(request);
      setPet(petRow);
      setOwner(ownerRow);
      setViewer(meRow ?? null);
      setOwnerReviews(reviews ?? []);
      const takerRating =
        (takerReviews ?? []).length > 0
          ? (takerReviews ?? []).reduce((sum, r: any) => sum + (r.rating ?? 0), 0) /
            (takerReviews ?? []).length
          : 0;
      setAssignedTaker(
        takerRow
          ? {
              ...takerRow,
              rating_avg: takerRating,
            }
          : null,
      );
      setHasContract(Boolean(existingContract));

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
      setHasContract(false);
      setError(
        err instanceof Error
          ? err.message
          : t(
              "requestDetails.loadFailed",
              "We couldn't load this pet request right now. Please try again.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [id, t, user?.id]);

  useEffect(() => {
    let cancelled = false;
    const loadAvailability = async () => {
      if (!user?.id) return;
      try {
        const ready = await hasAvailabilityProfile(user.id);
        if (!cancelled) {
          setHasAvailability(ready);
        }
      } finally {
        if (!cancelled) {
          setAvailabilityReady(true);
        }
      }
    };
    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel(`care-request-detail-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "care_requests",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setReqRow((prev: any) => (prev ? { ...prev, ...payload.new } : payload.new));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [id]);

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

  const requestStartDate = typeof reqRow?.start_date === "string" ? reqRow.start_date : "";
  const todayYmd = localYyyyMmDd(new Date());
  const hasStarted = Boolean(requestStartDate) && requestStartDate <= todayYmd;
  const requestSnapshotCity =
    typeof reqRow?.city === "string" ? reqRow.city.trim() : "";
  const ownerCity = typeof owner?.city === "string" ? owner.city.trim() : "";
  const location = hasStarted
    ? requestSnapshotCity || ownerCity || t("profile.noLocation")
    : ownerCity || requestSnapshotCity || t("profile.noLocation");

  useEffect(() => {
    if (!id || viewer?.latitude == null || viewer?.longitude == null) {
      setDistanceKmServer(null);
      return;
    }
    const rlat = reqRow?.latitude;
    const rlng = reqRow?.longitude;
    if (rlat == null || rlng == null) {
      setDistanceKmServer(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.rpc("distances_for_requests", {
        user_lat: viewer.latitude as number,
        user_lng: viewer.longitude as number,
        request_ids: [id],
      });
      if (cancelled) return;
      if (error || !Array.isArray(data) || data.length === 0) {
        setDistanceKmServer(null);
        return;
      }
      const row = data[0] as { distance_km?: number };
      const km = row?.distance_km;
      setDistanceKmServer(typeof km === "number" && Number.isFinite(km) ? km : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [
    id,
    reqRow?.latitude,
    reqRow?.longitude,
    viewer?.latitude,
    viewer?.longitude,
  ]);

  useEffect(() => {
    if (!owner?.id || viewer?.latitude == null || viewer?.longitude == null) {
      setOwnerDistanceKmServer(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase.rpc("distances_for_users", {
        user_lat: viewer.latitude as number,
        user_lng: viewer.longitude as number,
        user_ids: [owner.id],
      });
      if (cancelled) return;
      if (error || !Array.isArray(data) || data.length === 0) {
        setOwnerDistanceKmServer(null);
        return;
      }
      const row = data[0] as { distance_km?: number };
      const km = row?.distance_km;
      setOwnerDistanceKmServer(
        typeof km === "number" && Number.isFinite(km) ? km : null,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [owner?.id, viewer?.latitude, viewer?.longitude]);

  const distanceLabel =
    hasStarted
      ? distanceKmServer != null
        ? `${distanceKmServer.toFixed(1)} km`
        : ""
      : ownerDistanceKmServer != null
        ? `${ownerDistanceKmServer.toFixed(1)} km`
        : "";

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
  const requestStatus = typeof reqRow?.status === "string" ? reqRow.status : null;
  const selectedTakerId =
    typeof reqRow?.taker_id === "string" ? reqRow.taker_id : null;
  const canEditRequest =
    isOwner &&
    requestStatus === "open" &&
    !selectedTakerId &&
    !hasContract;
  const requestAcceptedByAnother =
    !isOwner &&
    requestStatus === "accepted" &&
    Boolean(selectedTakerId) &&
    selectedTakerId !== user?.id;
  const requestAssignedToCurrentUser =
    !isOwner &&
    requestStatus === "accepted" &&
    Boolean(selectedTakerId) &&
    selectedTakerId === user?.id;
  const applyBlockedByAvailability =
    !isOwner && availabilityReady && !hasAvailability;
  const requestTopNotice = requestAcceptedByAnother
    ? t(
        "requestDetails.requestAcceptedByAnother",
        "Another caregiver has already accepted this request.",
      )
    : requestAssignedToCurrentUser
      ? t(
          "requestDetails.requestAssignedToYou",
          "A caregiver has already been assigned for this request.",
        )
      : isExpired && !isOwner
        ? t(
            "requestDetails.requestExpired",
            "This request has ended and is no longer accepting applications.",
          )
    : !isOwner && requestStatus && requestStatus !== "open"
      ? t(
          "requestDetails.requestClosedForApplications",
          "This request is no longer accepting applications.",
        )
      : applyBlockedByAvailability
        ? t(
            "offer.availabilityProfileRequired",
            "Add your availability profile before applying to pet requests.",
          )
      : null;

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
            t("requestDetails.updatePetLikeFailed"),
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
      if (!enforceLocationGate(profile, router, showToast, t)) return;
      if (!user?.id || !id || !reqRow?.owner_id) {
        showToast({
          variant: "error",
          message: t("requestDetails.startApplicationFailed"),
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
      if (!hasAvailability) {
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
      const eligibility = await getRequestEligibility(id);
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
      const blockDirection = await getBlockDirection(
        user.id,
        reqRow.owner_id as string,
      );
      if (blockDirection !== "none") {
        showToast({
          variant: "error",
          message: t(
            blockDirection === "i_blocked"
              ? "messages.blockedBySelfSend"
              : "messages.blockedByOtherSend",
            blockDirection === "i_blocked"
              ? "You blocked this user, so you can't message them."
              : "This user blocked you, so you can't message them.",
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
    if (!enforceLocationGate(profile, router, showToast, t)) {
      setApplyConfirmOpen(false);
      return;
    }
    if (!user?.id || !id || !reqRow?.owner_id) return;
    if (!hasAvailability) {
      throw new Error(
        t(
          "offer.availabilityProfileRequired",
          "Add your availability profile before applying to pet requests.",
        ),
      );
    }
    const ownerId = reqRow.owner_id as string;
    const blockDirection = await getBlockDirection(user.id, ownerId);
    if (blockDirection !== "none") {
      throw new Error(
        t(
          blockDirection === "i_blocked"
            ? "messages.blockedBySelfSend"
            : "messages.blockedByOtherSend",
          blockDirection === "i_blocked"
            ? "You blocked this user, so you can't message them."
            : "This user blocked you, so you can't message them.",
        ),
      );
    }
    const threadId = await getOrCreateThreadForUsers({
      userA: user.id,
      userB: ownerId,
      requestId: id,
    });

    if (!threadId) throw new Error(t("errors.chatThreadCreateFailed"));

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
      pathname: "/(private)/chat/[threadId]" as any,
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

  const openMenu = () => {
    menuBtnRef.current?.measureInWindow((x, y, width, height) => {
      setMenuBtnLayout({ x, y, width, height });
      setMenuOpen(true);
    });
  };

  const handleDeleteRequest = async () => {
    setDeleteConfirmOpen(false);
    if (!id || !user?.id) return;
    setDeleting(true);
    try {
      const { data: existingContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("request_id", id)
        .maybeSingle();

      if (existingContract) {
        showToast({
          variant: "error",
          message: t("requestDetails.deleteRequestContractExists"),
          durationMs: 4800,
        });
        return;
      }

      const { error: deleteError } = await supabase
        .from("care_requests")
        .delete()
        .eq("id", id)
        .eq("owner_id", user.id);

      if (deleteError) throw deleteError;

      setReqRow(null);
      setPet(null);
      setOwner(null);
      setError(RESOURCE_NOT_FOUND);
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t("requestDetails.deleteRequestFailed"),
        ),
        durationMs: 3200,
      });
    } finally {
      setDeleting(false);
    }
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
            : t(
                "requestDetails.applyFailed",
                "We couldn't apply to this request right now.",
              ),
        );
      } finally {
        setApplying(false);
      }
    })();
  };

  const handleReportRequest = async () => {
    if (!user?.id || !owner?.id || !reqRow?.id) return;
    const details = reportReason.trim();
    if (!details) {
      showToast({
        variant: "error",
        message: t("messages.reportReasonRequired", "Please enter a reason."),
        durationMs: 2800,
      });
      return;
    }

    setReporting(true);
    try {
      const { error: reportError } = await supabase.from("reports").insert({
        reporter_id: user.id,
        reported_user_id: owner.id,
        reason: "pet_request_content",
        details: `request_id=${reqRow.id}; ${details}`,
      });
      if (reportError) throw reportError;

      setReportConfirmOpen(false);
      setReportReason("");
      showToast({
        variant: "success",
        message: t("messages.reportSubmitted", "Report submitted."),
        durationMs: 2800,
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(err, t("messages.reportFailed")),
        durationMs: 3200,
      });
    } finally {
      setReporting(false);
    }
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
      <BackHeader
        title=""
        onBack={() => router.back()}
        rightSlot={
          isOwner ? (
            <View ref={menuBtnRef}>
              <TouchableOpacity
                onPress={openMenu}
                style={styles.menuBtn}
                hitSlop={8}
              >
                <Ellipsis size={22} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setReportConfirmOpen(true)}
              style={styles.menuBtn}
              hitSlop={8}
            >
              <Flag size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          )
        }
      />
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
                pathname: "/(private)/(tabs)/(home)/users/[id]",
                params: { id: request.owner.id },
              })
        }
        topNotice={requestTopNotice}
        apply={{
          visible:
            !isOwner &&
            requestStatus === "open" &&
            !isExpired &&
            !requestAcceptedByAnother &&
            !requestAssignedToCurrentUser,
          label: t("requestDetails.applyNow"),
          onPress: openApplyConfirm,
          loading: applying,
          disabled: applying || !availabilityReady || !hasAvailability,
        }}
        assignedTaker={
          requestStatus === "accepted" && assignedTaker
            ? {
                name:
                  resolveDisplayName(assignedTaker) ||
                  t("messages.takerApplicant", "Taker"),
                avatar: assignedTaker.avatar_url ?? null,
                rating: assignedTaker.rating_avg ?? 0,
                handshakes: assignedTaker.care_given_count ?? 0,
                paws: assignedTaker.care_received_count ?? 0,
              }
            : null
        }
      />

      <ApplyConfirmModal
        visible={applyConfirmOpen}
        applying={applying}
        colors={colors}
        t={(key, fallback) => t(key, fallback as string)}
        onClose={() => setApplyConfirmOpen(false)}
        onConfirm={onApplyConfirmed}
      />

      {/* Owner action dropdown */}
      <Modal
        transparent
        visible={menuOpen}
        animationType="fade"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable
          style={styles.menuOverlay}
          onPress={() => setMenuOpen(false)}
        >
          {menuBtnLayout && (
            <View
              style={[
                styles.menuCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                  top: menuBtnLayout.y + menuBtnLayout.height + 6,
                  right: 16,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  if (!canEditRequest) {
                    showToast({
                      variant: "info",
                      message: t(
                        "requestDetails.editRequestLocked",
                        "You can edit only when no caregiver is assigned and no contract exists.",
                      ),
                      durationMs: 3600,
                    });
                    return;
                  }
                  router.push({
                    pathname: "/(private)/post-requests",
                    params: {
                      petId: String(reqRow?.pet_id ?? ""),
                      editRequestId: String(id ?? ""),
                    },
                  } as any);
                }}
              >
                <Pencil
                  size={16}
                  color={canEditRequest ? colors.onSurface : colors.outline}
                />
                <AppText
                  variant="body"
                  color={canEditRequest ? colors.onSurface : colors.outline}
                >
                  {t("post.request.preview.edit", "Edit")}
                </AppText>
              </TouchableOpacity>
              <View
                style={[
                  styles.menuDivider,
                  { backgroundColor: colors.outlineVariant },
                ]}
              />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setMenuOpen(false);
                  setDeleteConfirmOpen(true);
                }}
              >
                <Trash2 size={16} color={colors.error} />
                <AppText variant="body" color={colors.error}>
                  {t("requestDetails.deleteRequest")}
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>

      {/* Delete confirmation */}
      <FeedbackModal
        visible={deleteConfirmOpen}
        title={t("requestDetails.deleteRequestConfirmTitle")}
        description={t("requestDetails.deleteRequestConfirmMessage")}
        primaryLabel={t("requestDetails.deleteRequest")}
        destructive
        primaryLoading={deleting}
        onPrimary={() => void handleDeleteRequest()}
        secondaryLabel={t("common.cancel", "Cancel")}
        onSecondary={() => setDeleteConfirmOpen(false)}
        onRequestClose={() => setDeleteConfirmOpen(false)}
      />

      <FeedbackModal
        visible={reportConfirmOpen}
        title={t("requestDetails.reportRequestTitle", "Report request")}
        description={t(
          "requestDetails.reportRequestDescription",
          "If this request includes inappropriate content, tell us what happened.",
        )}
        body={
          <View>
            <Input
              label={t("messages.reportReasonLabel", "Reason")}
              placeholder={t(
                "messages.reportReasonPlaceholder",
                "Describe what happened",
              )}
              value={reportReason}
              onChangeText={setReportReason}
              maxLength={250}
              multiline
              inputStyle={{ minHeight: 88, textAlignVertical: "top" }}
              containerStyle={{ marginBottom: 0 }}
            />
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={{ textAlign: "right", marginTop: 6 }}
            >
              {`${reportReason.length}/250`}
            </AppText>
          </View>
        }
        primaryLabel={t("requestDetails.reportRequestPrimary", "Report request")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={reporting}
        onPrimary={() => {
          void handleReportRequest();
        }}
        onSecondary={() => {
          if (reporting) return;
          setReportConfirmOpen(false);
        }}
        onRequestClose={() => {
          if (reporting) return;
          setReportConfirmOpen(false);
        }}
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
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  menuOverlay: {
    flex: 1,
  },
  menuCard: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 12,
  },
});
