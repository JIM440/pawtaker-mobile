import { Colors } from "@/src/constants/colors";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PetCard } from "@/src/shared/components/cards";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { PageContainer } from "@/src/shared/components/layout";
import { FeedSkeleton } from "@/src/shared/components/skeletons";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import Slider from "@react-native-community/slider";
import { useRouter } from "expo-router";
import {
  Bell,
  EllipsisVertical,
  MapPin,
  SlidersHorizontal,
  Star,
} from "lucide-react-native";
import React, { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const MOCK_REQUESTS = [
  {
    id: "1",
    imageSource:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    petName: "Polo",
    breed: "Golden Retriever",
    petType: "Dog",
    dateRange: "Mar 14-18",
    time: "8am-4pm",
    careType: "Daytime",
    location: "B-871 13th Ave, Campbell River, BC",
    distance: "10km",
    description:
      "Polo is a friendly, high-energy Golden Retriever who thrives on activity. He is well-trained, loves long walks, and is a fetch enthusiast. Polo is great with people and looking for a companion who can keep up with his love for the outdoors!",
    caretaker: {
      id: "1",
      name: "Jane Ambers",
      rating: 4.1,
      reviewsCount: 12,
      petsCount: 17,
    },
    isFavorite: false,
  },
  {
    id: "2",
    imageSource:
      "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    petName: "Polo",
    breed: "Golden Retriever",
    petType: "Dog",
    dateRange: "Mar 14-18",
    time: "8am-4pm",
    careType: "Daytime",
    location: "B-871 13th Ave, Campbell River, BC",
    distance: "10km",
    description:
      "Polo is a friendly, high-energy Golden Retriever who thrives on activity. He is well-trained, loves long walks, and is a fetch enthusiast.",
    caretaker: {
      id: "1",
      name: "Jane Ambers",
      rating: 4.1,
      reviewsCount: 12,
      petsCount: 17,
    },
    isFavorite: true,
  },
  {
    id: "3",
    imageSource:
      "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=800",
    petName: "Luna",
    breed: "Siamese",
    petType: "Cat",
    dateRange: "Mar 21-22",
    time: "10am-2pm",
    careType: "Play/walk",
    location: "Downtown Vancouver, BC",
    distance: "4km",
    description:
      "Luna is a curious Siamese who loves gentle play and window watching. Looking for a short mid-day visit and play session.",
    caretaker: {
      id: "2",
      name: "Alice Morgan",
      rating: 4.6,
      reviewsCount: 28,
      petsCount: 3,
    },
    isFavorite: false,
  },
  {
    id: "4",
    imageSource:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800",
    petName: "Milo",
    breed: "Beagle",
    petType: "Dog",
    dateRange: "Apr 01-05",
    time: "7am-6pm",
    careType: "Daytime",
    location: "Burnaby, BC",
    distance: "12km",
    description:
      "Milo is food-motivated and friendly. Needs daytime care with two walks and a quick check-in around noon.",
    caretaker: {
      id: "3",
      name: "Clara Hudson",
      rating: 4.2,
      reviewsCount: 9,
      petsCount: 1,
    },
    isFavorite: false,
  },
];

const CARE_TYPES = ["Daytime", "Play/walk", "Overnight", "Vacation"] as const;
const MAX_DISTANCE_RANGE = { min: 1, max: 50 }; // km

function parseDistanceKm(s: string): number {
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

type FilterTab = "all" | "requests" | "takers";

type Taker = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  species: string;
  tags: string[];
  location: string;
  distance: string;
  status: "available" | "unavailable";
};

const MOCK_TAKERS: Taker[] = [
  {
    id: "t1",
    name: "Bob Majors",
    avatar:
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400",
    rating: 4.1,
    species: "Dogs",
    tags: ["Daytime", "Play/walk"],
    location: "Syracuse, New York, US",
    distance: "25km",
    status: "available",
  },
  {
    id: "t2",
    name: "James Limeb...",
    avatar:
      "https://images.unsplash.com/photo-1523419409543-3e4f83b9b4c9?w=400",
    rating: 4.1,
    species: "Dogs • Cats",
    tags: ["Daytime", "Play/walk"],
    location: "Syracuse, New York, US",
    distance: "25km",
    status: "available",
  },
  {
    id: "t3",
    name: "Alice Morgan",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    rating: 4.8,
    species: "Cats",
    tags: ["Overnight", "Medication"],
    location: "Vancouver, BC, CA",
    distance: "6km",
    status: "available",
  },
  {
    id: "t4",
    name: "Clara Hudson",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    rating: 4.5,
    species: "Dogs • Cats",
    tags: ["Daytime", "Overnight", "Play/walk"],
    location: "Burnaby, BC, CA",
    distance: "12km",
    status: "available",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["2"]));
  const [openMenuTaker, setOpenMenuTaker] = useState<Taker | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const menuButtonRefs = useRef<Record<string, View | null>>({});

  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [careTypeFilter, setCareTypeFilter] = useState<string[]>([]);
  const [maxDistanceKm, setMaxDistanceKm] = useState(MAX_DISTANCE_RANGE.max);
  const [filterDraft, setFilterDraft] = useState({
    careTypes: [] as string[],
    maxKm: MAX_DISTANCE_RANGE.max,
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredRequests = useMemo(() => {
    return MOCK_REQUESTS.filter((item) => {
      if (filter === "takers") return false;
      if (careTypeFilter.length > 0 && !careTypeFilter.includes(item.careType))
        return false;
      const distKm = parseDistanceKm(item.distance);
      if (distKm > maxDistanceKm) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.petName.toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        item.petType.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, careTypeFilter, maxDistanceKm]);

  const filteredTakers = useMemo(() => {
    return MOCK_TAKERS.filter((taker) => {
      if (filter === "requests") return false;
      if (
        careTypeFilter.length > 0 &&
        !taker.tags.some((tag) => careTypeFilter.includes(tag))
      )
        return false;
      const distKm = parseDistanceKm(taker.distance);
      if (distKm > maxDistanceKm) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        taker.name.toLowerCase().includes(q) ||
        taker.species.toLowerCase().includes(q) ||
        taker.location.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, careTypeFilter, maxDistanceKm]);

  const showRequests = filter === "all" || filter === "requests";
  const showTakers = filter === "all" || filter === "takers";

  if (loading) {
    return (
      <PageContainer>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <FeedSkeleton />
        </ScrollView>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header: PawTaker + Notifications */}
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
          onPress={() =>
            router.push("/(private)/(tabs)/(no-label)/notifications")
          }
        >
          <Bell size={24} color={colors.onSurface} />
          <View
            className="absolute -top-0.5 right-1 min-w-[12px] h-[12px] rounded-full items-center justify-center px-1"
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
      {/* Pet cards list */}
      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, gap: 8 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Search + filter (Figma-aligned styles) */}
            <View style={styles.searchFilterRow}>
              <SearchField
                containerStyle={styles.searchBar}
                placeholder={t("feed.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: colors.surfaceContainer,
                    borderColor: colors.outlineVariant,
                  },
                ]}
                hitSlop={8}
                onPress={() => {
                  setFilterDraft({
                    careTypes: [...careTypeFilter],
                    maxKm: maxDistanceKm,
                  });
                  setFilterModalOpen(true);
                }}
              >
                <SlidersHorizontal
                  size={SearchFilterStyles.searchIconSize}
                  color={colors.onSurface}
                />
              </TouchableOpacity>
            </View>

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
              <View className="flex-row items-center gap-2 mb-2">
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
              careType={item.careType}
              location={item.location}
              distance={item.distance}
              description={item.description}
              caretaker={item.caretaker}
              isFavorite={favorites.has(item.id)}
              onFavorite={() => toggleFavorite(item.id)}
              onApply={() => router.push(`/requests/${item.id}`)}
              onCaretakerPress={() =>
                router.push({
                  pathname: "/(private)/(tabs)/(no-label)/users/[id]",
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
                  <TouchableOpacity
                    key={taker.id}
                    activeOpacity={0.9}
                    onPress={() =>
                      router.push({
                        pathname: "/(private)/(tabs)/(no-label)/users/[id]",
                        params: { id: taker.id },
                      })
                    }
                    className="flex-row items-center rounded-2xl px-3 py-3"
                    style={{ backgroundColor: colors.surfaceBright }}
                  >
                    <View className="mr-3">
                      <AppImage
                        source={{ uri: taker.avatar }}
                        contentFit="cover"
                        style={[
                          styles.takerAvatar,
                          { backgroundColor: colors.surfaceContainer },
                        ]}
                      />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <AppText
                          variant="headline"
                          numberOfLines={1}
                          style={{
                            fontSize: 16,
                            letterSpacing: -0.1,
                            maxWidth: 180,
                            flexShrink: 1,
                            minWidth: 0,
                          }}
                        >
                          {taker.name}
                        </AppText>
                        <View className="flex-row items-center gap-1">
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: colors.secondaryContainer,
                            }}
                          >
                            <AppText
                              variant="caption"
                              color={colors.onSecondaryContainer}
                            >
                              Available
                            </AppText>
                          </View>
                          <TouchableOpacity
                            ref={(el) => {
                              menuButtonRefs.current[taker.id] = el;
                            }}
                            onPress={() => {
                              const btn = menuButtonRefs.current[taker.id];
                              btn?.measureInWindow((x, y, width, height) => {
                                setMenuPosition({ x, y, width, height });
                                setOpenMenuTaker(taker);
                              });
                            }}
                            hitSlop={8}
                            className="px-2 py-2"
                          >
                            <EllipsisVertical
                              size={18}
                              color={colors.onSurface}
                            />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1 mb-1">
                        <AppText variant="caption" color={colors.onSurface}>
                          {taker.rating.toFixed(1)}
                        </AppText>
                        <Star
                          size={12}
                          color={colors.onSurface}
                          fill={colors.onSurface}
                        />
                        <AppText
                          variant="caption"
                          color={colors.onSurfaceVariant}
                        >
                          {taker.species}
                        </AppText>
                      </View>

                      <View className="flex-row flex-wrap gap-1 mb-1">
                        {taker.tags.map((tag) => (
                          <View
                            key={tag}
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: colors.surfaceContainer }}
                          >
                            <AppText
                              variant="caption"
                              color={colors.onSurfaceVariant}
                            >
                              {tag}
                            </AppText>
                          </View>
                        ))}
                      </View>

                      <View className="flex-row items-center gap-1 min-w-0">
                        <MapPin size={14} color={colors.onSurfaceVariant} />
                        <AppText
                          variant="caption"
                          color={colors.onSurfaceVariant}
                          numberOfLines={1}
                          style={{ flexShrink: 1, minWidth: 0 }}
                        >
                          {taker.location}
                        </AppText>
                        <AppText
                          variant="caption"
                          color={colors.onSurfaceVariant}
                        >
                          • {taker.distance}
                        </AppText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null
        }
      />

      {/* Filter modal (Figma 1023-19359): care type + distance */}
      <Modal
        transparent
        visible={filterModalOpen}
        animationType="slide"
        onRequestClose={() => setFilterModalOpen(false)}
      >
        <Pressable
          style={styles.filterModalOverlay}
          onPress={() => setFilterModalOpen(false)}
        >
          <Pressable
            style={[
              styles.filterModalCard,
              { backgroundColor: colors.surfaceBright },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={[
                styles.filterModalHeader,
                { borderBottomColor: colors.outlineVariant },
              ]}
            >
              <AppText variant="title" color={colors.onSurface}>
                {t("filters.title")}
              </AppText>
              <TouchableOpacity
                onPress={() => setFilterModalOpen(false)}
                hitSlop={12}
                style={styles.filterModalClose}
              >
                <AppText variant="body" color={colors.primary}>
                  {t("filters.done")}
                </AppText>
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.filterModalScroll}
              showsVerticalScrollIndicator={false}
            >
              <AppText
                variant="label"
                color={colors.onSurfaceVariant}
                style={styles.filterSectionLabel}
              >
                {t("filters.careType")}
              </AppText>
              <View style={styles.filterChipRow}>
                {CARE_TYPES.map((label) => {
                  const selected = filterDraft.careTypes.includes(label);
                  return (
                    <TouchableOpacity
                      key={label}
                      activeOpacity={0.9}
                      onPress={() => {
                        setFilterDraft((d) => ({
                          ...d,
                          careTypes: selected
                            ? d.careTypes.filter((x) => x !== label)
                            : [...d.careTypes, label],
                        }));
                      }}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.surfaceContainer,
                          borderColor: selected
                            ? colors.primary
                            : colors.outlineVariant,
                        },
                      ]}
                    >
                      <AppText
                        variant="body"
                        color={selected ? colors.onPrimary : colors.onSurface}
                      >
                        {label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppText
                variant="label"
                color={colors.onSurfaceVariant}
                style={styles.filterSectionLabel}
              >
                {t("filters.maxDistance")}
              </AppText>
              <View style={styles.filterDistanceRow}>
                <Slider
                  style={styles.filterSlider}
                  minimumValue={MAX_DISTANCE_RANGE.min}
                  maximumValue={MAX_DISTANCE_RANGE.max}
                  step={1}
                  value={filterDraft.maxKm}
                  onValueChange={(v) =>
                    setFilterDraft((d) => ({ ...d, maxKm: Math.round(v) }))
                  }
                  minimumTrackTintColor={colors.primary}
                  maximumTrackTintColor={colors.outlineVariant}
                  thumbTintColor={colors.primary}
                />
                <AppText
                  variant="body"
                  color={colors.onSurface}
                  style={styles.filterDistanceValue}
                >
                  {filterDraft.maxKm} km
                </AppText>
              </View>
            </ScrollView>
            <View
              style={[
                styles.filterModalFooter,
                { borderTopColor: colors.outlineVariant },
              ]}
            >
              <Button
                label={t("filters.reset")}
                onPress={() => {
                  setFilterDraft({
                    careTypes: [],
                    maxKm: MAX_DISTANCE_RANGE.max,
                  });
                  setCareTypeFilter([]);
                  setMaxDistanceKm(MAX_DISTANCE_RANGE.max);
                }}
                variant="outline"
                style={styles.filterFooterBtn}
              />
              <Button
                label={t("filters.apply")}
                onPress={() => {
                  setCareTypeFilter(filterDraft.careTypes);
                  setMaxDistanceKm(filterDraft.maxKm);
                  setFilterModalOpen(false);
                }}
                style={styles.filterFooterBtn}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        transparent
        visible={openMenuTaker != null}
        animationType="fade"
        onRequestClose={() => setOpenMenuTaker(null)}
      >
        <Pressable
          className="flex-1 bg-black/20"
          onPress={() => setOpenMenuTaker(null)}
        >
          {menuPosition && openMenuTaker && (
            <View
              className="absolute rounded-xl border shadow-lg overflow-hidden"
              style={{
                top: menuPosition.y + menuPosition.height + 4,
                left: menuPosition.x - 160,
                width: 172,
                backgroundColor: colors.surface,
                borderColor: colors.outlineVariant,
              }}
            >
              <Pressable
                style={{ paddingHorizontal: 16, paddingVertical: 12 }}
                onPress={() => {
                  setOpenMenuTaker(null);
                  router.push(`/takers/${openMenuTaker.id}`);
                }}
              >
                <AppText variant="body" color={colors.onSurface}>
                  Send Request
                </AppText>
              </Pressable>
            </View>
          )}
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
    height: SearchFilterStyles.searchBarHeight,
    borderRadius: SearchFilterStyles.searchBarBorderRadius,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: SearchFilterStyles.searchBarPaddingHorizontal,
    paddingRight: SearchFilterStyles.searchBarPaddingRight,
    gap: SearchFilterStyles.searchBarGap,
  },
  searchInput: {
    flex: 1,
    fontSize: SearchFilterStyles.searchInputFontSize,
    paddingVertical: 0,
  },
  filterButton: {
    width: SearchFilterStyles.filterButtonSize,
    height: SearchFilterStyles.filterButtonSize,
    borderRadius: SearchFilterStyles.filterButtonBorderRadius,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabs: {
    marginBottom: 8,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
    gap: 8,
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  filterModalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  filterModalClose: {
    padding: 4,
  },
  filterModalScroll: {
    maxHeight: 320,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterSectionLabel: {
    marginBottom: 10,
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterDistanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  filterSlider: {
    flex: 1,
    height: 40,
  },
  filterDistanceValue: {
    minWidth: 48,
    textAlign: "right",
  },
  filterModalFooter: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
  },
  filterFooterBtn: {
    flex: 1,
  },
  takerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
});
