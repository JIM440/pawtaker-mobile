import { Colors } from "@/src/constants/colors";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { PageContainer } from "@/src/shared/components/layout";
import { BackHeader } from "@/src/shared/components/layout/BackHeader";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
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
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const H_PADDING = 16;
const IMAGE_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const IMAGE_HEIGHT = 216;

const MOCK_REQUEST = {
  id: "1",
  images: [
    "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    "https://images.unsplash.com/photo-1583512603805-3cc6b41a3ec0?w=800",
    "https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800",
  ],
  petName: "Polo",
  breed: "Golden Retriever",
  petType: "Dog",
  dateRange: "Mar 14-Mar 18",
  time: "8am-4pm",
  careType: "Daytime",
  location: "Lake Placid, New York, US",
  distance: "5km",
  description:
    "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained and a great entertainer. Loves people and other pets",
  owner: {
    id: "1",
    name: "Jane Ambers",
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200",
    rating: 4.1,
    handshakes: 12,
    paws: 17,
  },
  details: {
    yardType: "fenced yard",
    age: "3-8 yrs",
    energyLevel: "medium energy",
  },
  specialNeeds:
    "Needs insulin shots twice a day or is very shy around loud noises. Strictly no human food; tends to eat grass if not watched. Needs insulin shots twice a day or is very shy around loud noises.",
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const request = MOCK_REQUEST;
  const imageCount = request.images.length;

  const onApplyNow = () => {
    if (blockIfKycNotApproved()) return;
    // Navigate to chat with an "Applying for ..." request card.
    // Thread screen reads these params to render the correct message card.
    router.push({
      pathname: "/(private)/(tabs)/messages/[threadId]" as any,
      params: {
        threadId: "1",
        mode: "applying",
        petName: request.petName,
        breed: request.breed,
        date: request.dateRange,
        time: request.time,
        price: "25 pts/hr",
        offerId: id ?? "1",
      } as any,
    });
  };

  return (
    <PageContainer>
      <BackHeader className="pl-0 pt-0" title="" onBack={() => router.back()} />
      <View style={styles.screenWrap}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Image carousel */}
          <View style={styles.carouselWrap}>
            <FlatList
              data={request.images}
              horizontal
              pagingEnabled
              snapToInterval={SCREEN_WIDTH}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const i = Math.round(
                  e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                );
                setCurrentImageIndex(i);
              }}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    setCurrentImageIndex(index);
                  }}
                  style={styles.carouselItem}
                >
                  <AppImage
                    source={{ uri: item }}
                    style={[styles.carouselImage, { width: IMAGE_WIDTH }]}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(_, i) => String(i)}
            />
            <View style={styles.slideIndicator}>
              <View
                style={[
                  styles.slideBadge,
                  { backgroundColor: colors.surfaceContainerHighest },
                ]}
              >
                <AppText variant="caption" color={colors.onSurface}>
                  {currentImageIndex + 1}/{imageCount}
                </AppText>
              </View>
            </View>
            <View style={styles.dots}>
              {request.images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.surfaceContainerLowest },
                    i === currentImageIndex && styles.dotActive,
                    i !== currentImageIndex && styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Pet name, breed, favorite */}
          <View style={styles.nameRow}>
            <View style={styles.nameBreedRow}>
              <AppText
                variant="headline"
                color={colors.onSurface}
                style={styles.petName}
              >
                {request.petName}
              </AppText>
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
              onPress={onApplyNow}
              style={styles.applyBtn}
            />
          </View>
        </View>
      </View>
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
  carouselWrap: {
    width: SCREEN_WIDTH,
    marginLeft: -H_PADDING,
    marginBottom: 8,
    position: "relative",
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    alignItems: "center",
  },
  carouselImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 16,
  },
  slideIndicator: {
    position: "absolute",
    top: 18,
    right: H_PADDING + 10,
  },
  slideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dots: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 28,
  },
  dotActive: {
    opacity: 1,
  },
  dotInactive: {
    opacity: 0.6,
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
