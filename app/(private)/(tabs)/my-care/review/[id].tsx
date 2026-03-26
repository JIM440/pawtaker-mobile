import { Colors } from "@/src/constants/colors";
import { ProfileHeader } from "@/src/features/profile/components/ProfileHeader";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { BackHeader, PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { ReviewDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { DataState } from "@/src/shared/components/ui";
import { Skeleton } from "@/src/shared/components/ui/Skeleton";
import { Input } from "@/src/shared/components/ui/Input";
import { StarRatingInput } from "@/src/shared/components/ui/StarRatingInput";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MoreHorizontal } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

/**
 * Create review after care (Figma ~989-33186 form, ~1029-29385 thank-you).
 */
export default function PostCareReviewScreen() {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
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
      setError(t("common.error", "Something went wrong"));
      return;
    }

    setLoading(true);
    setError(null);
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
        setError(t("myCare.review.noContract", "No completed contract found to review yet."));
        return;
      }

      const revieweeId =
        contract.owner_id === user.id
          ? (contract.taker_id as string)
          : (contract.owner_id as string);

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

      const { data: existingReview } = await supabase
        .from("reviews")
        .select("rating,comment")
        .eq("contract_id", contract.id)
        .eq("reviewer_id", user.id)
        .maybeSingle();
      if (existingReview) {
        setRating(existingReview.rating ?? 0);
        setComment(
          typeof existingReview.comment === "string" ? existingReview.comment : "",
        );
        setSubmitted(true);
      }

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
      setError(err instanceof Error ? err.message : t("common.error", "Something went wrong"));
    } finally {
      setLoading(false);
    }
  }, [routeId, t, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const reviewContextLabel = useMemo(
    () =>
      contextPetName
        ? t("myCare.review.careForPet", { petName: contextPetName })
        : t("myCare.review.peerTask", "Care complete"),
    [contextPetName, t],
  );

  const header = useMemo(() => {
    const name = resolveDisplayName(reviewee) || t("common.user", "User");
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
    if (rating < 1) return;
    if (!user?.id || !contractId || !reviewee?.id) {
      showToast({
        variant: "error",
        message: error ?? t("common.error", "Something went wrong"),
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
          comment: comment.trim() ? comment.trim() : null,
        });
        if (insertError) throw insertError;
        setSubmitted(true);
        showToast({
          variant: "success",
          message: t("myCare.review.submitted", "Thanks! Your review was posted."),
          durationMs: 2600,
        });
      } catch (err) {
        showToast({
          variant: "error",
          message: err instanceof Error ? err.message : t("common.error", "Something went wrong"),
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
        <View style={styles.footer}>
          <Skeleton height={48} width="100%" borderRadius={12} />
        </View>
      </PageContainer>
    );
  }

  if (error || !reviewee || !contractId) {
    return (
      <PageContainer>
        <BackHeader title="" onBack={() => router.back()} />
        <DataState
          title={t("common.error", "Something went wrong")}
          message={error ?? t("myCare.review.noContract", "No completed contract found to review yet.")}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void load();
          }}
          mode="full"
        />
      </PageContainer>
    );
  }

  if (submitted) {
    return (
      <PageContainer>
        <BackHeader
          title=""
          onBack={() => router.back()}
          rightSlot={
            <View style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
              <MoreHorizontal size={24} color={colors.onSurface} />
            </View>
          }
        />
        <View style={styles.successWrap}>
          <View style={{ width: "100%" }}>
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

            <View style={styles.staticStarsWrap} pointerEvents="none">
              <StarRatingInput
                value={rating}
                onChange={() => {}}
                size={28}
                maxStars={5}
                accessibilityLabel="Rating"
              />
            </View>

            <Input
              label={t("myCare.review.comment", "Review")}
              value={comment}
              onChangeText={() => {}}
              editable={false}
              multiline
              placeholder=""
              inputStyle={styles.commentInput}
              containerStyle={styles.commentContainer}
              showErrorOnlyAfterFocus={false}
            />

            <Button
              label={t("myCare.review.submit", "Submit")}
              onPress={() => router.back()}
              fullWidth
              style={styles.doneBtn}
            />
          </View>
        </View>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BackHeader
        title=""
        onBack={() => router.back()}
        rightSlot={
          <View style={{ paddingHorizontal: 4, paddingVertical: 4 }}>
            <MoreHorizontal size={24} color={colors.onSurface} />
          </View>
        }
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

        <AppText variant="label" color={colors.onSurfaceVariant} style={styles.ratingLabel}>
          {t("myCare.review.rating")}
        </AppText>
        <StarRatingInput
          value={rating}
          onChange={setRating}
          size={40}
          accessibilityLabel={t("myCare.review.rating")}
        />

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
          label={t("myCare.review.submit")}
          onPress={onSubmit}
          fullWidth
          disabled={rating < 1 || submitting}
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
  intro: {
    lineHeight: 22,
    marginBottom: 4,
  },
  ratingLabel: {
    marginTop: 8,
    marginBottom: 4,
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
  successWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 16,
  },
  doneBtn: {
    marginTop: 8,
    width: "100%",
  },
  staticStarsWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 8,
  },
});
