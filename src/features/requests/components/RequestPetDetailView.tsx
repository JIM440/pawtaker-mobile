import { PetDetailPill } from "@/src/features/pets/components/PetDetailPill";
import { PetDetailHeaderSection } from "@/src/shared/components/pets/PetDetailHeaderSection";
import { PetPhotoCarousel } from "@/src/shared/components/pets/PetPhotoCarousel";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { Handshake, PawPrint, Star } from "lucide-react-native";
import React from "react";
import { Platform, ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

const H_PADDING = 16;
const IMAGE_HEIGHT = 216;

type RequestLike = {
  petName: string;
  breed: string;
  petType: string;
  dateRange: string;
  time: string;
  careType: string;
  location: string;
  distance: string;
  description: string;
  owner: {
    id: string;
    name: string;
    avatar: string;
    rating: number;
    handshakes: number;
    paws: number;
  };
  details: {
    yardType: string;
    age: string;
    energyLevel: string;
  };
  specialNeeds: string;
};

type Props = {
  colors: any;
  t: (key: string, fallback?: string) => string;
  images: string[];
  request: RequestLike;
  isOwner: boolean;
  isFavorite: boolean;
  favoriteDisabled?: boolean;
  onFavoritePress?: () => void;
  onPetNamePress?: () => void;
  onViewProfile: () => void;
  topNotice?: string | null;
  apply?: {
    visible: boolean;
    label: string;
    onPress: () => void;
    loading?: boolean;
    disabled?: boolean;
  };
};

export function RequestPetDetailView({
  colors,
  t,
  images,
  request,
  isOwner,
  isFavorite,
  favoriteDisabled = false,
  onFavoritePress,
  onPetNamePress,
  onViewProfile,
  topNotice,
  apply,
}: Props) {
  return (
    <View style={styles.screenWrap}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <PetPhotoCarousel
          urls={images}
          height={IMAGE_HEIGHT}
          horizontalInset={H_PADDING}
          imageBorderRadius={16}
          showCounterBadge={false}
          dotsVariant="onImage"
          showSegmentProgressBar={false}
          style={{ marginBottom: 8 }}
        />

        <PetDetailHeaderSection
          colors={colors}
          petName={request.petName}
          breed={request.breed}
          petType={request.petType}
          dateRange={request.dateRange}
          time={request.time}
          careType={request.careType}
          location={request.location}
          distance={request.distance}
          description={request.description}
          showFavorite={!isOwner}
          isFavorite={isFavorite}
          favoriteDisabled={favoriteDisabled}
          onFavoritePress={onFavoritePress}
          onNamePress={onPetNamePress}
        />

        {topNotice ? (
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={styles.topNotice}
          >
            {topNotice}
          </AppText>
        ) : null}

        <View style={styles.contentPad}>
          <View
            style={[
              styles.ownerCard,
              {
                backgroundColor: colors.surfaceContainerHighest,
              },
            ]}
          >
            <View style={styles.ownerLeft}>
              <UserAvatar
                uri={request.owner.avatar}
                name={request.owner.name}
                size={32}
                style={styles.ownerAvatar}
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
            <TouchableOpacity onPress={onViewProfile} style={styles.viewProfileBtn}>
              <AppText variant="label" color={colors.primary}>
                {t("requestDetails.viewProfile")}
              </AppText>
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: colors.outlineVariant },
            ]}
          />

          <AppText
            variant="title"
            color={colors.onSurface}
            style={styles.sectionTitle}
          >
            {t("requestDetails.details")}
          </AppText>
          <View style={styles.detailsCard}>
            <View style={styles.detailPills}>
              <PetDetailPill
                label={t("requestDetails.yardType")}
                value={request.details.yardType}
                colors={colors}
                styles={styles}
              />
              <PetDetailPill
                label={t("requestDetails.age")}
                value={request.details.age}
                colors={colors}
                styles={styles}
              />
              <PetDetailPill
                label={t("requestDetails.energyLevel")}
                value={request.details.energyLevel}
                colors={colors}
                styles={styles}
              />
            </View>
          </View>

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
        </View>
      </ScrollView>

      {apply?.visible ? (
        <View style={styles.fixedFooter} pointerEvents="box-none">
          <View style={styles.fixedFooterInner}>
            <Button
              label={apply.label}
              onPress={apply.onPress}
              style={styles.applyBtn}
              loading={apply.loading}
              disabled={apply.disabled}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingHorizontal: 16,
  },
  contentPad: {
    paddingHorizontal: 16,
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
  topNotice: {
    marginBottom: 8,
    paddingHorizontal: 16,
  },
});

