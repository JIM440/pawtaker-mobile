import { Colors } from "@/src/constants/colors";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { normalizeCareTypeForPoints } from "@/src/lib/points/carePoints";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { useThemeStore } from "@/src/lib/store/theme.store";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { supabase } from "@/src/lib/supabase/client";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { DetailPetGalleryChrome } from "@/src/shared/components/pets/DetailPetGalleryChrome";
import { PetPhotoCarousel } from "@/src/shared/components/pets/PetPhotoCarousel";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { PetDetailScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { DataState, ResourceMissingState } from "@/src/shared/components/ui";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useToastStore } from "@/src/lib/store/toast.store";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, Clock, MapPin, PawPrint } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollView, StyleSheet, View } from "react-native";

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

      const [{ data: ownerRow, error: ownerError }, { data: reqRows, error: reqError }] =
        await Promise.all([
          supabase
            .from("users")
            .select("id,full_name,avatar_url,city,latitude,longitude")
            .eq("id", petRow.owner_id)
            .maybeSingle(),
          supabase
            .from("care_requests")
            .select("id,status,start_date,end_date,care_type")
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
      setError(err instanceof Error ? err.message : t("common.error", "Something went wrong"));
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

  const images = useMemo(() => petGalleryUrls(pet ?? {}), [pet]);

  const careTypeLabel = useMemo(() => {
    const key = normalizeCareTypeForPoints(openRequest?.care_type as string | undefined);
    return t(`feed.careTypes.${key}`);
  }, [openRequest?.care_type, t]);

  const seekingDateRange = useMemo(() => {
    if (!openRequest?.start_date || !openRequest?.end_date) return "";
    return `${new Date(openRequest.start_date).toLocaleDateString()} - ${new Date(
      openRequest.end_date,
    ).toLocaleDateString()}`;
  }, [openRequest?.end_date, openRequest?.start_date]);

  const location = owner?.city?.trim() || t("profile.noLocation");

  const ownerName = resolveDisplayName(owner) || t("requestDetails.owner", "Owner");

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
            router.replace("/(private)/(tabs)/(home)" as Parameters<typeof router.replace>[0])
          }
        />
      </PageContainer>
    );
  }

  if (error || !pet) {
    return (
      <PageContainer contentStyle={{ paddingHorizontal: 0 }}>
        <BackHeader title="" onBack={() => router.back()} />
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
    <PageContainer contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          {images.length > 0 ? (
            <DetailPetGalleryChrome onBack={() => router.back()}>
              <PetPhotoCarousel
                urls={images}
                height={300}
                horizontalInset={16}
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
              <AppText variant="headline" style={styles.petName}>{pet.name}</AppText>
              <AppText variant="body" color={colors.onSurfaceVariant}>
                {pet.breed || t("pets.add.breed", "Breed")} • {pet.species || t("pets.add.kind", "Pet")}
              </AppText>
            </View>
            {openRequest ? (
              <View style={[styles.seekingPill, { backgroundColor: colors.tertiaryContainer }]}>
                <AppText variant="caption" color={colors.onTertiaryContainer}>{t("pet.detail.seeking")}</AppText>
              </View>
            ) : null}
          </View>

          {openRequest ? (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>{seekingDateRange}</AppText>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.onSurfaceVariant} />
                <AppText variant="caption" color={colors.onSurfaceVariant}>{careTypeLabel}</AppText>
              </View>
            </View>
          ) : (
            <AppText variant="caption" color={colors.onSurfaceVariant} style={{ marginBottom: 8 }}>
              {t("pet.detail.noOpenRequest", "This pet doesn’t have an open care request right now.")}
            </AppText>
          )}

          <View style={styles.locationRow}>
            <MapPin size={16} color={colors.onSurfaceVariant} />
            <AppText variant="caption" color={colors.onSurfaceVariant}>{location}</AppText>
          </View>

          <View style={styles.section}>
            <AppText variant="title" style={styles.sectionTitle}>{t("pet.detail.about", { name: pet.name })}</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant} style={styles.bio}>
              {parsedNotes.bio ||
                pet.notes ||
                t("post.request.noDescription", "No description yet.")}
            </AppText>
          </View>

          {parsedNotes.attributeTags.length ? (
            <View style={styles.section}>
              <AppText variant="label" color={colors.onSurfaceVariant} style={styles.sectionLabel}>{t("pet.detail.attributes")}</AppText>
              <View style={styles.tagsContainer}>
                {parsedNotes.attributeTags.map(tag => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceContainerHighest }]}>
                    <AppText variant="caption" color={colors.onSurface}>{tag}</AppText>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText variant="label" color={colors.onSurfaceVariant} style={styles.sectionLabel}>{t("pet.detail.specialNeeds")}</AppText>
            <AppText variant="body" color={colors.onSurfaceVariant}>
              {parsedNotes.specialNeeds || t("pet.detail.none", "None")}
            </AppText>
          </View>

          {/* Caretaker Info */}
          <View style={[styles.caretakerCard, { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant }]}>
            <UserAvatar uri={owner?.avatar_url} name={ownerName} size={48} />
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={colors.onSurfaceVariant}>{t("pet.detail.petOwner")}</AppText>
              <AppText variant="body" style={{ fontWeight: '600' }}>{ownerName}</AppText>
            </View>
            <Button
              label={t("common.viewProfile")}
              variant="outline"
              size="sm"
              disabled={!owner?.id}
              onPress={() =>
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: owner.id },
                })
              }
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t("pet.detail.helpWithPet")}
          fullWidth
          disabled={!openRequest?.id}
          onPress={() => {
            if (!openRequest?.id) {
              showToast({
                variant: "info",
                message: t("pet.detail.noOpenRequest", "This pet doesn’t have an open care request right now."),
                durationMs: 2600,
              });
              return;
            }
            if (blockIfKycNotApproved()) return;
            router.push({
              pathname: "/(private)/post-requests/[id]",
              params: { id: openRequest.id },
            });
          }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  metaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  sectionLabel: {
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 10,
  },
  bio: {
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  caretakerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginTop: 12,
  },
  caretakerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  }
});
