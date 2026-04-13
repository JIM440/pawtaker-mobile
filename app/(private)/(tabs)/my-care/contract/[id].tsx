import { Colors } from "@/src/constants/colors";
import { MyCareContractActionsMenu } from "@/src/features/my-care/components/MyCareContractActionsMenu";
import { PetDetailPill } from "@/src/features/pets/components/PetDetailPill";
import { blockUser } from "@/src/lib/blocks/user-blocks";
import {
  formatRequestDateRange,
  formatRequestTimeRange,
} from "@/src/lib/datetime/request-date-time-format";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import {
  formatCarePointsPts,
  normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import {
  errorMessageFromUnknown,
  isMissingColumnError,
} from "@/src/lib/supabase/errors";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { TakerCard } from "@/src/shared/components/cards";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { PetDetailHeaderSection } from "@/src/shared/components/pets/PetDetailHeaderSection";
import { PetPhotoCarousel } from "@/src/shared/components/pets/PetPhotoCarousel";
import { PetDetailScreenSkeleton } from "@/src/shared/components/skeletons";
import { ErrorState, ResourceMissingState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { type CareTypeKey } from "@/src/shared/components/ui/CareTypeSelector";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { Input } from "@/src/shared/components/ui/Input";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Ellipsis,
  Handshake,
  PawPrint,
  Star
} from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function ContractDetailScreen() {
  const {
    id: routeId,
    accepted: acceptedParam,
    mode: modeParam,
    petName: petNameParam,
    breed: breedParam,
    date: dateParam,
    time: timeParam,
    price: priceParam,
  } = useLocalSearchParams<{
    id: string;
    accepted?: string;
    mode?: string;
    petName?: string;
    breed?: string;
    date?: string;
    time?: string;
    price?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showToast = useToastStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractRow, setContractRow] = useState<any | null>(null);
  const [requestRow, setRequestRow] = useState<any | null>(null);
  const [petRow, setPetRow] = useState<any | null>(null);
  const [ownerRow, setOwnerRow] = useState<any | null>(null);
  const [takerRow, setTakerRow] = useState<any | null>(null);
  const [proposalCareTypes, setProposalCareTypes] = useState<string[]>([]);
  const [takerAlreadyCaring, setTakerAlreadyCaring] = useState(false);
  const [ownerRatingAvg, setOwnerRatingAvg] = useState(0);
  const [takerRatingAvg, setTakerRatingAvg] = useState(0);

  const images = useMemo(() => petGalleryUrls(petRow ?? {}), [petRow]);

  const paramAccepted = acceptedParam === "1" || acceptedParam === "true";

  const load = useCallback(async () => {
    if (!routeId) {
      setLoading(false);
      setError("Missing id.");
      return;
    }
    if (!user?.id) {
      setLoading(false);
      setError(t("myCare.contract.loadFailed"));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let contract: any | null = null;

      const { data: byContractId, error: cErr } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", routeId)
        .maybeSingle();
      if (cErr) throw cErr;
      contract = byContractId ?? null;

      if (!contract) {
        const { data: byRequest, error: rErr } = await supabase
          .from("contracts")
          .select("*")
          .eq("request_id", routeId)
          .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (rErr) throw rErr;
        contract = byRequest?.[0] ?? null;
      }

      let req: any | null = null;
      if (contract?.request_id) {
        const { data: reqData, error: reqErr } = await supabase
          .from("care_requests")
          .select("*")
          .eq("id", contract.request_id)
          .maybeSingle();
        if (reqErr) throw reqErr;
        req = reqData ?? null;
      } else {
        const { data: reqData, error: reqErr } = await supabase
          .from("care_requests")
          .select("*")
          .eq("id", routeId)
          .maybeSingle();
        if (reqErr) throw reqErr;
        req = reqData ?? null;
      }

      if (!req) {
        setContractRow(contract);
        setRequestRow(null);
        setPetRow(null);
        setOwnerRow(null);
        setTakerRow(null);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const { data: pet, error: petErr } = await supabase
        .from("pets")
        .select("*")
        .eq("id", req.pet_id)
        .maybeSingle();
      if (petErr) throw petErr;

      if (
        contract &&
        contract.owner_id !== user.id &&
        contract.taker_id !== user.id
      ) {
        setError(t("myCare.contract.accessDenied"));
        setContractRow(null);
        setRequestRow(null);
        setPetRow(null);
        setOwnerRow(null);
        setTakerRow(null);
        return;
      }

      if (
        !contract &&
        req.owner_id !== user.id &&
        req.taker_id &&
        req.taker_id !== user.id
      ) {
        setError(t("myCare.contract.accessDenied"));
        setContractRow(null);
        setRequestRow(null);
        setPetRow(null);
        setOwnerRow(null);
        setTakerRow(null);
        return;
      }

      const ownerId = (req.owner_id ?? contract?.owner_id) as string | null;
      const takerId = (req.taker_id ?? contract?.taker_id) as string | null;

      const [{ data: owner }, { data: taker }] = await Promise.all([
        ownerId
          ? supabase
            .from("users")
            .select(
              "id,full_name,avatar_url,city,care_given_count,care_received_count",
            )
            .eq("id", ownerId)
            .maybeSingle()
          : Promise.resolve({ data: null } as any),
        takerId
          ? supabase
            .from("users")
            .select(
              "id,full_name,avatar_url,city,care_given_count,care_received_count",
            )
            .eq("id", takerId)
            .maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);

      let oRating = 0;
      let tRating = 0;

      const [oReviews, tReviews] = await Promise.all([
        ownerId
          ? supabase.from("reviews").select("rating").eq("reviewee_id", ownerId)
          : Promise.resolve({ data: null }),
        takerId
          ? supabase.from("reviews").select("rating").eq("reviewee_id", takerId)
          : Promise.resolve({ data: null }),
      ]);

      if (oReviews?.data?.length) {
        const nums = oReviews.data.map((r: any) => r.rating).filter(Boolean);
        oRating = nums.length ? nums.reduce((a: number, b: number) => a + b, 0) / nums.length : 0;
      }
      if (tReviews?.data?.length) {
        const nums = tReviews.data.map((r: any) => r.rating).filter(Boolean);
        tRating = nums.length ? nums.reduce((a: number, b: number) => a + b, 0) / nums.length : 0;
      }

      setContractRow(contract);
      setRequestRow(req);
      setPetRow(pet ?? null);
      setOwnerRow(owner ?? null);
      setTakerRow(taker ?? null);
      setOwnerRatingAvg(oRating);
      setTakerRatingAvg(tRating);
      setError(null);

      if (takerId) {
        const { data: threads } = await supabase
          .from("threads")
          .select("id")
          .eq("request_id", req.id)
          .limit(10);
        const threadIds = (threads ?? []).map((th: any) => th.id);
        if (threadIds.length) {
          const { data: proposals } = await supabase
            .from("messages")
            .select("metadata")
            .eq("type", "proposal")
            .eq("sender_id", takerId)
            .in("thread_id", threadIds)
            .order("created_at", { ascending: false })
            .limit(1);
          const meta = (proposals?.[0]?.metadata as any) ?? null;
          if (meta?.careTypes && Array.isArray(meta.careTypes)) {
            setProposalCareTypes(meta.careTypes as string[]);
          } else {
            setProposalCareTypes([normalizeCareTypeForPoints(req.care_type as string)]);
          }
        } else {
          setProposalCareTypes([normalizeCareTypeForPoints(req.care_type as string)]);
        }

        const currentContractId = contract?.id ?? null;
        const { data: otherActive } = await supabase
          .from("contracts")
          .select("id")
          .eq("taker_id", takerId)
          .in("status", ["signed", "active"])
          .limit(2);
        const otherActiveFiltered = currentContractId
          ? (otherActive ?? []).filter((c: any) => c.id !== currentContractId)
          : (otherActive ?? []);
        setTakerAlreadyCaring(otherActiveFiltered.length > 0);
      } else {
        setProposalCareTypes([normalizeCareTypeForPoints(req.care_type as string)]);
        setTakerAlreadyCaring(false);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("myCare.contract.loadFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [routeId, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const careTypeKey: CareTypeKey = useMemo(
    () =>
      normalizeCareTypeForPoints(requestRow?.care_type as string | undefined),
    [requestRow?.care_type],
  );

  const careTypeLabel = t(`feed.careTypes.${careTypeKey}`);

  const petName = petRow?.name ?? petNameParam ?? "";
  const breed = petRow?.breed ?? breedParam ?? "";
  const dateRange = requestRow?.start_date
    ? formatRequestDateRange(requestRow.start_date, requestRow.end_date)
    : (dateParam ?? "");
  const time = timeParam && timeParam.trim() ? timeParam : careTypeLabel;
  const price =
    requestRow?.start_date && requestRow?.end_date
      ? formatCarePointsPts(
        requestRow.care_type,
        requestRow.start_date as string,
        requestRow.end_date as string,
      )
      : (priceParam ?? "");

  const mode =
    modeParam === "seeking" || modeParam === "applying"
      ? modeParam
      : user?.id && requestRow?.owner_id === user.id
        ? "seeking"
        : "applying";

  const isOwnerView = mode === "seeking";
  const ownerName = resolveDisplayName(ownerRow) || t("requestDetails.owner", "Owner");
  const takerName = resolveDisplayName(takerRow) || t("common.user");
  const petType = typeof petRow?.species === "string" ? petRow.species : "";
  const petBio =
    typeof petRow?.notes === "string" && petRow.notes.trim().length > 0
      ? petRow.notes.trim()
      : t("post.request.noDescription", "No description yet.");
  const formattedDateRange = useMemo(() => {
    if (!requestRow?.start_date) return dateRange || null;
    return formatRequestDateRange(
      requestRow.start_date,
      requestRow.end_date ?? requestRow.start_date,
    );
  }, [requestRow, dateRange]);

  const isExpired = requestRow?.end_date && new Date(requestRow.end_date) < new Date();


  const formattedTime =
    requestRow?.start_time && requestRow?.end_time
      ? formatRequestTimeRange(requestRow.start_time, requestRow.end_time)
      : (time || null);
  const ownerLocation = ownerRow?.city?.trim() || t("profile.noLocation");
  const takerLocation = takerRow?.city?.trim() || t("profile.noLocation");
  const requestContextLabel = petName
    ? t("messages.applyingForPet", { petName })
    : t("myCare.contract.title", "Contract");
  const petAttributes = {
    yardType: petRow?.yard_type ?? t("common.empty", "-"),
    ageRange: petRow?.age_range ?? t("common.empty", "-"),
    energyLevel: petRow?.energy_level ?? t("common.empty", "-"),
  };

  const resolvedContractId = contractRow?.id as string | undefined;
  const contractStatus = contractRow?.status as string | undefined;
  const agreementLive =
    contractStatus === "draft" ||
    contractStatus === "signed" ||
    contractStatus === "active";
  const agreementEnded = contractStatus === "completed";

  /** Deep-link param lets the UI unlock immediately after accepting an offer (before sign rows sync). */
  const acceptedUI = (paramAccepted && !agreementEnded) || agreementLive;

  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = useState(false);
  const [showReportConfirm, setShowReportConfirm] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [busy, setBusy] = useState(false);

  const headerMenuBtnRef = React.useRef<any>(null);
  const [headerMenuAnchor, setHeaderMenuAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const handleHeaderMenuPress = () => {
    if (headerMenuBtnRef.current) {
      headerMenuBtnRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setHeaderMenuAnchor({ x: pageX, y: pageY, width, height });
        setActionsOpen(true);
      });
    } else {
      setActionsOpen(true);
    }
  };

  const canTerminate = acceptedUI && !agreementEnded;

  const otherPartyId = useMemo(() => {
    if (!user?.id) return null;
    const ownerId =
      (contractRow?.owner_id as string | undefined) ??
      (requestRow?.owner_id as string | undefined) ??
      null;
    const takerId =
      (contractRow?.taker_id as string | undefined) ??
      (requestRow?.taker_id as string | undefined) ??
      null;

    if (ownerId && ownerId !== user.id) return ownerId;
    if (takerId && takerId !== user.id) return takerId;
    return null;
  }, [contractRow?.owner_id, contractRow?.taker_id, requestRow?.owner_id, requestRow?.taker_id, user?.id]);

  // Realtime: keep contractRow in sync with DB changes (e.g. other party triggers terminate)
  useEffect(() => {
    if (!resolvedContractId) return;
    const channel = supabase
      .channel(`contract-${resolvedContractId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${resolvedContractId}`,
        },
        (payload) => {
          setContractRow((prev: any) =>
            prev ? { ...prev, ...payload.new } : payload.new,
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [resolvedContractId]);

  /** One-tap termination: completes the agreement immediately (modal stays open with loading until done). */
  const terminateAgreement = async () => {
    if (!resolvedContractId || !user?.id) return;
    setBusy(true);
    try {
      const nowIso = new Date().toISOString();
      let { error } = await supabase
        .from("contracts")
        .update({
          status: "completed",
          terminate_requested_by: user.id,
          terminate_requested_at: nowIso,
        })
        .eq("id", resolvedContractId);
      if (error && isMissingColumnError(error)) {
        const fallback = await supabase
          .from("contracts")
          .update({ status: "completed" })
          .eq("id", resolvedContractId);
        error = fallback.error;
      }
      if (error) throw error;

      if (contractRow?.request_id) {
        await supabase
          .from("care_requests")
          .update({ status: "completed" })
          .eq("id", contractRow.request_id);
      }

      setContractRow((c: any) =>
        c
          ? {
              ...c,
              status: "completed",
              terminate_requested_by: user.id,
              terminate_requested_at: nowIso,
            }
          : c,
      );
      if (user?.id) {
        void useAuthStore.getState().fetchProfile(user.id);
      }
      showToast({
        variant: "info",
        message: t("myCare.contract.terminatedToast"),
        durationMs: 3000,
      });
      setShowTerminateConfirm(false);
    } catch (err) {
      console.error("[ContractDetail] Terminate Error:", err);
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t("myCare.contract.terminationRequestFailed"),
        ),
        durationMs: 5000,
      });
    } finally {
      setBusy(false);
    }
  };

  const submitReport = () => {
    void (async () => {
      if (!user?.id || !requestRow) return;
      const details = reportReason.trim();
      if (!details) {
        showToast({
          variant: "error",
          message: t("messages.reportReasonRequired", "Please enter a reason."),
          durationMs: 2800,
        });
        return;
      }
      const reportedUserId =
        user.id === requestRow.owner_id
          ? requestRow.taker_id
          : requestRow.owner_id;
      if (!reportedUserId) return;
      setBusy(true);
      try {
        const { error } = await supabase.from("reports").insert({
          reporter_id: user.id,
          reported_user_id: reportedUserId,
          reason: "agreement_report",
          details,
        });
        if (error) throw error;
        setShowReportConfirm(false);
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
        setBusy(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0, paddingHorizontal: 0 }}>
        <BackHeader
          title={t("myCare.contract.title")}
          onBack={() => router.back()}
        />
        <PetDetailScreenSkeleton />
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0, paddingHorizontal: 0 }}>
        <BackHeader
          title={t("myCare.contract.title")}
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

  if (error || !requestRow) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0, paddingHorizontal: 0 }}>
        <BackHeader
          title={t("myCare.contract.title")}
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
        title={t("myCare.contract.title")}
        onBack={() => router.back()}
        rightSlot={
          acceptedUI || agreementEnded ? (
            <TouchableOpacity
              ref={headerMenuBtnRef}
              onPress={handleHeaderMenuPress}
              hitSlop={12}
              style={[
                styles.menuBtnTop,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <Ellipsis size={24} color={colors.onSurface} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !canTerminate && { paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <PetPhotoCarousel
          urls={images}
          height={216}
          horizontalInset={16}
          imageBorderRadius={16}
          showCounterBadge={false}
          dotsVariant="onImage"
          showSegmentProgressBar={false}
          style={{ marginBottom: 8 }}
        />

        <PetDetailHeaderSection
          colors={colors}
          petName={petName}
          breed={breed}
          petType={petType}
          dateRange={formattedDateRange ?? undefined}
          time={formattedTime ?? undefined}
          careType={careTypeLabel}
          location={ownerLocation}
          description={petBio}
          showFavorite={false}
          // Hide seeking badge if expired
          isSeeking={!isExpired && requestRow?.status === "open"}
        />

        <View style={styles.sectionPad}>
          {price ? (
            <View style={styles.headerPointsRow}>
              <AppText variant="body" color={colors.onSurfaceVariant}>
                {t("myCare.contract.pointsLabel")}
              </AppText>
              <AppText variant="title" color={colors.primary} style={{ fontWeight: "700" }}>
                {price}
              </AppText>
            </View>
          ) : null}

          {/* Owner/User Card */}
          <AppText variant="label" color={colors.onSurfaceVariant} style={styles.roleLabel}>
            {t("myCare.contract.petOwner", "Pet Owner")}
          </AppText>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              if (!ownerRow?.id) return;
              if (ownerRow.id === user?.id) {
                router.push("/(private)/(tabs)/profile" as any);
                return;
              }
              router.push({
                pathname: "/(private)/(tabs)/(home)/users/[id]" as any,
                params: { id: ownerRow.id },
              });
            }}
            style={[
              styles.userCard,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <View style={styles.userCardLeft}>
              <UserAvatar
                uri={ownerRow?.avatar_url}
                name={ownerName}
                size={32}
                style={styles.userAvatar}
              />
              <View style={styles.userInfo}>
                <AppText variant="body" color={colors.onSurfaceVariant} style={styles.userName}>
                  {ownerName}
                </AppText>
                <View style={styles.userStats}>
                  <View style={styles.userStatItem}>
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {ownerRatingAvg.toFixed(1)}
                    </AppText>
                    <Star size={12} color={colors.tertiary} fill={colors.tertiary} />
                  </View>
                  <View style={[styles.userStatItem, { backgroundColor: colors.surfaceContainer }]}>
                    <Handshake size={12} color={colors.tertiary} />
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {ownerRow?.care_given_count ?? 0}
                    </AppText>
                  </View>
                  <View style={[styles.userStatItem, { backgroundColor: colors.surfaceContainer }]}>
                    <PawPrint size={12} color={colors.tertiary} />
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {ownerRow?.care_received_count ?? 0}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
            <AppText variant="label" color={colors.primary}>
              {t("requestDetails.viewProfile")}
            </AppText>
          </TouchableOpacity>

          {/* Taker Card - Home Page style */}
          {takerRow ? (
            <View style={{ marginTop: 24, marginBottom: 12 }}>
              <AppText variant="label" color={colors.onSurfaceVariant} style={styles.roleLabel}>
                {t("myCare.contract.taker", "Taker")}
              </AppText>
              <TakerCard
                taker={{
                  id: takerRow.id,
                  name: takerName,
                  avatar: takerRow.avatar_url,
                  rating: takerRatingAvg,
                  species: petType,
                  tags: proposalCareTypes.map(tag => t(`feed.careTypes.${tag}`)),
                  location: takerLocation,
                  distance: "-", // Distance not applicable here
                  status: takerAlreadyCaring ? "unavailable" : "available",
                  completedTasks: takerRow.care_given_count ?? 0,
                  petsHandled: takerRow.care_received_count ?? 0,
                }}
                onPress={() => {
                  if (takerRow.id === user?.id) {
                    router.push("/(private)/(tabs)/profile" as any);
                    return;
                  }
                  router.push({
                pathname: "/(private)/(tabs)/(home)/users/[id]" as any,
                    params: { id: takerRow.id },
                  });
                }}
                showMenu={false}
              />
            </View>
          ) : null}

          {/* Details Section - Hide if expired */}
          {!isExpired && (
            <>
              <AppText variant="title" color={colors.onSurface} style={styles.sectionTitle}>
                {t("requestDetails.details")}
              </AppText>
              <View style={styles.detailsCard}>
                <View style={styles.detailPills}>
                  <PetDetailPill
                    label={t("requestDetails.yardType")}
                    value={petAttributes.yardType}
                    colors={colors}
                    styles={styles}
                  />
                  <PetDetailPill
                    label={t("requestDetails.age")}
                    value={petAttributes.ageRange}
                    colors={colors}
                    styles={styles}
                  />
                  <PetDetailPill
                    label={t("requestDetails.energyLevel")}
                    value={petAttributes.energyLevel}
                    colors={colors}
                    styles={styles}
                  />
                </View>
              </View>

              {/* Special Needs Section */}
              <AppText variant="label" color={colors.onSurfaceVariant} style={styles.specialLabel}>
                *{t("requestDetails.specialNeeds")}
              </AppText>
              <AppText variant="body" color={colors.onSurfaceVariant} style={styles.specialText}>
                {petRow?.special_needs_description || t("pet.detail.none", "None")}
              </AppText>
            </>
          )}

          {/* Status Message */}
          <View style={[styles.statusBox, { backgroundColor: colors.surfaceContainerLow }]}>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              {agreementEnded
                ? t("myCare.contract.agreementEnded")
                : isExpired
                  ? t("myCare.contract.agreementActive", "Agreement is active.") // Keep it active if it's just expired but not completed yet
                  : acceptedUI
                    ? t("myCare.contract.agreementActive")
                    : t("myCare.contract.acceptHint")}
            </AppText>
          </View>

        </View>
      </ScrollView>

      <FeedbackModal
        visible={showTerminateConfirm}
        title={t("myCare.contract.terminateConfirmTitle")}
        description={t(
          "myCare.contract.terminateConfirmLead",
          "This ends the contract immediately.",
        )}
        body={
          <View style={styles.terminateRulesBody}>
            <AppText variant="label" style={styles.terminateRulesHeading}>
              {t("myCare.contract.terminateRulesTitle", "How points are handled")}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t(
                "myCare.contract.terminateRuleBeforeStart",
                "Before start date: if owner ends the contract, taker gets 0 points.",
              )}
            </AppText>
            <AppText variant="caption" style={styles.terminateRulesSubheading}>
              {t("myCare.contract.terminateRuleAfterStartTitle", "After start date")}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t(
                "myCare.contract.terminateRuleAfterStartOwner",
                "Owner ends contract: taker gets full points immediately.",
              )}
            </AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t(
                "myCare.contract.terminateRuleAfterStartTaker",
                "Taker ends contract: taker gets 0 points (owner keeps/gets points back).",
              )}
            </AppText>
          </View>
        }
        primaryLabel={t("myCare.contract.terminateConfirm", "Terminate")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={busy}
        onPrimary={() => void terminateAgreement()}
        onSecondary={() => {
          if (busy) return;
          setShowTerminateConfirm(false);
        }}
        onRequestClose={() => {
          if (busy) return;
          setShowTerminateConfirm(false);
        }}
      />

      <FeedbackModal
        visible={showBlockConfirm}
        title={t("messages.blockConfirmTitle")}
        description={t("messages.blockConfirmDescription")}
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
        primaryLabel={t("messages.block")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={busy}
        onPrimary={() => {
          void (async () => {
            if (!user?.id || !otherPartyId || busy) return;

            setBusy(true);
            try {
              await blockUser(user.id, otherPartyId);
              setShowBlockConfirm(false);
              setBlockReason("");
              showToast({
                variant: "info",
                message: t("messages.blockedToast"),
                durationMs: 3000,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message: errorMessageFromUnknown(
                  err,
                  t("messages.blockUpdateFailed"),
                ),
                durationMs: 3200,
              });
            } finally {
              setBusy(false);
            }
          })();
        }}
        onSecondary={() => {
          if (busy) return;
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
        onRequestClose={() => {
          if (busy) return;
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
      />

      <FeedbackModal
        visible={showReportConfirm}
        title={t("messages.reportUser", "Report user")}
        description={t(
          "messages.reportConfirmDescription",
          "Are you sure? Please provide a reason.",
        )}
        body={
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
        }
        primaryLabel={t("messages.reportUser", "Report user")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={busy}
        onPrimary={submitReport}
        onSecondary={() => {
          setShowReportConfirm(false);
          setReportReason("");
        }}
        onRequestClose={() => {
          setShowReportConfirm(false);
          setReportReason("");
        }}
      />

      <MyCareContractActionsMenu
        visible={actionsOpen}
        colors={colors}
        menuAnchor={headerMenuAnchor}
        t={(key: string, fallback?: string) => t(key, fallback as string)}
        onClose={() => setActionsOpen(false)}
        onPrimaryAction={() => {
          setActionsOpen(false);
          setShowTerminateConfirm(true);
        }}
        primaryActionLabel={t("myCare.contract.terminate")}
        primaryActionDisabled={!canTerminate || busy}
        onReport={() => {
          setActionsOpen(false);
          setShowReportConfirm(true);
        }}
        onBlock={() => {
          setActionsOpen(false);
          setShowBlockConfirm(true);
        }}
        onRateAndReview={() => {
          setActionsOpen(false);
          const rid = resolvedContractId;
          const revieweeId =
            user?.id === contractRow?.owner_id
              ? contractRow?.taker_id
              : contractRow?.owner_id;
          if (!rid) {
            showToast({
              variant: "error",
              message: t(
                "myCare.review.noContract",
                "No contract found for this care yet.",
              ),
              durationMs: 3200,
            });
            return;
          }
          router.push({
            pathname: "/(private)/(tabs)/my-care/review/[id]" as any,
            params: {
              id: rid,
              ...(revieweeId ? { revieweeId } : {}),
            },
          });
        }}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  sectionPad: { paddingHorizontal: 16, paddingBottom: 24 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderRadius: 999,
    marginBottom: 12,
  },
  roleLabel: {
    marginBottom: 8,
    marginTop: 4,
    fontWeight: "700",
    textTransform: "uppercase",
    fontSize: 10,
    letterSpacing: 0.5,
  },
  headerPointsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  userCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 16,
  },
  userStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  detailsCard: {
    marginBottom: 20,
  },
  detailPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailPillGroup: {
    gap: 8,
    flex: 1,
    minWidth: "30%",
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  pillValue: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  specialLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  specialText: {
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 28,
  },
  statusBox: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  menuBtnTop: {
    padding: 8,
    borderRadius: 20,
  },
  terminateRulesBody: {
    gap: 6,
  },
  terminateRulesHeading: {
    fontWeight: "700",
  },
  terminateRulesSubheading: {
    fontWeight: "600",
    marginTop: 2,
  },
});
