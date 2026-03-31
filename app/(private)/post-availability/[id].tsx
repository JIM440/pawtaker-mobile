import { Colors } from "@/src/constants/colors";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { ensureCareContractForRequest } from "@/src/lib/contracts/ensureCareContract";
import { createInAppNotification } from "@/src/lib/notifications/in-app";
import { MyCareContractActionsMenu } from "@/src/features/my-care/components/MyCareContractActionsMenu";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { Input } from "@/src/shared/components/ui/Input";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { ViewOfferDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { DataState, ResourceMissingState } from "@/src/shared/components/ui";
import { RatingSummary } from "@/src/shared/components/ui/RatingSummary";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import {
  ChevronLeft,
  EllipsisVertical,
  MapPin,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useToastStore } from "@/src/lib/store/toast.store";

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

  const [reqRow, setReqRow] = useState<any | null>(null);
  const [petRow, setPetRow] = useState<any | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [takerId, setTakerId] = useState<string | null>(null);
  const [takerUser, setTakerUser] = useState<any | null>(null);
  const [takerProfile, setTakerProfile] = useState<any | null>(null);
  const [takerReviews, setTakerReviews] = useState<any[]>([]);
  const [contractId, setContractId] = useState<string | null>(null);

  const [acceptedConfirmOpen, setAcceptedConfirmOpen] = React.useState(false);
  const [accepted, setAccepted] = React.useState(
    () => acceptedParam === '1' || acceptedParam === 'true',
  );
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const [showTerminateConfirm, setShowTerminateConfirm] = React.useState(false);
  const [showReportConfirm, setShowReportConfirm] = React.useState(false);
  const [reportReason, setReportReason] = React.useState("");
  const [blockReason, setBlockReason] = React.useState("");
  const [busyAction, setBusyAction] = React.useState(false);
  const showToast = useToastStore((s) => s.showToast);

  const load = useCallback(async () => {
    if (!requestId) {
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
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const oId = request.owner_id as string;
      setOwnerId(oId);

      if (user.id !== oId) {
        setError(t("offer.wrongRecipient", "Only the pet owner can view this offer."));
        setReqRow(request);
        setPetRow(null);
        setTakerId(null);
        setTakerUser(null);
        setTakerProfile(null);
        setTakerReviews([]);
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
          for (const th of threads ?? []) {
            const parts = (th.participant_ids ?? []) as string[];
            if (!parts.includes(oId)) continue;
            const peer = parts.find((p) => p && p !== oId) ?? null;
            if (peer) return peer;
          }
          return null;
        };

        const threadIds = (threads ?? []).map((th) => th.id).filter(Boolean);
        let proposalSenderId: string | null = null;
        if (threadIds.length) {
          const { data: proposalSenders, error: proposalError } = await supabase
            .from("messages")
            .select("sender_id,created_at")
            .eq("type", "proposal")
            .in("thread_id", threadIds)
            .neq("sender_id", oId)
            .order("created_at", { ascending: false })
            .limit(1);
          if (proposalError) throw proposalError;
          proposalSenderId = proposalSenders?.[0]?.sender_id ?? null;
        }

        applicantId = proposalSenderId || peerFromParticipants();
      }

      const [{ data: pet, error: petError }, { data: tUser, error: tUserError }, { data: tProfile, error: tpError }, { data: reviews, error: revError }] =
        await Promise.all([
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
            ? supabase.from("taker_profiles").select("*").eq("user_id", applicantId).maybeSingle()
            : Promise.resolve({ data: null } as any),
          applicantId
            ? supabase.from("reviews").select("rating").eq("reviewee_id", applicantId)
            : Promise.resolve({ data: [] } as any),
        ]);

      if (petError) throw petError;
      if (tUserError) throw tUserError;
      if (tpError) throw tpError;
      if (revError) throw revError;

      setReqRow(request);
      setPetRow(pet ?? null);
      setTakerId(applicantId);
      setTakerUser(tUser ?? null);
      setTakerProfile(tProfile ?? null);
      setTakerReviews(reviews ?? []);

      if (applicantId) {
        const { data: existingContract, error: contractErr } = await supabase
          .from("contracts")
          .select("id")
          .eq("request_id", requestId)
          .maybeSingle();
        if (contractErr) throw contractErr;
        setContractId((existingContract?.id as string | undefined) ?? null);
      } else {
        setContractId(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error", "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }, [requestId, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const availability = useMemo(() => {
    const raw = takerProfile?.availability_json;
    return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, any>) : null;
  }, [takerProfile?.availability_json]);

  const formatDaysTime = useMemo(() => {
    const days = Array.isArray(availability?.days) ? (availability.days as string[]) : [];
    const start = typeof availability?.startTime === "string" ? availability.startTime : "";
    const end = typeof availability?.endTime === "string" ? availability.endTime : "";
    const dayLabel =
      days.length > 0
        ? days.join(", ")
        : t("common.empty", "—");
    const timeLabel =
      start && end ? `${start}-${end}` : t("common.empty", "—");
    return `${dayLabel} | ${timeLabel}`;
  }, [availability?.days, availability?.endTime, availability?.startTime, t]);

  const mapServiceKeyToLabel = useCallback(
    (key: string) => {
      const k = key === "playwalk" ? "playwalk" : key === "overnight" ? "overnight" : key === "vacation" ? "vacation" : key === "daytime" ? "daytime" : key;
      return t(`feed.careTypes.${k}` as any);
    },
    [t],
  );

  const careOfferingLabel = useMemo(() => {
    const services = Array.isArray(availability?.services) ? (availability.services as string[]) : [];
    if (!services.length) return t("common.empty", "—");
    return services.map(mapServiceKeyToLabel).join(" • ");
  }, [availability?.services, mapServiceKeyToLabel, t]);

  const careTypesDetail = useMemo(() => {
    const services = Array.isArray(availability?.services) ? (availability.services as string[]) : [];
    if (!services.length) return t("common.empty", "—");
    return services.map(mapServiceKeyToLabel).join(", ");
  }, [availability?.services, mapServiceKeyToLabel, t]);

  const petOwnerDetail = useMemo(() => {
    const v = availability?.petOwner;
    if (v === "yes" || v === true) return t("post.availability.ownerYes");
    if (v === "no" || v === false) return t("post.availability.ownerNo");
    return t("common.empty", "—");
  }, [availability?.petOwner, t]);

  const yardDetail = useMemo(() => {
    const y = typeof availability?.yardType === "string" ? availability.yardType : null;
    if (!y) {
      const parsed = parsePetNotes(takerUser?.bio);
      return parsed.yardType ?? t("common.empty", "—");
    }
    return y;
  }, [availability?.yardType, t, takerUser?.bio]);

  const petTypesLabel = useMemo(() => {
    const species = Array.isArray(takerProfile?.accepted_species)
      ? (takerProfile.accepted_species as string[])
      : [];
    if (!species.length) return t("common.empty", "—");
    return species.join(" • ");
  }, [t, takerProfile?.accepted_species]);

  const note = useMemo(() => {
    const n = typeof availability?.note === "string" ? availability.note.trim() : "";
    if (n) return n;
    const bio = typeof takerUser?.bio === "string" ? takerUser.bio.trim() : "";
    return bio || t("profile.bio.empty", "No bio yet.");
  }, [availability?.note, t, takerUser?.bio]);

  const rating = useMemo(() => {
    if (!takerReviews.length) return 0;
    return takerReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / takerReviews.length;
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
        petTypes: petTypesLabel,
        careOffering: careOfferingLabel,
        location: takerUser?.city?.trim() || t("profile.noLocation"),
      },
      details: {
        yardType: yardDetail,
        active: formatDaysTime,
        careTypes: careTypesDetail,
        petOwner: petOwnerDetail,
      },
      note,
    };
  }, [
    availability?.available,
    careOfferingLabel,
    careTypesDetail,
    formatDaysTime,
    note,
    petRow?.name,
    petOwnerDetail,
    petTypesLabel,
    rating,
    t,
    takerUser,
    yardDetail,
  ]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
            router.replace("/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0])
          }
        />
      </View>
    );
  }

  if (error || !reqRow) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <DataState
          title={t("common.error", "Something went wrong")}
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
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ChevronLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <AppText variant="body" style={styles.titleLabel}>
              {t("messages.applyingFor")}
            </AppText>
            <TouchableOpacity
              disabled={!petRow?.id}
              onPress={() => {
                if (!petRow?.id) return;
                router.push({ pathname: "/(private)/pets/[id]", params: { id: petRow.id } });
              }}
            >
              <AppText variant="title" color={colors.primary} style={styles.titleLink}>
                {offer.petName}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Taker profile card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (!takerId) return;
            router.push({
              pathname: "/(private)/(tabs)/profile/users/[id]",
              params: { id: takerId },
            });
          }}
          disabled={!takerId}
          style={[styles.takerCard, { backgroundColor: colors.surfaceContainerLowest }]}
        >
          <UserAvatar
            uri={offer.taker.avatarUri}
            name={offer.taker.name}
            size={64}
            style={styles.takerAvatar}
          />
          <View style={styles.takerBody}>
            <View style={styles.takerTitleRow}>
              <AppText variant="title" numberOfLines={1} style={styles.takerName}>
                {offer.taker.name}
              </AppText>
              {offer.taker.available && (
                <View style={[styles.availablePill, { backgroundColor: colors.tertiaryContainer }]}>
                  <AppText variant="caption" color={colors.onTertiaryContainer}>
                    {t("myCare.available")}
                  </AppText>
                </View>
              )}
              <TouchableOpacity
                style={styles.menuBtn}
                hitSlop={8}
                onPress={() => {
                  if (!accepted) return;
                  setActionsOpen(true);
                }}
                activeOpacity={0.9}
              >
                <EllipsisVertical size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              <RatingSummary
                rating={offer.taker.rating}
                handshakes={offer.taker.handshakes}
                paws={offer.taker.paws}
              />
            </View>
            <AppText variant="caption" color={colors.onSurface} style={styles.petTypes}>
              {offer.taker.petTypes}
            </AppText>
            <View style={[styles.carePill, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="caption" color={colors.onSecondaryContainer}>{offer.taker.careOffering}</AppText>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" color={colors.onSurfaceVariant}>{offer.taker.location}</AppText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Details */}
        <AppText variant="title" style={styles.sectionTitle}>
          {t("requestDetails.details")}
        </AppText>
        <View style={styles.detailGrid}>
          <DetailRow label={t('requestDetails.yardType')} value={offer.details.yardType} colors={colors} />
          <DetailRow label={t("myCare.contract.active")} value={offer.details.active} colors={colors} />
          <DetailRow label={t('requestDetails.careTypes')} value={offer.details.careTypes} colors={colors} />
          <DetailRow label={t('requestDetails.petOwner')} value={offer.details.petOwner} colors={colors} />
        </View>

        {/* Note */}
        <AppText variant="title" style={styles.sectionTitle}>{t("post.availability.note")}</AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.note}>
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
      </ScrollView>

      <MyCareContractActionsMenu
        visible={actionsOpen}
        colors={colors}
        styles={styles}
        t={(key, fallback) => t(key, fallback as string)}
        onClose={() => setActionsOpen(false)}
        onTerminate={() => {
          setActionsOpen(false);
          setShowTerminateConfirm(true);
        }}
        terminateDisabled={busyAction}
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
              message: t("myCare.review.noContract", "No completed contract found to review yet."),
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
        title={t("myCare.contract.terminateConfirmTitle", "Terminate agreement?")}
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
              const { error } = await supabase
                .from("contracts")
                .update({ status: "completed" })
                .eq("id", contractId);
              if (error) throw error;
              if (requestId) {
                await supabase
                  .from("care_requests")
                  .update({ status: "terminated" })
                  .eq("id", requestId);
              }
              if (takerId) {
                await createInAppNotification({
                  userId: takerId,
                  type: "offer_terminated",
                  title: t("myCare.contract.terminatedToast", "Agreement ended."),
                  body: t(
                    "myCare.contract.terminatedNotificationBody",
                    "A care agreement was terminated.",
                  ),
                  data: { contract_id: contractId, request_id: requestId },
                });
              }
              setAccepted(false);
              setShowTerminateConfirm(false);
              showToast({
                variant: "info",
                message: t("myCare.contract.terminatedToast", "Agreement ended."),
                durationMs: 3000,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message: err instanceof Error ? err.message : t("common.error", "Something went wrong"),
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
        visible={showReportConfirm}
        title={t("messages.reportUser", "Report user")}
        description={t(
          "messages.reportConfirmDescription",
          "Are you sure? Please provide a reason.",
        )}
        body={
          <Input
            label={t("messages.reportReasonLabel", "Reason")}
            placeholder={t("messages.reportReasonPlaceholder", "Describe what happened")}
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
                message: t("messages.reportReasonRequired", "Please enter a reason."),
                durationMs: 2800,
              });
              return;
            }
            setBusyAction(true);
            try {
              const { error } = await supabase.from("reports").insert({
                reporter_id: user.id,
                reported_user_id: takerId,
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
                message: err instanceof Error ? err.message : t("common.error", "Something went wrong"),
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
        title={t('messages.blockConfirmTitle')}
        description={t('messages.blockConfirmDescription')}
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
        primaryLabel={t('messages.block')}
        secondaryLabel={t('common.cancel')}
        destructive
        onPrimary={() => {
          setShowBlockConfirm(false);
          setBlockReason("");
          showToast({
            variant: 'info',
            message: t("messages.blockedToast", "User blocked."),
            durationMs: 3000,
          });
        }}
        onSecondary={() => {
          setShowBlockConfirm(false);
          setBlockReason("");
        }}
        onRequestClose={() => {
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
        onPrimary={() => {
          setAcceptedConfirmOpen(false);
          if (blockIfKycNotApproved()) return;
          void (async () => {
            try {
              if (!requestId || !ownerId || !takerId) {
                throw new Error(t("common.error", "Something went wrong"));
              }
              const cid = await ensureCareContractForRequest({
                requestId,
                ownerId,
                takerId,
              });
              await supabase
                .from("care_requests")
                .update({ status: "accepted", taker_id: takerId })
                .eq("id", requestId)
                .eq("owner_id", ownerId);
              await createInAppNotification({
                userId: takerId,
                type: "offer_accepted",
                title: t("messages.agreementAccepted", "Agreement accepted"),
                body: t(
                  "myCare.contract.acceptedNotificationBody",
                  "Your care agreement was accepted.",
                ),
                data: { contract_id: cid, request_id: requestId },
              });
              setContractId(cid);
              setAccepted(true);
              router.push({
                pathname: "/(private)/(tabs)/my-care/contract/[id]" as any,
                params: { id: cid, accepted: "1" } as any,
              });
            } catch (err) {
              showToast({
                variant: "error",
                message: err instanceof Error ? err.message : t("common.error", "Something went wrong"),
                durationMs: 3200,
              });
            }
          })();
        }}
        onSecondary={() => setAcceptedConfirmOpen(false)}
        onRequestClose={() => setAcceptedConfirmOpen(false)}
      />
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" color={colors.onSurfaceVariant}>{label}</AppText>
      <View style={[styles.detailValue, { backgroundColor: colors.surfaceContainer }]}>
        <AppText variant="caption" color={colors.onSecondaryContainer}>{value}</AppText>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleLabel: {
    fontSize: 16,
  },
  titleLink: {
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  takerCard: {
    flexDirection: 'row',
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
    flexDirection: 'row',
    alignItems: 'center',
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
  menuBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  petTypes: {
    fontSize: 12,
  },
  carePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  detailGrid: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  note: {
    marginBottom: 24,
    lineHeight: 20,
  },
  acceptBtn: {
    marginBottom: 12,
  },
  disclaimer: {
    textAlign: 'center',
  },
  actionsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
    backgroundColor: 'transparent',
  },
  actionsCard: {
    width: 172,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
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
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});
