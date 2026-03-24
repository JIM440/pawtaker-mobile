import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { blockIfKycNotApproved, isKycApproved } from "@/src/lib/kyc/kyc-gate";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { supabase } from "@/src/lib/supabase/client";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PetCard, TakerCard } from "@/src/shared/components/cards";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { KycPromptModal } from "@/src/shared/components/kyc/KycPromptModal";
import { PageContainer } from "@/src/shared/components/layout";
import { FeedSkeleton } from "@/src/shared/components/skeletons";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { DataState } from "@/src/shared/components/ui";
import {
  CARE_TYPE_KEYS,
  type CareTypeKey,
} from "@/src/shared/components/ui/CareTypeSelector";
import { RangeSlider } from "@/src/shared/components/ui/RangeSlider";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useRouter } from "expo-router";
import {
  Bell,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react-native";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


/** Inclusive km range for feed filter (0 = no minimum). */
const DISTANCE_MIN_KM = 0;
const DISTANCE_MAX_KM = 50;

function parseDistanceKm(s: string): number {
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function clampKm(n: number): number {
  return Math.max(DISTANCE_MIN_KM, Math.min(DISTANCE_MAX_KM, Math.round(n)));
}

type FilterTab = "all" | "requests" | "takers";

type Taker = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  species: string;
  tags: CareTypeKey[];
  location: string;
  distance: string;
  status: "available" | "unavailable";
};

function isMissingBackendResourceError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  if (maybe.code === "42P01") return true;
  const message = (maybe.message || "").toLowerCase();
  return message.includes("does not exist") || message.includes("relation");
}


export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [takers, setTakers] = useState<Taker[]>([]);
  const [userPets, setUserPets] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [openMenuTaker, setOpenMenuTaker] = useState<Taker | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [sendRequestOpen, setSendRequestOpen] = useState(false);
  const [selectedSeekingPet, setSelectedSeekingPet] = useState<any | null>(null);
  const loadHomeData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: reqData, error: reqError }, { data: usersData, error: usersError }, { data: myPets, error: petsError }] =
        await Promise.all([
          supabase.from("care_requests").select("*").eq("status", "open"),
          supabase.from("users").select("*").neq("id", user.id).eq("kyc_status", "approved"),
          supabase.from("pets").select("*").eq("owner_id", user.id),
        ]);
      if (reqError && !isMissingBackendResourceError(reqError)) throw reqError;
      if (usersError && !isMissingBackendResourceError(usersError)) throw usersError;
      if (petsError && !isMissingBackendResourceError(petsError)) throw petsError;

      const ownerIds = Array.from(new Set((reqData ?? []).map((r: any) => r.owner_id)));
      const petIds = Array.from(new Set((reqData ?? []).map((r: any) => r.pet_id)));

      const [{ data: owners, error: ownersError }, { data: requestPets, error: requestPetsError }] = await Promise.all([
        ownerIds.length
          ? supabase.from("users").select("id,full_name,city").in("id", ownerIds)
          : Promise.resolve({ data: [] } as any),
        petIds.length
          ? supabase.from("pets").select("*").in("id", petIds)
          : Promise.resolve({ data: [] } as any),
      ]);
      if (ownersError && !isMissingBackendResourceError(ownersError)) throw ownersError;
      if (requestPetsError && !isMissingBackendResourceError(requestPetsError)) throw requestPetsError;
      const ownersById = (owners ?? []).reduce((acc: any, o: any) => ({ ...acc, [o.id]: o }), {});
      const petsById = (requestPets ?? []).reduce((acc: any, p: any) => ({ ...acc, [p.id]: p }), {});

      setRequests(
        (reqData ?? []).map((r: any) => {
          const pet = petsById[r.pet_id];
          const owner = ownersById[r.owner_id];
          return {
            id: r.id,
            imageSource: pet?.avatar_url ?? "",
            petName: pet?.name ?? "Pet",
            breed: pet?.breed ?? "Unknown breed",
            petType: pet?.species ?? "Pet",
            dateRange:
              r.start_date && r.end_date
                ? `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}`
                : "",
            time: "",
            careTypeKey:
              r.care_type === "walking"
                ? ("playwalk" as CareTypeKey)
                : r.care_type === "boarding"
                  ? ("overnight" as CareTypeKey)
                  : ("daytime" as CareTypeKey),
            location: owner?.city ?? "Location not set",
            distance: "0km",
            description: r.description ?? pet?.notes ?? "No description yet.",
            caretaker: {
              id: owner?.id ?? "",
              name: owner?.full_name ?? "Owner",
              rating: 0,
              reviewsCount: 0,
              petsCount: 0,
            },
          };
        }),
      );

      setTakers(
        (usersData ?? []).map((u: any) => ({
          id: u.id,
          name: u.full_name || "User",
          avatar: u.avatar_url || "",
          rating: 0,
          species: "Pets",
          tags: ["daytime"],
          location: u.city || "Location not set",
          distance: "0km",
          status: "available" as const,
        })),
      );
      setUserPets(myPets ?? []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load home data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHomeData();
  }, [user?.id]);
  const [takerForSendRequest, setTakerForSendRequest] = useState<Taker | null>(
    null,
  );

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showKycPrompt, setShowKycPrompt] = useState(false);
  const [careTypeFilter, setCareTypeFilter] = useState<string[]>([]);
  const [distanceRange, setDistanceRange] = useState({
    min: DISTANCE_MIN_KM,
    max: DISTANCE_MAX_KM,
  });
  const [filterDraft, setFilterDraft] = useState({
    careTypes: [] as string[],
    minKm: DISTANCE_MIN_KM,
    maxKm: DISTANCE_MAX_KM,
  });

  React.useEffect(() => {
    if (!profile) return;
    if (!isKycApproved(profile.kyc_status)) {
      setShowKycPrompt(true);
    } else {
      setShowKycPrompt(false);
    }
  }, [profile]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    const resetValue = {
      careTypes: [] as string[],
      minKm: DISTANCE_MIN_KM,
      maxKm: DISTANCE_MAX_KM,
    };
    setFilterDraft(resetValue);
    setCareTypeFilter([]);
    setDistanceRange({ min: resetValue.minKm, max: resetValue.maxKm });
  };

  const commitFilters = (draft: typeof filterDraft, closePanel: boolean) => {
    const lo = Math.min(draft.minKm, draft.maxKm);
    const hi = Math.max(draft.minKm, draft.maxKm);
    const next = { min: clampKm(lo), max: clampKm(hi) };

    // Commit to the active filters that drive the results list.
    setCareTypeFilter([...draft.careTypes]);
    setDistanceRange(next);
    setFilterDraft({
      careTypes: [...draft.careTypes],
      minKm: next.min,
      maxKm: next.max,
    });

    if (closePanel) setFilterPanelOpen(false);
  };

  const applyFilters = () => commitFilters(filterDraft, true);

  const toggleCareTypeAndApply = (key: string) => {
    const selected = filterDraft.careTypes.includes(key);
    const nextCareTypes = selected
      ? filterDraft.careTypes.filter((x) => x !== key)
      : [...filterDraft.careTypes, key];

    // Apply immediately when user taps a care type pill.
    commitFilters(
      {
        ...filterDraft,
        careTypes: nextCareTypes,
      },
      false,
    );
  };

  const setDraftMinKmFromText = (text: string) => {
    const raw = text.replace(/[^0-9]/g, "");
    if (raw === "") {
      setFilterDraft((d) => ({ ...d, minKm: DISTANCE_MIN_KM }));
      return;
    }
    const n = clampKm(parseInt(raw, 10));
    setFilterDraft((d) => ({
      ...d,
      minKm: Math.min(n, d.maxKm),
    }));
  };

  const setDraftMaxKmFromText = (text: string) => {
    const raw = text.replace(/[^0-9]/g, "");
    if (raw === "") {
      setFilterDraft((d) => ({ ...d, maxKm: DISTANCE_MAX_KM }));
      return;
    }
    const n = clampKm(parseInt(raw, 10));
    setFilterDraft((d) => ({
      ...d,
      maxKm: Math.max(n, d.minKm),
    }));
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      if (filter === "takers") return false;
      if (
        careTypeFilter.length > 0 &&
        !careTypeFilter.includes(item.careTypeKey)
      )
        return false;
      const distKm = parseDistanceKm(item.distance);
      if (distKm < distanceRange.min || distKm > distanceRange.max) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.petName.toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        item.petType.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, careTypeFilter, distanceRange, requests]);

  const filteredTakers = useMemo(() => {
    return takers.filter((taker) => {
      if (filter === "requests") return false;
      if (
        careTypeFilter.length > 0 &&
        !taker.tags.some((tag) => careTypeFilter.includes(tag))
      )
        return false;
      const distKm = parseDistanceKm(taker.distance);
      if (distKm < distanceRange.min || distKm > distanceRange.max) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        taker.name.toLowerCase().includes(q) ||
        taker.species.toLowerCase().includes(q) ||
        taker.location.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, careTypeFilter, distanceRange, takers]);

  const showRequests = filter === "all" || filter === "requests";
  const showTakers = filter === "all" || filter === "takers";
  const HomeHeader = (
    <View className="flex-row items-center justify-between pb-3">
      <AppText
        variant="headline"
        style={{ fontSize: 22, letterSpacing: -0.1 }}
      >
        {t("app.name")}
      </AppText>
      <TouchableOpacity
        className="relative pr-3"
        hitSlop={12}
        onPress={() => router.push("/(private)/(tabs)/(home)/notifications")}
      >
        <Bell size={24} color={colors.onSurface} />
        <View
          className="absolute bottom-4 right-1 min-w-[16px] h-[16px] rounded-full items-center justify-center px-1"
          style={{ backgroundColor: colors.primary }}
        >
          <AppText
            variant="caption"
            color={colors.onPrimary}
            style={{ fontSize: 10, lineHeight: 12 }}
          >
            5
          </AppText>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <PageContainer>
        {HomeHeader}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <FeedSkeleton />
        </ScrollView>
      </PageContainer>
    );
  }

  if (loadError) {
    return (
      <PageContainer>
        {HomeHeader}
        <DataState
          title={t("common.error", "Something went wrong")}
          message={loadError}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void loadHomeData();
          }}
          mode="full"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {HomeHeader}
      {/* Pet cards list */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <>
            {/* Search + filter (Figma-aligned styles) */}
            <View style={styles.searchFilterRow}>
              <SearchField
                containerStyle={styles.searchBar}
                placeholder={t("feed.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                rightSlot={<Search size={20} color={colors.onSurfaceVariant} />}
              />
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: colors.surfaceContainerHighest,
                    borderWidth: filterPanelOpen ? 2 : 0,
                    borderColor: filterPanelOpen
                      ? colors.primary
                      : "transparent",
                  },
                ]}
                hitSlop={8}
                onPress={() => {
                  if (!filterPanelOpen) {
                    setFilterDraft({
                      careTypes: [...careTypeFilter],
                      minKm: distanceRange.min,
                      maxKm: distanceRange.max,
                    });
                  }
                  setFilterPanelOpen((o) => !o);
                }}
              >
                <SlidersHorizontal
                  size={SearchFilterStyles.searchIconSize}
                  color={colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            {/* Inline filter panel (Figma: sheet-style, not centered modal) */}
            {filterPanelOpen ? (
              <View
                style={[
                  styles.filterInlinePanel,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                <View style={[styles.filterPanelHeader]}>
                  <AppText variant="body" color={colors.onSurfaceVariant}>
                    {t("filters.title")}
                  </AppText>
                  <TouchableOpacity
                    onPress={resetFilters}
                    hitSlop={12}
                    style={styles.filterPanelHeaderBtn}
                  >
                    <AppText
                      variant="body"
                      color={colors.primary}
                      style={{ textDecorationLine: "underline" }}
                    >
                      {t("filters.reset")}
                    </AppText>
                  </TouchableOpacity>
                </View>

                <View style={styles.filterPanelBody}>
                  <AppText
                    variant="label"
                    color={colors.onSurfaceVariant}
                    style={styles.filterSectionLabel}
                  >
                    {t("filters.careType")}
                  </AppText>
                  <View style={styles.filterCareTypesBlock}>
                    <View style={styles.careTypePillsRow}>
                      {CARE_TYPE_KEYS.map((key) => {
                        const active = filterDraft.careTypes.includes(key);
                        return (
                          <TouchableOpacity
                            key={key}
                            activeOpacity={0.9}
                            onPress={() => toggleCareTypeAndApply(key)}
                            style={[
                              styles.careTypePill,
                              {
                                borderColor: active
                                  ? colors.primary
                                  : colors.outlineVariant,
                              },
                            ]}
                          >
                            <AppText
                              variant="label"
                              color={
                                active
                                  ? colors.primary
                                  : colors.onSurfaceVariant
                              }
                              style={styles.careTypePillLabel}
                            >
                              {t(`feed.careTypes.${key}`)}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <AppText
                    variant="label"
                    color={colors.onSurfaceVariant}
                    style={styles.filterSectionLabel}
                  >
                    {t("filters.distanceRange")}
                  </AppText>

                  <View style={styles.distanceInputsRow}>
                    <View
                      style={[
                        styles.distanceCard,
                        {
                          backgroundColor: colors.surfaceContainerHighest,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                        style={styles.distanceCardLabel}
                      >
                        {t("filters.minKm")}
                      </AppText>
                      <TextInput
                        value={String(filterDraft.minKm)}
                        onChangeText={setDraftMinKmFromText}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor={colors.onSurfaceVariant}
                        style={[
                          styles.distanceCardInput,
                          {
                            color: colors.onSurface,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.distanceDash}>
                      <AppText
                        variant="title"
                        color={colors.onSurfaceVariant}
                        style={styles.distanceDashText}
                      >
                        -
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.distanceCard,
                        {
                          backgroundColor: colors.surfaceContainerHighest,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                        style={styles.distanceCardLabel}
                      >
                        {t("filters.maxKm")}
                      </AppText>
                      <TextInput
                        value={String(filterDraft.maxKm)}
                        onChangeText={setDraftMaxKmFromText}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="50"
                        placeholderTextColor={colors.onSurfaceVariant}
                        style={[
                          styles.distanceCardInput,
                          {
                            color: colors.onSurface,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <RangeSlider
                    min={DISTANCE_MIN_KM}
                    max={DISTANCE_MAX_KM}
                    values={[filterDraft.minKm, filterDraft.maxKm]}
                    onValuesChange={([minv, maxv]: [number, number]) =>
                      setFilterDraft((d) => ({
                        ...d,
                        minKm: minv,
                        maxKm: maxv,
                      }))
                    }
                  />
                </View>
              </View>
            ) : null}

            {/* Filter tabs */}
            <TabBar<FilterTab>
              tabs={[
                { key: "all", label: t("feed.filterAll") },
                { key: "requests", label: t("feed.filterRequests") },
                { key: "takers", label: t("feed.filterTakers") },
              ]}
              activeKey={filter}
              onChange={setFilter}
              variant="pill"
              style={styles.filterTabs}
            />

            {showRequests && (
              <View style={styles.resultsHeader}>
                {careTypeFilter.length > 0 ||
                distanceRange.min > DISTANCE_MIN_KM ||
                distanceRange.max < DISTANCE_MAX_KM ? (
                  <View style={styles.resultsRow}>
                    <AppText variant="title" style={{ fontSize: 16 }}>
                      {t("feed.resultsLabel")}:{" "}
                    </AppText>
                    <AppText
                      variant="body"
                      color={colors.onSurfaceVariant}
                      style={{ fontWeight: "600", flex: 1, flexShrink: 1 }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {[
                        ...careTypeFilter.map((k) => t(`feed.careTypes.${k}`)),
                        t("feed.distanceKmRange", {
                          min: distanceRange.min,
                          max: distanceRange.max,
                        }),
                      ].join(", ")}
                    </AppText>
                  </View>
                ) : (
                  <View className="flex-row items-center gap-2">
                    <AppText
                      variant="title"
                      style={{ fontSize: 16, letterSpacing: -0.1 }}
                    >
                      {t("feed.requestsNearYou")}
                    </AppText>
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {filteredRequests.length} {t("feed.petsInArea")}
                    </AppText>
                  </View>
                )}
              </View>
            )}
          </>
        }
        renderItem={({ item }) =>
          showRequests ? (
            <PetCard
              imageSource={item.imageSource}
              petName={item.petName}
              breed={item.breed}
              petType={item.petType}
              dateRange={item.dateRange}
              time={item.time}
              careType={t(`feed.careTypes.${item.careTypeKey}`)}
              location={item.location}
              distance={item.distance}
              description={item.description}
              caretaker={item.caretaker}
              isFavorite={favorites.has(item.id)}
              onFavorite={() => toggleFavorite(item.id)}
              onApply={() => {
                if (blockIfKycNotApproved()) return;
                router.push(`/(private)/post-requests/${item.id}` as any);
              }}
              onPress={() => router.push(`/(private)/pets/${item.id}` as any)}
              onCaretakerPress={() =>
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: item.caretaker.id ?? "1" },
                })
              }
            />
          ) : null
        }
        ListFooterComponent={
          showTakers ? (
            <View className="mt-6">
              <View className="flex-row items-center gap-2 mb-3">
                <AppText
                  variant="title"
                  style={{ fontSize: 16, letterSpacing: -0.1 }}
                >
                  {t("feed.takersNearYou")}
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {filteredTakers.length} {t("feed.takersAvailable")}
                </AppText>
              </View>

              <View className="gap-3">
                {filteredTakers.map((taker) => (
                  <TakerCard
                    key={taker.id}
                    taker={{
                      ...taker,
                      tags: taker.tags.map((tag) => t(`feed.careTypes.${tag}`)),
                    }}
                    onPress={() =>
                      router.push({
                        pathname: "/(private)/(tabs)/profile/users/[id]",
                        params: { id: taker.id },
                      })
                    }
                    onMenuPress={(ref) => {
                      ref?.measureInWindow(
                        (x: number, y: number, width: number, height: number) => {
                          setMenuPosition({ x, y, width, height });
                          setOpenMenuTaker(taker);
                        },
                      );
                    }}
                  />
                ))}
              </View>
            </View>
          ) : null
        }
      />

      <KycPromptModal
        visible={showKycPrompt}
        onClose={() => setShowKycPrompt(false)}
      />

      <Modal
        transparent
        visible={openMenuTaker != null}
        animationType="fade"
        onRequestClose={() => setOpenMenuTaker(null)}
      >
        <Pressable
          className="flex-1"
          onPress={() => setOpenMenuTaker(null)}
        >
          {menuPosition && openMenuTaker && (
            <View
              style={{
                top: menuPosition.y + menuPosition.height + 4,
                left: menuPosition.x - 160,
                width: 172,
                backgroundColor: colors.surfaceContainerLowest,
                borderColor: colors.outlineVariant,
                borderRadius: 12,
                borderWidth: 1,
                overflow: "hidden",
                elevation: 4,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
              }}
            >
              <Pressable
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.outlineVariant,
                }}
                onPress={() => {
                  setOpenMenuTaker(null);
                  router.push({
                    pathname: "/(private)/(tabs)/profile/users/[id]",
                    params: { id: openMenuTaker.id },
                  });
                }}
              >
                <AppText variant="body" color={colors.onSurface}>
                  {t("common.viewProfile", "View Profile")}
                </AppText>
              </Pressable>
              <Pressable
                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                onPress={() => {
                  setTakerForSendRequest(openMenuTaker);
                  setOpenMenuTaker(null);
                  setSelectedSeekingPet(null);
                  setSendRequestOpen(true);
                }}
              >
                <AppText variant="body" color={colors.onSurface}>
                  {t("common.sendRequest", "Send Request")}
                </AppText>
              </Pressable>
            </View>
          )}
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={sendRequestOpen}
        animationType="fade"
        onRequestClose={() => setSendRequestOpen(false)}
      >
        <Pressable
          style={styles.sendRequestOverlay}
          onPress={() => setSendRequestOpen(false)}
        >
          <View
            style={[
              styles.sendRequestCard,
              { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant },
            ]}
          >
            <AppText
              variant="title"
              color={colors.onSurface}
              style={styles.sendRequestTitle}
            >
              Select a pet you are seeking
            </AppText>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.sendRequestListContent}
            >
              {userPets.map((pet) => {
                const selected = selectedSeekingPet?.id === pet.id;
                return (
                  <TouchableOpacity
                    key={pet.id}
                    activeOpacity={0.9}
                    onPress={() => setSelectedSeekingPet(pet)}
                    style={[
                      styles.petPickRow,
                      {
                        backgroundColor: selected
                          ? colors.surfaceContainerHighest
                          : colors.surfaceContainerLow,
                        borderColor: selected
                          ? colors.primary
                          : colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <AppText
                        variant="headline"
                        color={colors.onSurface}
                        style={{ fontSize: 16, letterSpacing: -0.1 }}
                        numberOfLines={1}
                      >
                        {pet.name}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                        numberOfLines={1}
                      >
                        {pet.species || "Pet"} • {pet.breed || "Unknown breed"}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sendRequestFooter}>
              <Button
                label={t("common.sendRequest", "Send request")}
                onPress={() => {
                  if (!selectedSeekingPet || !takerForSendRequest) return;
                  setSendRequestOpen(false);
                  router.push({
                    pathname: "/(private)/(tabs)/messages/[threadId]" as any,
                    params: {
                      threadId: "1",
                      mode: "seeking",
                      petName: selectedSeekingPet.petName,
                      breed: selectedSeekingPet.breed ?? "",
                      date: selectedSeekingPet.seekingDateRange || "Mar 14-18",
                      time: selectedSeekingPet.seekingTime || "8am-4pm",
                      price: "25 pts/hr",
                      offerId: selectedSeekingPet.id,
                    } as any,
                  });
                }}
                disabled={
                  !selectedSeekingPet || !takerForSendRequest || userPets.length === 0
                }
                fullWidth
              />
            </View>
          </View>
        </Pressable>
      </Modal>
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: SearchFilterStyles.filterButtonSize,
    height: SearchFilterStyles.filterButtonSize,
    borderRadius: SearchFilterStyles.filterButtonBorderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabs: {
    marginBottom: 8,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
    gap: 8,
  },
  resultsHeader: {
    marginBottom: 8,
  },
  resultsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  filterInlinePanel: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    maxHeight: 480,
    flex: 1,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterPanelHeaderBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  filterPanelBody: {
    paddingHorizontal: 16,
  },
  filterSectionLabel: {
    marginBottom: 10,
  },
  filterCareTypesBlock: {
    marginBottom: 20,
  },
  careTypePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  careTypePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  careTypePillLabel: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  distanceInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  distanceCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  distanceInputCol: {
    flex: 1,
  },
  distanceCardLabel: {
    marginBottom: 10,
    fontWeight: "600",
  },
  distanceCardInput: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600",
  },
  distanceDash: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  distanceDashText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "600",
  },
  filterPanelFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  takerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  sendRequestOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  sendRequestCard: {
    width: "92%",
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: "70%",
    overflow: "hidden",
  },
  sendRequestTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sendRequestListContent: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 10,
  },
  petPickRow: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sendRequestFooter: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "transparent",
  },
});
