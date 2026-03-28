import { Colors } from "@/src/constants/colors";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { normalizeCareTypeForPoints } from "@/src/lib/points/carePoints";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { DetailPetGalleryChrome } from "@/src/shared/components/pets/DetailPetGalleryChrome";
import { PetPhotoCarousel } from "@/src/shared/components/pets/PetPhotoCarousel";
import { PetDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { ErrorState, ResourceMissingState } from "@/src/shared/components/ui";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Clock, Heart, MapPin, PawPrint } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, ScrollView, StyleSheet, View } from "react-native";

const H_PADDING = 16;
const IMAGE_HEIGHT = 216;

function localYyyyMmDd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PetDetailScreen() {
  const { id: _petId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const showToast = useToastStore((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pet, setPet] = useState<any | null>(null);
  const [owner, setOwner] = useState<any | null>(null);
  const [openRequest, setOpenRequest] = useState<any | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  const load = useCallback(async () => {
    if (!_petId) {
      setLoading(false);
      setError("Missing pet id.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: petRaw, error: petError } = await supabase
        .from("pets")
        .select("*")
        .eq("id", _petId)
        .maybeSingle();
      if (petError) throw petError;
      const petRow = petRaw as TablesRow<"pets"> | null;
      if (!petRow) {
        setPet(null);
        setOwner(null);
        setOpenRequest(null);
        setError(RESOURCE_NOT_FOUND);
        return;
      }

      const [
        { data: ownerRow, error: ownerError },
        { data: reqRows, error: reqError },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id,full_name,avatar_url,city,latitude,longitude")
          .eq("id", petRow.owner_id)
          .maybeSingle(),
        supabase
          .from("care_requests")
          .select("id,status,start_date,end_date,start_time,end_time,care_type")
          .eq("pet_id", petRow.id)
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);
      if (ownerError) throw ownerError;
      if (reqError) throw reqError;

      setPet(petRow);
      setOwner(ownerRow ?? null);
      setOpenRequest((reqRows?.[0] as any) ?? null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("common.error", "Something went wrong"),
      );
    } finally {
      setLoading(false);
    }
  }, [_petId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const parsedNotes = useMemo(() => parsePetNotes(pet?.notes), [pet?.notes]);
  const yardType = (pet as any)?.yard_type ?? parsedNotes.yardType;
  const ageRange = (pet as any)?.age_range ?? parsedNotes.ageRange;
  const energyLevel = (pet as any)?.energy_level ?? parsedNotes.energyLevel;

  const images = useMemo(() => petGalleryUrls(pet ?? {}), [pet]);

  const careTypeLabel = useMemo(() => {
    const key = normalizeCareTypeForPoints(
      openRequest?.care_type as string | undefined,
    );
    return t(`feed.careTypes.${key}`);
  }, [openRequest?.care_type, t]);

  const seekingDateRange = useMemo(() => {
    if (!openRequest?.start_date || !openRequest?.end_date) return "";
    return `${new Date(openRequest.start_date).toLocaleDateString()} - ${new Date(
      openRequest.end_date,
    ).toLocaleDateString()}`;
  }, [openRequest?.end_date, openRequest?.start_date]);

  const seekingTime = useMemo(() => {
    if (typeof openRequest?.start_time !== "string") return "";
    if (typeof openRequest?.end_time !== "string") return "";
    return `${openRequest.start_time.slice(0, 5)} - ${openRequest.end_time.slice(0, 5)}`;
  }, [openRequest?.end_time, openRequest?.start_time]);

  const canApply = useMemo(() => {
    if (!openRequest?.id) return false;
    if (!openRequest?.end_date) return true;
    const today = localYyyyMmDd(new Date());
    return String(openRequest.end_date) >= today;
  }, [openRequest?.end_date, openRequest?.id]);

  const location = owner?.city?.trim() || t("profile.noLocation");

  const ownerName =
    resolveDisplayName(owner) || t("requestDetails.owner", "Owner");

  if (loading) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
        <BackHeader title="" onBack={() => router.back()} />
        <PetDetailScreenSkeleton />
      </PageContainer>
    );
  }

  if (isResourceNotFound(error)) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
        <BackHeader title="" onBack={() => router.back()} />
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

  if (error || !pet) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
        <BackHeader title="" onBack={() => router.back()} />
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
    <PageContainer contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
    <BackHeader title={pet.name} onBack={() => router.back()} style={{}} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: openRequest?.id ? 140 : 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <DetailPetGalleryChrome onBack={() => router.back()}>
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
          ) : (
            <DetailPetGalleryChrome onBack={() => router.back()}>
              <View
                style={[
                  styles.emptyGalleryPlaceholder,
                  {
                    backgroundColor: colors.surfaceContainerHighest,
                  },
                ]}
              >
                <PawPrint size={34} color={colors.onSurfaceVariant} />
              </View>
            </DetailPetGalleryChrome>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View>
              <AppText variant="headline" style={styles.petName}>
                {pet.name}
              </AppText>
              <AppText variant="body" color={colors.onSurfaceVariant}>
                {pet.breed || t("pets.add.breed", "Breed")} •{" "}
                {pet.species || t("pets.add.kind", "Pet")}
              </AppText>
            </View>
            {openRequest ? (
              <View
                style={[
                  styles.seekingPill,
                  { backgroundColor: colors.tertiaryContainer },
                ]}
              >
                <AppText variant="caption" color={colors.onTertiaryContainer}>
                  {t("pet.detail.seeking")}
                </AppText>
              </View>
            ) : null}
          </View>

          {openRequest ? (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {seekingDateRange}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {" "}
                •{" "}
              </AppText>
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {careTypeLabel}
                </AppText>
              </View>
            </View>
          ) : (
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={{ marginBottom: 8 }}
            >
              {t(
                "pet.detail.noOpenRequest",
                "This pet doesn’t have an open care request right now.",
              )}
            </AppText>
          )}

          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.onSurfaceVariant} />
            <AppText variant="caption" color={colors.onSurfaceVariant}>
              {location}
            </AppText>
          </View>

          {/* Description */}
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.description}
          >
            {parsedNotes.bio ||
              (typeof pet?.notes === "string" ? pet.notes : "") ||
              t("post.request.noDescription", "No description yet.")}
          </AppText>

          {/* Pet owner card */}
          <View
            style={[
              styles.ownerCard,
              {
                backgroundColor: colors.surfaceContainerHighest,
                borderColor: colors.outlineVariant,
              },
            ]}
          >
            <UserAvatar uri={owner?.avatar_url} name={ownerName} size={32} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>
                {t("pet.detail.petOwner")}
              </AppText>
              <AppText variant="body" style={styles.ownerNameText}>
                {ownerName}
              </AppText>
            </View>
          </View>

          {/* Divider + detail pills + special needs */}
          <View
            style={[styles.divider, { backgroundColor: colors.outlineVariant }]}
          />

          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.sectionTitle}
          >
            {t("requestDetails.details", "Details")}
          </AppText>

          <View style={styles.detailsCard}>
            <View style={styles.detailPills}>
              <DetailPill
                label={t("requestDetails.yardType", "Yard type")}
                value={yardType ?? t("common.empty", "—")}
                colors={colors}
              />
              <DetailPill
                label={t("requestDetails.age", "Age")}
                value={ageRange ?? t("common.empty", "—")}
                colors={colors}
              />
              <DetailPill
                label={t("requestDetails.energyLevel", "Energy")}
                value={energyLevel ?? t("common.empty", "—")}
                colors={colors}
              />
            </View>
          </View>

          <AppText
            variant="label"
            color={colors.onSurfaceVariant}
            style={styles.specialLabel}
          >
            *{t("requestDetails.specialNeeds", "Special needs")}
          </AppText>
          <AppText
            variant="body"
            color={colors.onSurfaceVariant}
            style={styles.specialText}
          >
            {parsedNotes.specialNeeds ?? t("pet.detail.none", "None")}
          </AppText>
        </View>
      </ScrollView>

      {canApply ? (
        <View style={[styles.fixedFooter]} pointerEvents="box-none">
          <View style={styles.fixedFooterInner}>
            <Button
              label={t("requestDetails.applyNow", "Apply now")}
              fullWidth
              onPress={() => {
                if (blockIfKycNotApproved()) return;
                router.push({
                  pathname: "/(private)/post-requests/[id]",
                  params: { id: openRequest.id },
                });
              }}
            />
          </View>
        </View>
      ) : null}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  imageContainer: {
    width: "100%",
    minHeight: 300,
    position: "relative",
    marginBottom: 8,
  },
  emptyGalleryPlaceholder: {
    height: 300,
    marginHorizontal: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  petName: {
    fontSize: 28,
    marginBottom: 4,
  },
  seekingPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownerNameText: {
    fontWeight: "600",
    lineHeight: 20,
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
    gap: 4,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 16,
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
    borderWidth: 1,
    marginBottom: 24,
    gap: 12,
  },
  divider: {
    height: 1,
    marginVertical: 12,
    marginTop: 8,
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
    paddingBottom: 6,
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
});

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
