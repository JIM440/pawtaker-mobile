import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { Button } from "@/src/shared/components/ui/Button";
import { ReviewDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { ErrorState } from "@/src/shared/components/ui";
import { Input } from "@/src/shared/components/ui/Input";
import { StarRatingInput } from "@/src/shared/components/ui/StarRatingInput";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * Create review after care (Figma ~989-33186 form, ~1029-29385 thank-you).
 */
export default function PostCareReviewScreen() {
  const { id: routeId, revieweeId: revieweeIdParam } = useLocalSearchParams<{
    id: string;
    revieweeId?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractId, setContractId] = useState<string | null>(null);
  const [reviewee, setReviewee] = useState<any | null>(null);
  const [revieweeReviews, setRevieweeReviews] = useState<any[]>([]);
  const [contextPetName, setContextPetName] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!routeId) {
      setLoading(false);
      setError("Missing id.");
      return;
    }
    if (!user?.id) {
      setLoading(false);
      setError(t("myCare.review.loadFormFailed"));
      return;
    }

    setLoading(true);
    setError(null);
    setRating(0);
    setComment("");
    setContextPetName(null);
    try {
      // Try direct contract id first (preferred).
      const { data: contractDirect, error: directErr } = await supabase
        .from("contracts")
        .select("*")
        .eq("id", routeId)
        .maybeSingle();
      if (directErr) throw directErr;

      let contract: any | null = contractDirect ?? null;

      // Fallback: route id is a care_request id — pick most recent contract for that request involving the user.
      if (!contract) {
        const { data: contracts, error: cErr } = await supabase
          .from("contracts")
          .select("*")
          .eq("request_id", routeId)
          .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`)
          .order("created_at", { ascending: false })
          .limit(1);
        if (cErr) throw cErr;
        contract = contracts?.[0] ?? null;
      }

      if (!contract) {
        setContractId(null);
        setReviewee(null);
        setRevieweeReviews([]);
        setContextPetName(null);
        setError(t("myCare.review.noContract"));
        return;
      }

      const explicitRevieweeId =
        typeof revieweeIdParam === "string" && revieweeIdParam.trim().length > 0
          ? revieweeIdParam.trim()
          : null;
      const revieweeId =
        explicitRevieweeId ??
        (contract.owner_id === user.id
          ? (contract.taker_id as string)
          : (contract.owner_id as string));

      const [{ data: peer, error: peerErr }, { data: revs, error: revErr }] = await Promise.all([
        supabase
          .from("users")
          .select(
            "id,full_name,avatar_url,city,points_balance,care_given_count,care_received_count",
          )
          .eq("id", revieweeId)
          .maybeSingle(),
        supabase.from("reviews").select("rating").eq("reviewee_id", revieweeId),
      ]);
      if (peerErr) throw peerErr;
      if (revErr) throw revErr;

      setContractId(contract.id as string);
      setReviewee(peer ?? null);
      setRevieweeReviews(revs ?? []);

      const reqId = contract.request_id as string | undefined;
      if (reqId) {
        const { data: reqRow } = await supabase
          .from("care_requests")
          .select("pet_id")
          .eq("id", reqId)
          .maybeSingle();
        const pid = reqRow?.pet_id as string | undefined;
        if (pid) {
          const { data: petRow } = await supabase
            .from("pets")
            .select("name")
            .eq("id", pid)
            .maybeSingle();
          setContextPetName((petRow?.name as string | undefined) ?? null);
        } else {
          setContextPetName(null);
        }
      } else {
        setContextPetName(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("myCare.review.loadFormFailed"),
      );
    } finally {
      setLoading(false);
    }
  }, [revieweeIdParam, routeId, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const reviewContextLabel = useMemo(
    () =>
      contextPetName
        ? t("myCare.review.careForPet", { petName: contextPetName })
        : t("myCare.review.peerTask"),
    [contextPetName, t],
  );

  const header = useMemo(() => {
    const name = resolveDisplayName(reviewee) || t("common.user");
    const location = reviewee?.city?.trim() || t("profile.noLocation");
    const points = reviewee?.points_balance ?? 0;
    const handshakes = reviewee?.care_given_count ?? 0;
    const paws = reviewee?.care_received_count ?? 0;
    const avg =
      revieweeReviews.length > 0
        ? revieweeReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / revieweeReviews.length
        : 0;
    return { name, location, points, handshakes, paws, rating: avg };
  }, [reviewee, revieweeReviews, t]);

  const onSubmit = () => {
    const trimmedComment = comment.trim();

    if (rating < 1) {
      showToast({
        variant: "error",
        message: t("myCare.review.ratingRequired"),
        durationMs: 2800,
      });
      return;
    }
    if (!trimmedComment) {
      showToast({
        variant: "error",
        message: t("myCare.review.commentRequired"),
        durationMs: 2800,
      });
      return;
    }
    if (!user?.id || !contractId || !reviewee?.id) {
      showToast({
        variant: "error",
        message:
          error ??
          t("myCare.review.submitContractUnavailable"),
        durationMs: 3200,
      });
      return;
    }
    void (async () => {
      setSubmitting(true);
      try {
        const { error: insertError } = await supabase.from("reviews").insert({
          contract_id: contractId,
          reviewer_id: user.id,
          reviewee_id: reviewee.id,
          rating,
          comment: trimmedComment,
        });
        if (insertError) throw insertError;
        showToast({
          variant: "success",
          message: t("myCare.review.submitted"),
          durationMs: 2600,
        });
        router.replace({
        pathname: "/(private)/(tabs)/(home)/users/[id]" as any,
          params: { id: reviewee.id, initialTab: "reviews" },
        });
      } catch (err) {
        showToast({
          variant: "error",
          message: errorMessageFromUnknown(
            err,
            t("myCare.review.submitFailed"),
          ),
          durationMs: 3200,
        });
      } finally {
        setSubmitting(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingTop: 0 }}>
        <BackHeader title="" onBack={() => router.back()} />
        <ReviewDetailScreenSkeleton />
      </PageContainer>
    );
  }

  if (error || !reviewee || !contractId) {
    return (
      <PageContainer>
        <BackHeader title="" onBack={() => router.back()} />
        <ErrorState
          error={error ?? t("myCare.review.noContract")}
          actionLabel={t("common.retry")}
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
        title=""
        onBack={() => router.back()}
        style={{ paddingTop: 0 }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          name={header.name}
          avatarUri={reviewee?.avatar_url}
          location={header.location}
          points={header.points}
          handshakes={header.handshakes}
          paws={header.paws}
          rating={header.rating}
          currentTask={reviewContextLabel}
          isAvailable
        />

        <View style={styles.starsCenter}>
          <StarRatingInput
            value={rating}
            onChange={setRating}
            size={28}
            accessibilityLabel={t("myCare.review.rating")}
          />
        </View>

        <Input
          label={t("myCare.review.comment")}
          value={comment}
          onChangeText={setComment}
          multiline
          placeholder={t("myCare.review.commentPlaceholder")}
          inputStyle={styles.commentInput}
          containerStyle={styles.commentContainer}
        />
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t("common.submit")}
          onPress={onSubmit}
          fullWidth
          disabled={submitting}
          loading={submitting}
        />
      </View>
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
  starsCenter: {
    alignItems: "center",
    marginVertical: 8,
  },
  commentContainer: {
    marginBottom: 0,
  },
  commentInput: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  footer: {
    paddingTop: 8,
    paddingBottom: 24,
  },
});
