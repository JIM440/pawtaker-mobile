import { Colors } from "@/src/constants/colors";
import type { CareTypeKey } from "@/src/shared/components/ui/CareTypeSelector";
import { ensureCareContractForRequest } from "@/src/lib/contracts/ensureCareContract";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import type { TablesRow } from "@/src/lib/supabase/types";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { DataState, ResourceMissingState } from "@/src/shared/components/ui";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { EllipsisVertical } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

async function resolveCaregiverIdForRequest(
  requestId: string,
  ownerId: string,
): Promise<string | null> {
  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .select("id,participant_ids")
    .eq("request_id", requestId)
    .limit(25);
  if (threadsError) throw threadsError;

  const peerFromParticipants = () => {
    for (const th of threads ?? []) {
      const parts = (th.participant_ids ?? []) as string[];
      if (!parts.includes(ownerId)) continue;
      const peer = parts.find((p) => p && p !== ownerId) ?? null;
      if (peer) return peer;
    }
    return null;
  };

  const threadIds = (threads ?? []).map((th) => th.id).filter(Boolean);
  if (threadIds.length) {
    const { data: proposalSenders, error: proposalError } = await supabase
      .from("messages")
      .select("sender_id,created_at")
      .eq("type", "proposal")
      .in("thread_id", threadIds)
      .neq("sender_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (proposalError) throw proposalError;
    const sid = proposalSenders?.[0]?.sender_id as string | undefined;
    if (sid) return sid;
  }

  return peerFromParticipants();
}

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

  const paramAccepted =
    acceptedParam === "1" || acceptedParam === "true";

  const load = useCallback(async () => {
    if (!routeId) {
      setLoading(false);
      setError("Missing id.");
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
        setError(t("common.error", "Something went wrong"));
        setContractRow(null);
        setRequestRow(null);
        setPetRow(null);
        return;
      }

      if (
        !contract &&
        req.owner_id !== user.id &&
        req.taker_id &&
        req.taker_id !== user.id
      ) {
        setError(t("common.error", "Something went wrong"));
        setContractRow(null);
        setRequestRow(null);
        setPetRow(null);
        return;
      }

      setContractRow(contract);
      setRequestRow(req);
      setPetRow(pet ?? null);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("common.error", "Something went wrong"),
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

  const careTypeKey: CareTypeKey = useMemo(() => {
    const ct = requestRow?.care_type as string | undefined;
    if (ct === "walking") return "playwalk";
    if (ct === "boarding") return "overnight";
    return "daytime";
  }, [requestRow?.care_type]);

  const careTypeLabel = t(`feed.careTypes.${careTypeKey}`);

  const petName = petRow?.name ?? petNameParam ?? "";
  const breed = petRow?.breed ?? breedParam ?? "";
  const dateRange =
    requestRow?.start_date && requestRow?.end_date
      ? `${new Date(requestRow.start_date).toLocaleDateString()} - ${new Date(
          requestRow.end_date,
        ).toLocaleDateString()}`
      : dateParam ?? "";
  const time =
    timeParam && timeParam.trim()
      ? timeParam
      : careTypeLabel;
  const price =
    typeof requestRow?.points_offered === "number"
      ? `${requestRow.points_offered} pts`
      : priceParam ?? "";

  const mode =
    modeParam === "seeking" || modeParam === "applying"
      ? modeParam
      : user?.id && requestRow?.owner_id === user.id
        ? "seeking"
        : "applying";

  const resolvedContractId = contractRow?.id as string | undefined;

  const contractStatus = contractRow?.status as string | undefined;
  const agreementLive =
    contractStatus === "signed" || contractStatus === "active";
  const agreementEnded = contractStatus === "completed";

  /** Deep-link param lets the UI unlock immediately after accepting an offer (before sign rows sync). */
  const acceptedUI =
    (paramAccepted && !agreementEnded) || agreementLive;

  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const onAccept = () => {
    setShowAcceptConfirm(true);
  };

  const confirmAccept = () => {
    void (async () => {
      if (!user?.id || !requestRow?.id) return;
      setBusy(true);
      try {
        let cid = resolvedContractId;
        const ownerId = requestRow.owner_id as string;
        let takerId =
          (requestRow.taker_id as string | null) || (contractRow?.taker_id as string | null);
        if (!takerId) {
          takerId = await resolveCaregiverIdForRequest(requestRow.id, ownerId);
          if (takerId) {
            setRequestRow((r: any) => (r ? { ...r, taker_id: takerId } : r));
            void supabase
              .from("care_requests")
              .update({ taker_id: takerId })
              .eq("id", requestRow.id)
              .eq("owner_id", ownerId);
          }
        }

        if (!cid) {
          if (!takerId) {
            showToast({
              variant: "error",
              message: t("myCare.contract.needTaker"),
              durationMs: 3200,
            });
            setShowAcceptConfirm(false);
            return;
          }
          cid = await ensureCareContractForRequest({
            requestId: requestRow.id,
            ownerId,
            takerId,
          });
        }

        const { data: freshRaw, error: fetchErr } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", cid)
          .single();
        if (fetchErr) throw fetchErr;
        const fresh = freshRaw as TablesRow<"contracts">;

        const signedOwner =
          user.id === fresh.owner_id ? true : fresh.signed_owner;
        const signedTaker =
          user.id === fresh.taker_id ? true : fresh.signed_taker;

        let status = fresh.status as string;
        if (signedOwner && signedTaker) status = "active";
        else if (signedOwner || signedTaker) status = "signed";
        else status = "draft";

        const { error: updErr } = await supabase
          .from("contracts")
          .update({
            signed_owner: signedOwner,
            signed_taker: signedTaker,
            status,
          })
          .eq("id", cid);
        if (updErr) throw updErr;

        setContractRow({ ...fresh, signed_owner: signedOwner, signed_taker: signedTaker, status });
        setShowAcceptConfirm(false);
        showToast({
          variant: "success",
          message: t("messages.agreementAccepted", "Agreement accepted"),
          durationMs: 3000,
        });
      } catch (err) {
        showToast({
          variant: "error",
          message:
            err instanceof Error ? err.message : t("common.error", "Something went wrong"),
          durationMs: 3200,
        });
      } finally {
        setBusy(false);
      }
    })();
  };

  const confirmTerminate = () => {
    void (async () => {
      if (!resolvedContractId) {
        return;
      }
      setBusy(true);
      try {
        const { error } = await supabase
          .from("contracts")
          .update({ status: "completed" })
          .eq("id", resolvedContractId);
        if (error) throw error;
        setContractRow((c: any) => (c ? { ...c, status: "completed" } : c));
        showToast({
          variant: "info",
          message: t("myCare.contract.terminatedToast"),
          durationMs: 3000,
        });
      } catch (err) {
        showToast({
          variant: "error",
          message:
            err instanceof Error ? err.message : t("common.error", "Something went wrong"),
          durationMs: 3200,
        });
      } finally {
        setBusy(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageContainer>
        <BackHeader title={t("myCare.contract.title")} onBack={() => router.back()} />
        <DataState title={t("common.loading", "Loading...")} mode="full" />
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer>
        <BackHeader title={t("myCare.contract.title")} onBack={() => router.back()} />
        <ResourceMissingState
          onBack={() => router.back()}
          onHome={() =>
            router.replace("/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0])
          }
        />
      </PageContainer>
    );
  }

  if (error || !requestRow) {
    return (
      <PageContainer>
        <BackHeader title={t("myCare.contract.title")} onBack={() => router.back()} />
        <DataState
          title={t("common.error", "Something went wrong")}
          message={error ?? undefined}
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
    <PageContainer>
      <BackHeader
        title={t("myCare.contract.title")}
        onBack={() => router.back()}
        rightSlot={
          acceptedUI && !agreementEnded ? (
            <TouchableOpacity
              onPress={() => setActionsOpen(true)}
              hitSlop={12}
              style={[
                styles.menuBtnTop,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <EllipsisVertical size={24} color={colors.onSurface} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant },
          ]}
        >
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.cardTitle}
          >
            {t("myCare.contract.title")}
          </AppText>

          {petName ? (
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.cardSub}
            >
              {mode === "seeking"
                ? t("messages.seekingForPet", { petName })
                : t("messages.applyingForPet", { petName })}
            </AppText>
          ) : (
            <AppText
              variant="body"
              color={colors.onSurfaceVariant}
              style={styles.cardSub}
            >
              {t("myCare.contract.idLabel", {
                id: resolvedContractId ?? routeId,
              })}
            </AppText>
          )}

          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.bodyText}
          >
            {agreementEnded
              ? t("myCare.contract.agreementEnded")
              : acceptedUI
                ? t("myCare.contract.agreementActive")
                : t("myCare.contract.acceptHint")}
          </AppText>

          {(breed || dateRange || time || price) && (
            <View style={styles.requestSummary}>
              {breed ? (
                <AppText variant="caption" color={colors.onSurface}>
                  {breed}
                </AppText>
              ) : null}
              {dateRange || time ? (
                <AppText
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  style={styles.requestSummaryLine}
                >
                  {dateRange}
                  {dateRange && time ? " • " : ""}
                  {time}
                </AppText>
              ) : null}
              {price ? (
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {price}
                </AppText>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.sectionSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        {!acceptedUI && !agreementEnded ? (
          <Button
            label={t("myCare.contract.acceptOffer")}
            onPress={onAccept}
            fullWidth
            disabled={busy}
            loading={busy}
          />
        ) : null}
      </View>

      <FeedbackModal
        visible={showAcceptConfirm}
        title={t("myCare.contract.acceptConfirmTitle")}
        description={t("myCare.contract.acceptConfirmDescription")}
        primaryLabel={t("myCare.contract.acceptOffer")}
        secondaryLabel={t("common.cancel")}
        onPrimary={confirmAccept}
        onSecondary={() => setShowAcceptConfirm(false)}
        onRequestClose={() => setShowAcceptConfirm(false)}
      />

      <FeedbackModal
        visible={showBlockConfirm}
        title={t("messages.blockConfirmTitle")}
        description={t("messages.blockConfirmDescription")}
        primaryLabel={t("messages.block")}
        secondaryLabel={t("common.cancel")}
        destructive
        onPrimary={() => {
          setShowBlockConfirm(false);
          showToast({
            variant: "info",
            message: t("messages.blockedToast"),
            durationMs: 3000,
          });
        }}
        onSecondary={() => setShowBlockConfirm(false)}
        onRequestClose={() => setShowBlockConfirm(false)}
      />

      <Modal
        transparent
        visible={actionsOpen}
        onRequestClose={() => setActionsOpen(false)}
        animationType="fade"
      >
        <Pressable
          style={styles.actionsOverlay}
          onPress={() => setActionsOpen(false)}
        >
          <View
            style={[
              styles.actionsCard,
              {
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [
                styles.actionItem,
                pressed ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                setActionsOpen(false);
                confirmTerminate();
              }}
            >
              <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                {t("myCare.contract.terminate")}
              </AppText>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

            <Pressable
              style={({ pressed }) => [
                styles.actionItem,
                pressed ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                setActionsOpen(false);
                setShowBlockConfirm(true);
              }}
            >
              <AppText variant="body" color={colors.error} numberOfLines={1}>
                {t("profile.blockUser")}
              </AppText>
            </Pressable>

            <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

            <Pressable
              style={({ pressed }) => [
                styles.actionItem,
                pressed ? { opacity: 0.7 } : null,
              ]}
              onPress={() => {
                setActionsOpen(false);
                const rid = resolvedContractId;
                if (!rid) {
                  showToast({
                    variant: "error",
                    message: t("myCare.review.noContract", "No contract found for this care yet."),
                    durationMs: 3200,
                  });
                  return;
                }
                router.push(`/(private)/(tabs)/my-care/review/${rid}` as any);
              }}
            >
              <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                {t("myCare.contract.rateAndReview")}
              </AppText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 120, gap: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 6 },
  cardTitle: { marginBottom: 2 },
  cardSub: { marginBottom: 4 },
  bodyText: { marginTop: 6 },
  requestSummary: { gap: 2, marginTop: 6 },
  requestSummaryLine: { marginTop: 2 },
  sectionSpacer: { height: 12 },
  footer: {
    padding: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "transparent",
  },
  menuBtnTop: {
    padding: 6,
    borderRadius: 999,
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
  menuDivider: { height: 1, marginHorizontal: 12 },
});
