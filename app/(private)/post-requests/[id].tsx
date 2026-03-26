import { Colors } from "@/src/constants/colors";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import {
  computeCarePoints,
  normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { supabase } from "@/src/lib/supabase/client";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { RequestDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { DataState, ResourceMissingState } from "@/src/shared/components/ui";
import { DetailPetGalleryChrome } from "@/src/shared/components/pets/DetailPetGalleryChrome";
import { PetPhotoCarousel } from "@/src/shared/components/pets/PetPhotoCarousel";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import type { CareTypeKey } from "@/src/shared/components/ui/CareTypeSelector";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  Clock,
  Handshake,
  Heart,
  MapPin,
  PawPrint,
  Star,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const H_PADDING = 16;
const IMAGE_HEIGHT = 216;

function toRad(d: number) {
  return (d * Math.PI) / 180;
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
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

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [isFavorite, setIsFavorite] = useState(false);
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

      const [{ data: petRow, error: petError }, { data: ownerRow, error: ownerError }, { data: meRow, error: meError }, { data: reviews, error: reviewsError }] =
        await Promise.all([
          supabase.from("pets").select("*").eq("id", request.pet_id).maybeSingle(),
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
          supabase.from("reviews").select("rating").eq("reviewee_id", request.owner_id),
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
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error", "Something went wrong"));
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

  const careTypeKey: CareTypeKey = useMemo(
    () => normalizeCareTypeForPoints(reqRow?.care_type as string | undefined),
    [reqRow?.care_type],
  );

  const dateRange = useMemo(() => {
    if (!reqRow?.start_date || !reqRow?.end_date) return "";
    return `${new Date(reqRow.start_date).toLocaleDateString()} - ${new Date(
      reqRow.end_date,
    ).toLocaleDateString()}`;
  }, [reqRow?.end_date, reqRow?.start_date]);

  const careTypeLabel = t(`feed.careTypes.${careTypeKey}`);

  const location =
    owner?.city?.trim() || t("profile.noLocation");

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

  const description =
    (reqRow?.description as string | null | undefined)?.trim() ||
    parsedPetNotes.bio ||
    (typeof pet?.notes === "string" ? pet.notes : "") ||
    t("post.request.noDescription", "No description yet.");

  const ownerRating =
    ownerReviews.length > 0
      ? ownerReviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ownerReviews.length
      : 0;

  const request = {
    petName: pet?.name ?? t("pets.add.name", "Pet"),
    breed: pet?.breed ?? t("pets.add.breed", "Breed"),
    petType: pet?.species ?? t("pets.add.kind", "Pet"),
    dateRange,
    time: "",
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
      yardType: parsedPetNotes.yardType ?? t("common.empty", "—"),
      age: parsedPetNotes.ageRange ?? t("common.empty", "—"),
      energyLevel: parsedPetNotes.energyLevel ?? t("common.empty", "—"),
    },
    specialNeeds:
      parsedPetNotes.specialNeeds || t("pet.detail.none", "None"),
  };

  const isOwner = Boolean(user?.id && reqRow?.owner_id && user.id === reqRow.owner_id);

  const openApplyConfirm = () => {
    if (blockIfKycNotApproved()) return;
    if (!user?.id || !id || !reqRow?.owner_id) return;
    if (isOwner) return;
    setApplyConfirmOpen(true);
  };

  const runApply = async () => {
    if (blockIfKycNotApproved()) {
      setApplyConfirmOpen(false);
      return;
    }
    if (!user?.id || !id || !reqRow?.owner_id) return;
    const ownerId = reqRow.owner_id as string;
    const participants = [user.id, ownerId].sort();

    let threadId: string | null = null;

    const { data: existing, error: existingError } = await supabase
      .from("threads")
      .select("id,participant_ids,request_id")
      .eq("request_id", id)
      .contains("participant_ids", participants)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing?.id) {
      threadId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from("threads")
        .insert({
          participant_ids: participants,
          request_id: id,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;
      threadId = inserted.id;
    }

    if (!threadId) throw new Error("Could not create chat thread.");

    const formulaPoints =
      reqRow.start_date && reqRow.end_date
        ? computeCarePoints(
            reqRow.care_type,
            reqRow.start_date as string,
            reqRow.end_date as string,
          )
        : null;
    const price =
      formulaPoints != null ? `${formulaPoints} pts` : "";

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
        setError(err instanceof Error ? err.message : t("common.error", "Something went wrong"));
      } finally {
        setApplying(false);
      }
    })();
  };

  if (loading) {
    return (
      <PageContainer>
        <BackHeader className="pl-0 pt-0" title="" onBack={() => router.back()} />
        <View style={styles.screenWrap}>
          <RequestDetailScreenSkeleton />
        </View>
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer>
        <BackHeader className="pl-0 pt-0" title="" onBack={() => router.back()} />
        <ResourceMissingState
          onBack={() => router.back()}
          onHome={() =>
            router.replace("/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0])
          }
        />
      </PageContainer>
    );
  }

  if (error || !reqRow || !pet || !owner) {
    return (
      <PageContainer>
        <BackHeader className="pl-0 pt-0" title="" onBack={() => router.back()} />
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
    <PageContainer contentStyle={{ paddingTop: 0 }}>
      <View style={styles.screenWrap}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DetailPetGalleryChrome
            onBack={() => router.back()}
            style={{ marginBottom: 8 }}
          >
            <PetPhotoCarousel
              urls={images}
              height={IMAGE_HEIGHT}
              horizontalInset={H_PADDING}
              imageBorderRadius={16}
              showCounterBadge={false}
              dotsVariant="onImage"
              showSegmentProgressBar
            />
          </DetailPetGalleryChrome>

          {/* Pet name, breed, favorite */}
          <View style={styles.nameRow}>
            <View style={styles.nameBreedRow}>
              <TouchableOpacity
                disabled={!pet?.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (!pet?.id) return;
                  router.push({
                    pathname: "/(private)/pets/[id]",
                    params: { id: pet.id },
                  });
                }}
              >
                <AppText
                  variant="headline"
                  color={colors.onSurface}
                  style={styles.petName}
                >
                  {request.petName}
                </AppText>
              </TouchableOpacity>
              <View style={styles.breedRow}>
                <AppText variant="caption" color={colors.onSurface}>
                  {request.breed}
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {" "}
                  •{" "}
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {request.petType}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsFavorite(!isFavorite)}
              style={[
                styles.heartBtn,
                { backgroundColor: colors.surfaceContainer },
              ]}
            >
              <Heart
                size={20}
                color={colors.onSurface}
                fill={isFavorite ? colors.primary : "transparent"}
              />
            </TouchableOpacity>
          </View>

          {/* Date & time */}
          <View style={[styles.metaRow, { marginBottom: 6 }]}>
            <View style={styles.metaItem}>
              <Calendar size={16} color={colors.onSurfaceVariant} />
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.metaText}
              >
                {request.dateRange}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {" "}
              •{" "}
            </AppText>
            <View style={styles.metaItem}>
              <Clock size={16} color={colors.onSurfaceVariant} />
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.metaText}
              >
                {request.time}
              </AppText>
            </View>
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {" "}
              •{" "}
            </AppText>
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.metaText}
            >
              {request.careType}
            </AppText>
          </View>

          {/* Location */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={16} color={colors.onSurfaceVariant} />
              <AppText
                variant="caption"
                color={colors.onSurfaceVariant}
                style={styles.metaText}
              >
                {request.location}
              </AppText>
            </View>
            {request.distance ? (
              <>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {" "}
                  •{" "}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  style={styles.metaText}
                >
                  {request.distance}
                </AppText>
              </>
            ) : null}
          </View>

          {/* Description */}
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.description}
          >
            {request.description}
          </AppText>

          {/* Pet owner card */}
          <View
            style={[
              styles.ownerCard,
              {
                backgroundColor: colors.surfaceContainerHighest,
              },
            ]}
          >
            <View style={styles.ownerLeft}>
              <AppImage
                source={{ uri: request.owner.avatar }}
                style={[
                  styles.ownerAvatar,
                  { backgroundColor: colors.surfaceContainer },
                ]}
                contentFit="cover"
              />
              <View style={styles.ownerInfo}>
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  style={styles.ownerName}
                >
                  {request.owner.name}
                </AppText>
                <View style={styles.ownerStats}>
                  <View style={styles.ownerStatItem}>
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {request.owner.rating}
                    </AppText>
                    <Star
                      size={12}
                      color={colors.tertiary}
                      fill={colors.tertiary}
                    />
                  </View>
                  <View
                    style={[
                      styles.ownerStatItem,
                      { backgroundColor: colors.surfaceContainer },
                    ]}
                  >
                    <Handshake size={12} color={colors.tertiary} />
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {request.owner.handshakes}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.ownerStatItem,
                      { backgroundColor: colors.surfaceContainer },
                    ]}
                  >
                    <PawPrint size={12} color={colors.tertiary} />
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {request.owner.paws}
                    </AppText>
                  </View>
                </View>
              </View>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: request.owner.id },
                })
              }
              style={styles.viewProfileBtn}
            >
              <AppText variant="label" color={colors.primary}>
                {t("requestDetails.viewProfile")}
              </AppText>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
          />

          {/* Details section (Figma apply details) */}
          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.sectionTitle}
          >
            {t("requestDetails.details")}
          </AppText>
          <View style={styles.detailsCard}>
            <View style={styles.detailPills}>
              <DetailPill
                label={t("requestDetails.yardType")}
                value={request.details.yardType}
                colors={colors}
              />
              <DetailPill
                label={t("requestDetails.age")}
                value={request.details.age}
                colors={colors}
              />
              <DetailPill
                label={t("requestDetails.energyLevel")}
                value={request.details.energyLevel}
                colors={colors}
              />
            </View>
          </View>

          {/* Special needs */}
          <AppText
            variant="label"
            color={colors.onSurfaceVariant}
            style={styles.specialLabel}
          >
            *{t("requestDetails.specialNeeds")}
          </AppText>
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.specialText}
          >
            {request.specialNeeds}
          </AppText>
        </ScrollView>

        <View style={[styles.fixedFooter]} pointerEvents="box-none">
          <View style={styles.fixedFooterInner}>
            <Button
              label={t("requestDetails.applyNow")}
              onPress={openApplyConfirm}
              style={styles.applyBtn}
              loading={applying}
              disabled={applying || isOwner}
            />
          </View>
        </View>
      </View>

      <FeedbackModal
        visible={applyConfirmOpen}
        onRequestClose={() => !applying && setApplyConfirmOpen(false)}
        icon={<PawPrint size={24} color={colors.primary} strokeWidth={2} />}
        title={t("requestDetails.applyConfirmTitle", "Applying for this pet?")}
        description={t(
          "requestDetails.applyConfirmBody",
          "A message with your availability details will be sent to this pet’s owner",
        )}
        secondaryLabel={t("common.cancel", "Cancel")}
        onSecondary={() => !applying && setApplyConfirmOpen(false)}
        secondaryVariant="secondary"
        primaryLabel={t("common.continue", "Continue")}
        onPrimary={onApplyConfirmed}
        primaryLoading={applying}
      />
    </PageContainer>
  );
}

function DetailPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={styles.detailPillGroup}>
      <AppText
        variant="caption"
        color={colors.onSurfaceVariant}
        style={styles.pillLabel}
      >
        {label}
      </AppText>
      <View style={[styles.pillValue, { borderColor: colors.outlineVariant }]}>
        <AppText variant="caption" color={colors.onSurfaceVariant}>
          {value}
        </AppText>
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
    paddingHorizontal: 0,
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
