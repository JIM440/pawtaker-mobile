import { Colors } from "@/src/constants/colors";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PetCard } from "@/src/shared/components/cards";
import { PageContainer } from "@/src/shared/components/layout";
import { AppText } from "@/src/shared/components/ui/AppText";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useRouter } from "expo-router";
import { Bell, EllipsisVertical, MapPin, Search, SlidersHorizontal, Star } from "lucide-react-native";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Modal, Pressable, TextInput, TouchableOpacity, View } from "react-native";

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
    avatar: "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400",
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
    avatar: "https://images.unsplash.com/photo-1523419409543-3e4f83b9b4c9?w=400",
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
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set(["2"]));
  const [openMenuTaker, setOpenMenuTaker] = useState<Taker | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuButtonRefs = useRef<Record<string, View | null>>({});

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredRequests = MOCK_REQUESTS.filter((item) => {
    if (filter === "takers") return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.petName.toLowerCase().includes(q) ||
      item.breed.toLowerCase().includes(q) ||
      item.petType.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q)
    );
  });

  const filteredTakers = MOCK_TAKERS.filter((taker) => {
    if (filter === "requests") return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      taker.name.toLowerCase().includes(q) ||
      taker.species.toLowerCase().includes(q) ||
      taker.location.toLowerCase().includes(q)
    );
  });

  const showRequests = filter === "all" || filter === "requests";
  const showTakers = filter === "all" || filter === "takers";

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
          onPress={() => router.push("/(private)/(tabs)/(no-label)/notifications")}
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
            {/* Search + filter icon */}
            <View className="flex-row items-center gap-2 mb-2.5">
              <View
                className="flex-1 h-12 rounded-full flex-row items-center pl-5 pr-3 gap-2"
                style={{ backgroundColor: colors.surfaceContainer }}
              >
                <Search size={20} color={colors.onSurfaceVariant} />
                <TextInput
                  className="flex-1 text-xs py-3"
                  style={{ color: colors.onSurface }}
                  placeholder="Search location, care type, pet type..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.surfaceContainer }}
                hitSlop={8}
              >
                <SlidersHorizontal size={18} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Filter tabs */}
            <TabBar<FilterTab>
              tabs={[
                { key: "all", label: "All" },
                { key: "requests", label: "Requests" },
                { key: "takers", label: "Takers" },
              ]}
              activeKey={filter}
              onChange={setFilter}
              variant="pill"
              style={{ marginBottom: 8, paddingHorizontal: 0, justifyContent: "flex-start" }}
            />

            {showRequests && (
              <View className="flex-row items-center gap-2 mb-2">
                <AppText
                  variant="title"
                  style={{ fontSize: 16, letterSpacing: -0.1 }}
                >
                  Requests near you:
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {filteredRequests.length} pets in your area
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
                  Takers near you:
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {filteredTakers.length} takers available
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
                      <View className="w-[64px] h-[64px] rounded-full overflow-hidden bg-surfaceVariant" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between mb-1">
                        <AppText variant="headline" style={{ fontSize: 16, letterSpacing: -0.1 }}>
                          {taker.name}
                        </AppText>
                        <View className="flex-row items-center gap-1">
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: colors.secondaryContainer }}
                          >
                            <AppText variant="caption" color={colors.onSecondaryContainer}>
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
                            <EllipsisVertical size={18} color={colors.onSurface} />
                          </TouchableOpacity>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-1 mb-1">
                        <AppText variant="caption" color={colors.onSurface}>
                          {taker.rating.toFixed(1)}
                        </AppText>
                        <Star size={12} color={colors.onSurface} fill={colors.onSurface} />
                        <AppText variant="caption" color={colors.onSurfaceVariant}>
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
                            <AppText variant="caption" color={colors.onSurfaceVariant}>
                              {tag}
                            </AppText>
                          </View>
                        ))}
                      </View>

                      <View className="flex-row items-center gap-1">
                        <MapPin size={14} color={colors.onSurfaceVariant} />
                        <AppText
                          variant="caption"
                          color={colors.onSurfaceVariant}
                          numberOfLines={1}
                          style={{ flex: 1 }}
                        >
                          {taker.location}
                        </AppText>
                        <AppText variant="caption" color={colors.onSurfaceVariant}>
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

      <Modal
        transparent
        visible={openMenuTaker != null}
        animationType="fade"
        onRequestClose={() => setOpenMenuTaker(null)}
      >
        <Pressable className="flex-1 bg-black/20" onPress={() => setOpenMenuTaker(null)}>
          {menuPosition && openMenuTaker && (
            <View
              className="absolute rounded-xl bg-surface-container-lowest border border-outline-variant shadow-lg overflow-hidden"
              style={{
                top: menuPosition.y + menuPosition.height + 4,
                left: menuPosition.x - 160,
                width: 172,
              }}
            >
              <Pressable
                className="px-4 py-3 bg-surface-container"
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
