import { Colors } from "@/src/constants/colors";
import { hasUserBlockRelation } from "@/src/lib/blocks/user-blocks";
import { getRequestEligibility } from "@/src/lib/contracts/request-eligibility";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { getOrCreateThreadForUsers } from "@/src/lib/messages/get-or-create-thread";
import { hasAvailabilityProfile } from "@/src/lib/taker/availability-profile";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { enforceLocationGate } from "@/src/shared/utils/locationGate";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import {
  computeCarePoints,
  normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { CareTypeSelector } from "@/src/shared/components/ui/CareTypeSelector";
import { Input } from "@/src/shared/components/ui/Input";
import { OfferDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { ErrorState, ResourceMissingState } from "@/src/shared/components/ui";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * Send a care offer / request to pet-sit (Figma ~801-22836).
 * Opened from request detail “Apply” or similar flows.
 */
export default function SendOfferScreen() {
  const { id: requestId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, profile } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reqRow, setReqRow] = useState<any | null>(null);
  const [petRow, setPetRow] = useState<any | null>(null);
  const [ownerRow, setOwnerRow] = useState<any | null>(null);

  const [careTypes, setCareTypes] = useState<string[]>(["daytime"]);
  const [points, setPoints] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
          "offer.loadFailed",
          "We couldn't load this request right now. Please try again.",
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
        setOwnerRow(null);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const [{ data: pet, error: pet405 }, { data: owner, error: ownError }] = await Promise.all([
        supabase.from("pets").select("id,name").eq("id", request.pet_id).maybeSingle(),
        supabase
          .from("users")
          .select("id,full_name,avatar_url")
          .eq("id", request.owner_id)
          .maybeSingle(),
      ]);
      if (pet405) throw pet405;
      if (ownError) throw ownError;

      if (!pet || !owner) {
        setReqRow(null);
        setPetRow(null);
        setOwnerRow(null);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      setReqRow(request);
      setPetRow(pet);
      setOwnerRow(owner);

      const defaultKey = normalizeCareTypeForPoints(request.care_type);
      setCareTypes([defaultKey]);
      setPoints(
        String(
          computeCarePoints(
            request.care_type,
            request.start_date,
            request.end_date,
          ),
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t(
              "offer.loadFailed",
              "We couldn't load this request right now. Please try again.",
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

  const recipientName = useMemo(() => resolveDisplayName(ownerRow) || t("requestDetails.owner", "Owner"), [ownerRow, t]);

  const petName = petRow?.name || t("pets.add.name", "Pet");

  const isOwner = Boolean(user?.id && reqRow?.owner_id && user.id === reqRow.owner_id);

  const toggleCare = (key: string) => {
    setCareTypes((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const onSend = () => {
    if (blockIfKycNotApproved()) return;
    if (!enforceLocationGate(profile, router, showToast, t)) return;
    if (!user?.id || !requestId || !reqRow?.owner_id) return;
    if (isOwner) return;
    void (async () => {
      const eligibility = await getRequestEligibility(requestId);
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
          durationMs: 3200,
        });
        return;
      }
      if (careTypes.length === 0) {
        showToast({
          variant: "error",
          message: t("post.availability.validation.careTypeRequired"),
          durationMs: 2600,
        });
        return;
      }
      const pointsNum = Number(points);
      if (!points.trim() || !Number.isFinite(pointsNum) || pointsNum <= 0) {
        showToast({
          variant: "error",
          message: t("offer.pointsLabel"),
          durationMs: 2600,
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
      setShowConfirm(true);
    })();
  };

  const doSend = () => {
    if (!enforceLocationGate(profile, router, showToast, t)) return;
    if (!user?.id || !requestId || !reqRow?.owner_id) return;
    const pointsNum = Number(points);
    void (async () => {
      setSending(true);
      try {
        const hasProfile = await hasAvailabilityProfile(user.id);
        if (!hasProfile) {
          throw new Error(
            t(
              "offer.availabilityProfileRequired",
              "Add your availability profile before applying to pet requests.",
            ),
          );
        }
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
          requestId,
        });
        if (!threadId) throw new Error("Could not create chat thread.");

        const body =
          message.trim() ||
          t("offer.defaultProposalMessage", "I’d like to help with this care request.");

        const { error: msgError } = await supabase.from("messages").insert({
          thread_id: threadId,
          sender_id: user.id,
          content: body,
          type: "proposal",
          metadata: {
            requestId,
            careTypes,
            pointsOffered: pointsNum,
          },
        });
        if (msgError) throw msgError;

        await supabase
          .from("threads")
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", threadId);

        showToast({
          variant: "success",
          message: t("offer.sent", "Offer sent."),
          durationMs: 2400,
        });
        router.replace({
          pathname: "/(private)/chat/[threadId]" as any,
          params: {
            threadId,
            mode: "applying",
            offerId: requestId,
          } as any,
        });
      } catch (err) {
        showToast({
          variant: "error",
          message: errorMessageFromUnknown(
            err,
            t("errors.loadOfferSendFailed"),
          ),
          durationMs: 3200,
        });
      } finally {
        setSending(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader title={t("offer.title")} onBack={() => router.back()} />
        <OfferDetailScreenSkeleton />
        <View style={styles.footer}>
          <Skeleton height={48} width="100%" borderRadius={12} />
        </View>
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer>
        <BackHeader title={t("offer.title")} onBack={() => router.back()} />
        <ResourceMissingState
          onBack={() => router.back()}
          onHome={() =>
            router.replace("/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0])
          }
        />
      </PageContainer>
    );
  }

  if (error || !reqRow || !ownerRow || !petRow) {
    return (
      <PageContainer>
        <BackHeader title={t("offer.title")} onBack={() => router.back()} />
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
    <PageContainer>
      <BackHeader title={t("offer.title")} onBack={() => router.back()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.subtitle}>
          {t("offer.subtitle")}
        </AppText>

        <View
          style={[
            styles.recipientCard,
            {
              backgroundColor: colors.surfaceBright,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <UserAvatar uri={ownerRow.avatar_url} name={recipientName} size={56} />
          <View style={styles.recipientText}>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {t("offer.recipient")}
            </AppText>
            <AppText variant="title" style={styles.recipientName} numberOfLines={1}>
              {recipientName}
            </AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} numberOfLines={1}>
              {t("offer.forPet", { name: petName })}
            </AppText>
          </View>
        </View>

        <AppText variant="label" color={colors.onSurfaceVariant} style={styles.sectionLabel}>
          {t("filters.careType")}
        </AppText>
        <View style={styles.careBlock}>
          <CareTypeSelector
            selectedKeys={careTypes}
            onToggle={toggleCare}
            circleSize={56}
            iconSize={22}
          />
        </View>

        <Input
          label={t("offer.pointsLabel")}
          value={points}
          onChangeText={setPoints}
          keyboardType="number-pad"
          placeholder={t("offer.pointsPlaceholder", "0")}
        />

        <Input
          label={t("offer.messageLabel")}
          value={message}
          onChangeText={setMessage}
          multiline
          placeholder={t("offer.messagePlaceholder")}
          inputStyle={styles.messageInput}
          containerStyle={styles.messageContainer}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t("offer.send")}
          onPress={onSend}
          fullWidth
          loading={sending}
          disabled={sending || isOwner || reqRow?.status !== "open"}
        />
      </View>

      <FeedbackModal
        visible={showConfirm}
        title={t("offer.confirmTitle", "Send offer?")}
        description={t("offer.confirmDescription", "This will send your care proposal to the pet owner.")}
        primaryLabel={t("offer.send")}
        secondaryLabel={t("common.cancel")}
        primaryLoading={sending}
        onPrimary={() => {
          setShowConfirm(false);
          doSend();
        }}
        onSecondary={() => setShowConfirm(false)}
        onRequestClose={() => setShowConfirm(false)}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 16,
  },
  subtitle: {
    marginBottom: 4,
    lineHeight: 22,
  },
  recipientCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  recipientText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: "600",
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: -4,
  },
  careBlock: {
    marginBottom: 8,
  },
  messageContainer: {
    marginBottom: 0,
  },
  messageInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
});
