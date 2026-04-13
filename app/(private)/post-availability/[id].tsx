import { Colors } from "@/src/constants/colors";
import { MyCareContractActionsMenu } from "@/src/features/my-care/components/MyCareContractActionsMenu";
import {
  blockUser,
  getBlockDirection,
} from "@/src/lib/blocks/user-blocks";
import { acceptCareRequest } from "@/src/lib/contracts/accept-care-request";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { createInAppNotification } from "@/src/lib/notifications/in-app";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { ViewOfferDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { DataState, ResourceMissingState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { Input } from "@/src/shared/components/ui/Input";
import { RatingSummary } from "@/src/shared/components/ui/RatingSummary";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  Ellipsis,
  MapPin,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

export default function ViewOfferScreen() {
  const { id: requestId, accepted: acceptedParam } = useLocalSearchParams<{
    id: string;
    accepted?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [reqRow, setReqRow] = useState<TablesRow<"care_requests"> | null>(null);
  const [petRow, setPetRow] = useState<any | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [takerId, setTakerId] = useState<string | null>(null);
  const [takerUser, setTakerUser] = useState<any | null>(null);
  const [takerProfile, setTakerProfile] = useState<any | null>(null);
  const [takerReviews, setTakerReviews] = useState<any[]>([]);
  const [contractRow, setContractRow] = useState<any | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [takerAlreadyCaring, setTakerAlreadyCaring] = useState(false);

  const [acceptedConfirmOpen, setAcceptedConfirmOpen] = React.useState(false);
  const [accepted, setAccepted] = React.useState(
    () => acceptedParam === "1" || acceptedParam === "true",
  );
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = React.useState(false);
  const [showReactivateConfirm, setShowReactivateConfirm] = React.useState(false);
  const [showAcceptTerminationConfirm, setShowAcceptTerminationConfirm] =
    React.useState(false);
  const [showReportConfirm, setShowReportConfirm] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("");
  const [busyAction, setBusyAction] = React.useState(false);
  const [acceptingOffer, setAcceptingOffer] = React.useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const load = useCallback(async () => {
    if (!requestId) {
      setLoading(false);
      setError("Missing request id.");
      return;
    }
    if (!user?.id) {
      setLoading(false);
      setError(
        t(
          "myCare.contract.offerDetailsLoadFailed",
          "We couldn't load this offer.",
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
        .eq("id", requestId)
        .maybeSingle();
      if (reqError) throw reqError;

      const request = requestRaw as TablesRow<"care_requests"> | null;
      if (!request) {
        setReqRow(null);
        setPetRow(null);
        setOwnerId(null);
        setTakerId(null);
        setTakerUser(null);
        setTakerProfile(null);
        setTakerReviews([]);
        setContractId(null);
        setTakerAlreadyCaring(false);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const currentOwnerId = request.owner_id as string;
      setOwnerId(currentOwnerId);

      if (user.id !== currentOwnerId) {
        setReqRow(request);
        setPetRow(null);
        setTakerId(null);
        setTakerUser(null);
        setTakerProfile(null);
        setTakerReviews([]);
        setContractId(null);
        setTakerAlreadyCaring(false);
        setError(
          t("offer.wrongRecipient", "Only the pet owner can view this offer."),
        );
        return;
      }

      let applicantId = request.taker_id as string | null;

      if (!applicantId) {
        const { data: threads, error: threadsError } = await supabase
          .from("threads")
          .select("id,participant_ids,last_message_at,request_id")
          .eq("request_id", requestId)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(25);
        if (threadsError) throw threadsError;

        const peerFromParticipants = () => {
          for (const thread of threads ?? []) {
            const participants = (thread.participant_ids ?? []) as string[];
            if (!participants.includes(currentOwnerId)) continue;
            const peer =
              participants.find((participant) => participant !== currentOwnerId) ??
              null;
            if (peer) return peer;
          }
          return null;
        };

        const threadIds = (threads ?? []).map((thread) => thread.id).filter(Boolean);
        let proposalSenderId: string | null = null;

        if (threadIds.length > 0) {
          const { data: proposalSenders, error: proposalError } = await supabase
            .from("messages")
            .select("sender_id,created_at")
            .eq("type", "proposal")
            .in("thread_id", threadIds)
            .neq("sender_id", currentOwnerId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (proposalError) throw proposalError;
          proposalSenderId = proposalSenders?.[0]?.sender_id ?? null;
        }

        applicantId = proposalSenderId || peerFromParticipants();
      }

      const [
        { data: pet, error: petError },
        { data: takerUserData, error: takerUserError },
        { data: takerProfileData, error: takerProfileError },
        { data: reviewRows, error: reviewError },
      ] = await Promise.all([
        supabase.from("pets").select("*").eq("id", request.pet_id).maybeSingle(),
        applicantId
          ? supabase
              .from("users")
              .select(
                "id,full_name,avatar_url,city,bio,points_balance,care_given_count,care_received_count",
              )
              .eq("id", applicantId)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
        applicantId
          ? supabase
              .from("taker_profiles")
              .select("*")
              .eq("user_id", applicantId)
              .maybeSingle()
          : Promise.resolve({ data: null } as any),
        applicantId
          ? supabase
              .from("reviews")
              .select("rating")
              .eq("reviewee_id", applicantId)
          : Promise.resolve({ data: [] } as any),
      ]);
      if (petError) throw petError;
      if (takerUserError) throw takerUserError;
      if (takerProfileError) throw takerProfileError;
      if (reviewError) throw reviewError;

      setReqRow(request);
      setPetRow(pet ?? null);
      setTakerId(applicantId);
      setTakerUser(takerUserData ?? null);
      setTakerProfile(takerProfileData ?? null);
      setTakerReviews(reviewRows ?? []);

      if (!applicantId) {
        setContractId(null);
        setContractRow(null);
        setTakerAlreadyCaring(false);
        return;
      }

      const { data: existingContract, error: contractError } = await supabase
        .from("contracts")
        .select("*")
        .eq("request_id", requestId)
        .maybeSingle();
      if (contractError) throw contractError;

      const currentContractId =
        (existingContract?.id as string | undefined) ?? null;
      setContractRow(existingContract ?? null);
      setContractId(currentContractId);
      setAccepted(Boolean(existingContract?.id || request.status === "accepted"));

      const { data: otherActiveContracts, error: otherActiveError } =
        await supabase
          .from("contracts")
          .select("id")
          .eq("taker_id", applicantId)
          .in("status", ["signed", "active"])
          .limit(10);
      if (otherActiveError) throw otherActiveError;

      const otherActiveFiltered = currentContractId
        ? (otherActiveContracts ?? []).filter(
            (contract) => contract.id !== currentContractId,
          )
        : (otherActiveContracts ?? []);
      setTakerAlreadyCaring(otherActiveFiltered.length > 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "myCare.contract.offerDetailsLoadFailed",
              "We couldn't load this offer.",
            ),
      );
    } finally {
      setLoading(false);
    }
  }, [requestId, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  React.useEffect(() => {
    if (!contractId) return;
    const channel = supabase
      .channel(`owner-offer-contract-${contractId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "contracts",
          filter: `id=eq.${contractId}`,
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
  }, [contractId]);

  const availability = useMemo(() => {
    const raw = takerProfile?.availability_json;
    return raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, any>)
      : null;
  }, [takerProfile?.availability_json]);

  const mapServiceKeyToLabel = useCallback(
    (key: string) => {
      const normalizedKey =
        key === "playwalk"
          ? "playwalk"
          : key === "overnight"
            ? "overnight"
            : key === "vacation"
              ? "vacation"
              : key === "daytime"
                ? "daytime"
                : key;
      return t(`feed.careTypes.${normalizedKey}` as any);
    },
    [t],
  );

  const activePillValues = useMemo(() => {
    const days = Array.isArray(availability?.days)
      ? (availability.days as string[])
      : [];
    const start =
      typeof availability?.startTime === "string" ? availability.startTime : "";
    const end =
      typeof availability?.endTime === "string" ? availability.endTime : "";

    if (days.length > 0 && start && end) {
      return [`${days.join(", ")} | ${start}-${end}`];
    }

    return [t("common.empty", "—")];
  }, [
    availability?.days,
    availability?.endTime,
    availability?.startTime,
    t,
  ]);

  const careOfferingPillValues = useMemo(() => {
    const services = Array.isArray(availability?.services)
      ? (availability.services as string[])
      : [];
    if (!services.length) return [t("common.empty", "—")];
    return services.map(mapServiceKeyToLabel);
  }, [availability?.services, mapServiceKeyToLabel, t]);

  const petOwnerPillValue = useMemo(() => {
    const rawValue = availability?.petOwner;
    if (rawValue === "yes" || rawValue === true) {
      return [t("post.availability.ownerYes")];
    }
    if (rawValue === "no" || rawValue === false) {
      return [t("post.availability.ownerNo")];
    }
    return [t("common.empty", "—")];
  }, [availability?.petOwner, t]);

  const yardPillValue = useMemo(() => {
    const yardType =
      typeof availability?.yardType === "string" ? availability.yardType : null;
    if (yardType) return [yardType];

    const parsed = parsePetNotes(takerUser?.bio);
    return [parsed.yardType ?? t("common.empty", "—")];
  }, [availability?.yardType, t, takerUser?.bio]);

  const acceptedSpecies = useMemo(() => {
    const species = Array.isArray(takerProfile?.accepted_species)
      ? (takerProfile.accepted_species as string[])
      : [];
    if (!species.length) return [t("common.empty", "—")];
    return species;
  }, [t, takerProfile?.accepted_species]);

  const note = useMemo(() => {
    const availabilityNote =
      typeof availability?.note === "string" ? availability.note.trim() : "";
    if (availabilityNote) return availabilityNote;

    const bio = typeof takerUser?.bio === "string" ? takerUser.bio.trim() : "";
    return bio || t("profile.bio.empty", "No bio yet.");
  }, [availability?.note, t, takerUser?.bio]);

  const rating = useMemo(() => {
    if (!takerReviews.length) return 0;
    return (
      takerReviews.reduce((sum, review) => sum + (review.rating ?? 0), 0) /
      takerReviews.length
    );
  }, [takerReviews]);

  const offer = useMemo(() => {
    const name = resolveDisplayName(takerUser) || t("common.user", "User");
    return {
      petName: petRow?.name || t("pets.add.name", "Pet"),
      taker: {
        name,
        avatarUri: (takerUser?.avatar_url as string | null | undefined) ?? "",
        available: Boolean(availability?.available),
        rating,
        handshakes: takerUser?.care_given_count ?? 0,
        paws: takerUser?.care_received_count ?? 0,
        petTypes: acceptedSpecies,
        careOffering: careOfferingPillValues,
        location: takerUser?.city?.trim() || t("profile.noLocation"),
      },
      details: {
        yardType: yardPillValue,
        active: activePillValues,
        careTypes: careOfferingPillValues,
        petOwner: petOwnerPillValue,
      },
      note,
    };
  }, [
    acceptedSpecies,
    activePillValues,
    availability?.available,
    careOfferingPillValues,
    note,
    petOwnerPillValue,
    petRow?.name,
    rating,
    t,
    takerUser,
    yardPillValue,
  ]);

  const contractStatus = contractRow?.status as string | undefined;
  const agreementEnded = contractStatus === "completed";
  const terminationRequestedBy =
    contractRow?.terminate_requested_by as string | null | undefined;
  const isTerminationPending = Boolean(
    terminationRequestedBy && !agreementEnded,
  );
  const iTerminationRequester = terminationRequestedBy === user?.id;
  const canAcceptTermination = isTerminationPending && !iTerminationRequester;
  const terminationBannerTitle = iTerminationRequester
    ? t(
        "myCare.contract.terminationPendingRequesterTitle",
        "You've initiated termination.",
      )
    : t(
        "myCare.contract.terminationPendingRecipientTitle",
        "Termination was requested.",
      );
  const terminationBannerBody = iTerminationRequester
    ? t(
        "myCare.contract.terminationPendingRequesterBody",
        "The other party must also confirm before this agreement is fully terminated.",
      )
    : t(
        "myCare.contract.terminationPendingRecipientBody",
        "Confirm termination to fully end this agreement.",
      );

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <BackHeader title="" onBack={() => router.back()} />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ViewOfferDetailScreenSkeleton />
        </ScrollView>
      </View>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <BackHeader title="" onBack={() => router.back()} />
        <ResourceMissingState
          onBack={() => router.back()}
          onHome={() =>
            router.replace(
              "/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0],
            )
          }
        />
      </View>
    );
  }

  if (error || !reqRow) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <BackHeader title="" onBack={() => router.back()} />
        <DataState
          title={t(
            "myCare.contract.offerDetailsLoadFailed",
            "We couldn't load this offer.",
          )}
          message={error ?? undefined}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void load();
          }}
          mode="full"
        />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            hitSlop={12}
          >
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <AppText variant="body" style={styles.titleLabel}>
              {t("messages.applyingFor")}
            </AppText>
            <TouchableOpacity
              disabled={!petRow?.id}
              onPress={() => {
                if (!petRow?.id) return;
                router.push({
                  pathname: "/(private)/pets/[id]",
                  params: { id: petRow.id },
                });
              }}
            >
              <AppText
                variant="title"
                color={colors.primary}
                style={styles.titleLink}
              >
                {offer.petName}
              </AppText>
            </TouchableOpacity>
          </View>
          {accepted ? (
            <TouchableOpacity
              style={styles.headerMenuBtn}
              hitSlop={8}
              onPress={() => setActionsOpen(true)}
              activeOpacity={0.9}
            >
              <Ellipsis size={22} color={colors.onSurface} />
            </TouchableOpacity>
          ) : null}
        </View>

        {takerAlreadyCaring ? (
          <View
            style={[
              styles.noticeBanner,
              { backgroundColor: colors.surfaceContainerHighest },
            ]}
          >
            <AlertCircle size={20} color={colors.onSurfaceVariant} />
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.noticeText}
            >
              {t("myCare.contract.takerAlreadyCaring")}
            </AppText>
          </View>
        ) : null}

        {isTerminationPending ? (
          <View
            style={[
              styles.noticeBanner,
              { backgroundColor: colors.tertiaryContainer },
            ]}
          >
            <AlertCircle size={20} color={colors.error} />
            <View style={styles.noticeCopy}>
              <AppText
                variant="body"
                color={colors.error}
                style={styles.noticeTitle}
              >
                {terminationBannerTitle}
              </AppText>
              <AppText variant="caption" color={colors.error} style={styles.noticeText}>
                {terminationBannerBody}
              </AppText>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (!takerId) return;
            router.push({
                pathname: "/(private)/(tabs)/(home)/users/[id]",
              params: { id: takerId },
            });
          }}
          disabled={!takerId}
          style={[
            styles.takerCard,
            { backgroundColor: colors.surfaceContainerLowest },
          ]}
        >
          <UserAvatar
            uri={offer.taker.avatarUri}
            name={offer.taker.name}
            size={64}
            style={styles.takerAvatar}
          />
          <View style={styles.takerBody}>
            <View style={styles.takerTitleRow}>
              <AppText
                variant="title"
                numberOfLines={1}
                style={styles.takerName}
              >
                {offer.taker.name}
              </AppText>
              {offer.taker.available ? (
                <View
                  style={[
                    styles.availablePill,
                    { backgroundColor: colors.tertiaryContainer },
                  ]}
                >
                  <AppText variant="caption" color={colors.onTertiaryContainer}>
                    {t("myCare.available")}
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.statsRow}>
              <RatingSummary
                rating={offer.taker.rating}
                handshakes={offer.taker.handshakes}
                paws={offer.taker.paws}
              />
            </View>
            <AppText
              variant="caption"
              color={colors.onSurface}
              style={styles.inlineMeta}
            >
              {offer.taker.petTypes.join(" • ")}
            </AppText>
            <View style={styles.cardPillsRow}>
              <PillList values={offer.taker.careOffering} colors={colors} />
            </View>
            <View style={styles.locationPillWrap}>
              <View
                style={[
                  styles.locationPill,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <MapPin size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {offer.taker.location}
                </AppText>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <AppText variant="title" style={styles.sectionTitle}>
          {t("requestDetails.details")}
        </AppText>
        <View style={styles.detailGrid}>
          <DetailPillGroup
            label={t("requestDetails.yardType")}
            values={offer.details.yardType}
            colors={colors}
          />
          <DetailPillGroup
            label={t("myCare.contract.active")}
            values={offer.details.active}
            colors={colors}
          />
          <DetailPillGroup
            label={t("requestDetails.careTypes")}
            values={offer.details.careTypes}
            colors={colors}
          />
          <DetailPillGroup
            label={t("requestDetails.petOwner")}
            values={offer.details.petOwner}
            colors={colors}
          />
        </View>

        <AppText variant="title" style={styles.sectionTitle}>
          {t("post.availability.note")}
        </AppText>
        <AppText
          variant="body"
          color={colors.onSurfaceVariant}
          style={styles.note}
        >
          {offer.note}
        </AppText>

        {!accepted ? (
          <>
            <Button
              label={t("myCare.contract.acceptOffer")}
              onPress={() => setAcceptedConfirmOpen(true)}
              style={styles.acceptBtn}
            />
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.disclaimer}
            >
              {t("myCare.contract.acceptDisclaimer")}
            </AppText>
          </>
        ) : null}
        {accepted && isTerminationPending && iTerminationRequester ? (
          <Button
            label={t("myCare.contract.reactivate")}
            variant="outline"
            onPress={() => setShowReactivateConfirm(true)}
            style={styles.acceptBtn}
            disabled={busyAction}
            loading={busyAction}
          />
        ) : null}
        {accepted && canAcceptTermination ? (
          <Button
            label={t("myCare.contract.acceptTermination")}
            variant="danger"
            onPress={() => setShowAcceptTerminationConfirm(true)}
            style={styles.acceptBtn}
            disabled={busyAction}
            loading={busyAction}
          />
        ) : null}
      </ScrollView>

      <MyCareContractActionsMenu
        visible={actionsOpen}
        colors={colors}
        styles={styles}
        t={(key, fallback) => t(key, fallback as string)}
        onClose={() => setActionsOpen(false)}
        onPrimaryAction={() => {
          setActionsOpen(false);
          if (isTerminationPending && iTerminationRequester) {
            setShowReactivateConfirm(true);
            return;
          }
          setShowTerminateConfirm(true);
        }}
        primaryActionLabel={
          isTerminationPending && iTerminationRequester
            ? t("myCare.contract.reactivate")
            : t("myCare.contract.terminate")
        }
        primaryActionDisabled={agreementEnded || canAcceptTermination || busyAction}
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
          if (!contractId) {
            showToast({
              variant: "error",
              message: t(
                "myCare.review.noContract",
                "No completed contract found to review yet.",
              ),
              durationMs: 3200,
            });
            return;
          }
          router.push({
            pathname: "/(private)/(tabs)/my-care/review/[id]" as any,
            params: {
              id: contractId,
              ...(takerId ? { revieweeId: takerId } : {}),
            },
          });
        }}
      />

      <FeedbackModal
        visible={showTerminateConfirm}
        title={t(
          "myCare.contract.terminateConfirmTitle",
          "Terminate agreement?",
        )}
        description={t(
          "myCare.contract.terminateConfirmDescription",
          "This action cannot be undone.",
        )}
        primaryLabel={t("myCare.contract.terminate")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={busyAction}
        onPrimary={() => {
          void (async () => {
            if (!contractId) {
              setShowTerminateConfirm(false);
              return;
            }
            setBusyAction(true);
            try {
              const { error: contractError } = await supabase
                .from("contracts")
                .update({
                  terminate_requested_by: user?.id ?? null,
                  terminate_requested_at: new Date().toISOString(),
                })
                .eq("id", contractId);
              if (contractError) throw contractError;
              setContractRow((prev: any) =>
                prev
                  ? {
                      ...prev,
                      terminate_requested_by: user?.id ?? null,
                      terminate_requested_at: new Date().toISOString(),
                    }
                  : prev,
              );
              setShowTerminateConfirm(false);
              showToast({
                variant: "info",
                message: t(
                  "myCare.contract.terminationRequestedToast",
                  "Termination request sent.",
                ),
                durationMs: 3000,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : t(
                        "myCare.contract.terminationRequestFailed",
                        "We couldn't send the termination request right now.",
                      ),
                durationMs: 3200,
              });
            } finally {
              setBusyAction(false);
            }
          })();
        }}
        onSecondary={() => setShowTerminateConfirm(false)}
        onRequestClose={() => setShowTerminateConfirm(false)}
      />

      <FeedbackModal
        visible={showReactivateConfirm}
        title={t("myCare.contract.reactivateConfirmTitle")}
        description={t("myCare.contract.reactivateConfirmDescription")}
        primaryLabel={t("myCare.contract.reactivate")}
        secondaryLabel={t("common.cancel")}
        primaryLoading={busyAction}
        onPrimary={() => {
          void (async () => {
            if (!contractId) {
              setShowReactivateConfirm(false);
              return;
            }
            setBusyAction(true);
            try {
              const { error: contractError } = await supabase
                .from("contracts")
                .update({
                  terminate_requested_by: null,
                  terminate_requested_at: null,
                })
                .eq("id", contractId);
              if (contractError) throw contractError;
              setContractRow((prev: any) =>
                prev
                  ? {
                      ...prev,
                      terminate_requested_by: null,
                      terminate_requested_at: null,
                    }
                  : prev,
              );
              setShowReactivateConfirm(false);
              showToast({
                variant: "success",
                message: t(
                  "myCare.contract.terminationReactivatedToast",
                  "Agreement reactivated.",
                ),
                durationMs: 3000,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : t(
                        "myCare.contract.reactivateFailed",
                        "We couldn't reactivate this agreement right now.",
                      ),
                durationMs: 3200,
              });
            } finally {
              setBusyAction(false);
            }
          })();
        }}
        onSecondary={() => setShowReactivateConfirm(false)}
        onRequestClose={() => setShowReactivateConfirm(false)}
      />

      <FeedbackModal
        visible={showAcceptTerminationConfirm}
        title={t("myCare.contract.acceptTerminationConfirmTitle")}
        description={t("myCare.contract.acceptTerminationConfirmDescription")}
        primaryLabel={t("myCare.contract.acceptTermination")}
        secondaryLabel={t("common.cancel")}
        destructive
        primaryLoading={busyAction}
        onPrimary={() => {
          void (async () => {
            if (!contractId) {
              setShowAcceptTerminationConfirm(false);
              return;
            }
            setBusyAction(true);
            try {
              const { error: contractError } = await supabase
                .from("contracts")
                .update({ status: "completed" })
                .eq("id", contractId);
              if (contractError) throw contractError;

              if (requestId) {
                await supabase
                  .from("care_requests")
                  .update({ status: "terminated" })
                  .eq("id", requestId);
              }

              setContractRow((prev: any) =>
                prev ? { ...prev, status: "completed" } : prev,
              );
              setShowAcceptTerminationConfirm(false);
              showToast({
                variant: "info",
                message: t(
                  "myCare.contract.terminatedToast",
                  "Agreement ended.",
                ),
                durationMs: 3000,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message:
                  err instanceof Error
                    ? err.message
                    : t(
                        "myCare.contract.acceptTerminationFailed",
                        "We couldn't complete the termination right now.",
                      ),
                durationMs: 3200,
              });
            } finally {
              setBusyAction(false);
            }
          })();
        }}
        onSecondary={() => setShowAcceptTerminationConfirm(false)}
        onRequestClose={() => setShowAcceptTerminationConfirm(false)}
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
        primaryLoading={busyAction}
        onPrimary={() => {
          void (async () => {
            if (!user?.id || !takerId) return;

            const details = reportReason.trim();
            if (!details) {
              showToast({
                variant: "error",
                message: t(
                  "messages.reportReasonRequired",
                  "Please enter a reason.",
                ),
                durationMs: 2800,
              });
              return;
            }

            setBusyAction(true);
            try {
              const { error: reportError } = await supabase.from("reports").insert({
                reporter_id: user.id,
                reported_user_id: takerId,
                reason: "agreement_report",
                details,
              });
              if (reportError) throw reportError;

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
                message:
                  err instanceof Error
                    ? err.message
                    : t(
                        "messages.reportFailed",
                        "We couldn't submit this report right now.",
                      ),
                durationMs: 3200,
              });
            } finally {
              setBusyAction(false);
            }
          })();
        }}
        onSecondary={() => {
          setShowReportConfirm(false);
          setReportReason("");
        }}
        onRequestClose={() => {
          setShowReportConfirm(false);
          setReportReason("");
        }}
      />

      <FeedbackModal
        visible={showBlockConfirm}
        title={t("messages.blockConfirmTitle")}
        description={t("messages.blockConfirmDescription")}
        body={
          <Input
            label={t("messages.blockReasonLabel", "Reason (optional)")}
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
        primaryLoading={busyAction}
        onPrimary={() => {
          void (async () => {
            if (!user?.id || !takerId || busyAction) return;

            setBusyAction(true);
            try {
              await blockUser(user.id, takerId);
              setShowBlockConfirm(false);
              setBlockReason("");
              showToast({
                variant: "info",
                message: t("messages.blockedToast", "User blocked."),
                durationMs: 3000,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message: errorMessageFromUnknown(
                  err,
                  t(
                    "messages.blockFailed",
                    "We couldn't update this block right now.",
                  ),
                ),
                durationMs: 3200,
              });
            } finally {
              setBusyAction(false);
            }
          })();
        }}
        onSecondary={() => {
          if (busyAction) return;
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
        onRequestClose={() => {
          if (busyAction) return;
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
      />

      <FeedbackModal
        visible={acceptedConfirmOpen}
        title={t("myCare.contract.acceptConfirmTitle")}
        description={t("myCare.contract.acceptConfirmDescription")}
        primaryLabel={t("myCare.contract.acceptOffer")}
        secondaryLabel={t("common.cancel")}
        primaryLoading={acceptingOffer}
        onPrimary={() => {
          if (blockIfKycNotApproved()) return;

          void (async () => {
            setAcceptingOffer(true);
            try {
              if (!requestId || !ownerId || !takerId) {
                throw new Error(
                  t(
                    "myCare.contract.acceptOfferMissingData",
                    "We couldn't confirm this offer because some request details are missing.",
                  ),
                );
              }

              const blockDirection = await getBlockDirection(ownerId, takerId);
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

              if (!takerProfile?.user_id) {
                throw new Error(
                  t(
                    "offer.takerAvailabilityMissing",
                    "This caregiver needs to complete an availability profile before you can accept their offer.",
                  ),
                );
              }

              const acceptance = await acceptCareRequest({
                requestId,
                ownerId,
                takerId,
              });

              if (!acceptance.accepted) {
                throw new Error(
                  acceptance.selectedTakerId &&
                    acceptance.selectedTakerId !== takerId
                    ? t(
                        "requestDetails.requestAcceptedByAnother",
                        "Another caregiver has already accepted this request.",
                      )
                    : t(
                        "requestDetails.requestClosedForApplications",
                        "This request is no longer accepting applications.",
                      ),
                );
              }

              if (!acceptance.contractId) {
                throw new Error(
                  t(
                    "myCare.contract.acceptOfferFailed",
                    "We couldn't create the care contract for this offer.",
                  ),
                );
              }

              await createInAppNotification({
                userId: takerId,
                type: "offer_accepted",
                title: t("messages.agreementAccepted", "Agreement accepted"),
                body: t(
                  "myCare.contract.acceptedNotificationBody",
                  "Your care agreement was accepted.",
                ),
                data: {
                  contract_id: acceptance.contractId,
                  request_id: requestId,
                },
              });

              setContractId(acceptance.contractId);
              setAccepted(true);
              setAcceptedConfirmOpen(false);
              router.push({
                pathname: "/(private)/(tabs)/my-care/contract/[id]" as any,
                params: { id: acceptance.contractId, accepted: "1" } as any,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message: errorMessageFromUnknown(
                  err,
                  t(
                    "myCare.contract.acceptOfferFailed",
                    "We couldn't create the care contract for this offer.",
                  ),
                ),
                durationMs: 3200,
              });
            } finally {
              setAcceptingOffer(false);
            }
          })();
        }}
        onSecondary={() => {
          if (acceptingOffer) return;
          setAcceptedConfirmOpen(false);
        }}
        onRequestClose={() => {
          if (acceptingOffer) return;
          setAcceptedConfirmOpen(false);
        }}
      />
    </View>
  );
}

function PillList({
  values,
  colors,
}: {
  values: string[];
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <>
      {values.map((value, index) => (
        <View
          key={`${value}-${index}`}
          style={[
            styles.valuePill,
            { backgroundColor: colors.surfaceContainerHighest },
          ]}
        >
          <AppText variant="caption" color={colors.onSecondaryContainer}>
            {value}
          </AppText>
        </View>
      ))}
    </>
  );
}

function DetailPillGroup({
  label,
  values,
  colors,
}: {
  label: string;
  values: string[];
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={styles.detailGroup}>
      <AppText
        variant="caption"
        color={colors.onSurfaceVariant}
        style={styles.detailLabel}
      >
        {label}
      </AppText>
      <View style={styles.detailPillsRow}>
        <PillList values={values} colors={colors} />
      </View>
    </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  titleLabel: {
    fontSize: 16,
  },
  titleLink: {
    textDecorationLine: "underline",
    fontSize: 16,
  },
  noticeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeTitle: {
    fontWeight: "600",
  },
  takerCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  takerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  takerBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  takerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  takerName: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 180,
  },
  availablePill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  headerMenuBtn: {
    padding: 4,
    marginLeft: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineMeta: {
    fontSize: 12,
  },
  cardPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  locationPillWrap: {
    flexDirection: "row",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 24,
  },
  detailGroup: {
    gap: 4,
    minWidth: 80,
    maxWidth: "48%",
  },
  detailLabel: {
    paddingHorizontal: 6,
  },
  detailPillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  valuePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  note: {
    marginBottom: 24,
    lineHeight: 20,
  },
  acceptBtn: {
    marginBottom: 12,
  },
  disclaimer: {
    textAlign: "center",
  },
  actionsOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
    backgroundColor: "transparent",
  },
  actionsCard: {
    width: 172,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  actionItem: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: "center",
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});
