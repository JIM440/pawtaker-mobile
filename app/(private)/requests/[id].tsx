import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors, ColorValues } from '@/src/constants/colors';
import { BackHeader } from '@/src/shared/components/layout/BackHeader';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { Button } from '@/src/shared/components/ui/Button';
import { ImageViewerModal } from '@/src/shared/components/ui/ImageViewerModal';
import { RatingSummary } from '@/src/shared/components/ui/RatingSummary';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 16;
const IMAGE_WIDTH = SCREEN_WIDTH - H_PADDING * 2;
const IMAGE_HEIGHT = 216;

const MOCK_REQUEST = {
  id: '1',
  images: [
    'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    'https://images.unsplash.com/photo-1583512603805-3cc6b41a3ec0?w=800',
    'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800',
  ],
  petName: 'Polo',
  breed: 'Golden Retriever',
  petType: 'Dog',
  dateRange: 'Mar 14-Mar 18',
  time: '8am-4pm',
  careType: 'Daytime',
  location: 'Lake Placid, New York, US',
  distance: '5km',
  description:
    "Polo is a friendly and energetic golden retriever who loves long walks and playing fetch. He's well-trained and a great entertainer. Loves people and other pets",
  owner: {
    id: '1',
    name: 'Jane Ambers',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    rating: 4.1,
    handshakes: 12,
    paws: 17,
  },
  details: {
    yardType: 'fenced yard',
    age: '3-8 yrs',
    energyLevel: 'medium energy',
  },
  specialNeeds:
    'Needs insulin shots twice a day or is very shy around loud noises. Strictly no human food; tends to eat grass if not watched. Needs insulin shots twice a day or is very shy around loud noises.',
};

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const request = MOCK_REQUEST;
  const imageCount = request.images.length;

  const onApplyNow = () => {
    // Navigate to offer flow or submit application
    router.push(`/offers/${id ?? '1'}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <BackHeader title={t('requestDetails.title')} onBack={() => router.back()} />
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
              const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentImageIndex(i);
            }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  setCurrentImageIndex(index);
                  setGalleryOpen(true);
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
            <View style={[styles.slideBadge, { backgroundColor: colors.surfaceContainerHighest }]}>
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
            <AppText variant="headline" color={colors.onSurface} style={styles.petName}>{request.petName}</AppText>
            <View style={styles.breedRow}>
              <AppText variant="caption" color={colors.onSurface}>{request.breed}</AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant}>{request.petType}</AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}
            style={[styles.heartBtn, { backgroundColor: colors.surfaceContainer }]}
          >
            <Heart
              size={20}
              color={colors.onSurface}
              fill={isFavorite ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Date & time */}
        <View style={[styles.metaRow, { marginBottom: 6 }]}>
          <View style={styles.metaItem}>
            <Calendar size={18} color={colors.primary} />
            <AppText variant="body" color={colors.onSurface} style={styles.metaText}>{request.dateRange}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <View style={styles.metaItem}>
            <Clock size={18} color={colors.primary} />
            <AppText variant="body" color={colors.onSurface} style={styles.metaText}>{request.time}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="body" color={colors.onSurface} style={styles.metaText}>{request.careType}</AppText>
        </View>

        {/* Location */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={18} color={colors.primary} />
            <AppText variant="body" color={colors.onSurface} style={styles.metaText}>{request.location}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="body" color={colors.onSurfaceVariant} style={styles.metaText}>{request.distance}</AppText>
        </View>

        {/* Description */}
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.description}>
          {request.description}
        </AppText>

        {/* Pet owner card */}
        <View style={[styles.ownerCard, { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant }]}>
          <View style={styles.ownerLeft}>
<AppImage
                  source={{ uri: request.owner.avatar }}
                  style={[styles.ownerAvatar, { backgroundColor: colors.surfaceContainer }]}
                  contentFit="cover"
                />
            <View style={styles.ownerInfo}>
              <AppText variant="title" color={colors.onSurface} style={styles.ownerName}>{request.owner.name}</AppText>
              <View style={styles.ownerStats}>
                <RatingSummary
                  rating={request.owner.rating}
                  handshakes={request.owner.handshakes}
                  paws={request.owner.paws}
                />
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/(private)/(tabs)/(no-label)/users/${request.owner.id}`,
              )
            }
            style={styles.viewProfileBtn}
          >
            <AppText variant="label" color={colors.primary}>{t('requestDetails.viewProfile')}</AppText>
          </TouchableOpacity>
        </View>

        {/* Details section (Figma apply details) */}
        <AppText variant="title" color={colors.onSurface} style={styles.sectionTitle}>{t('requestDetails.details')}</AppText>
        <View style={[styles.detailsCard, { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant }]}>
          <View style={styles.detailPills}>
            <DetailPill label={t('requestDetails.yardType')} value={request.details.yardType} colors={colors} />
            <DetailPill label={t('requestDetails.age')} value={request.details.age} colors={colors} />
            <DetailPill label={t('requestDetails.energyLevel')} value={request.details.energyLevel} colors={colors} />
          </View>
        </View>

        {/* Special needs */}
        <AppText variant="label" color={colors.onSurfaceVariant} style={styles.specialLabel}>
          {t('requestDetails.specialNeeds')}
        </AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.specialText}>
          {request.specialNeeds}
        </AppText>

        <Button
          label={t('requestDetails.applyNow')}
          onPress={onApplyNow}
          style={styles.applyBtn}
        />
      </ScrollView>
      <ImageViewerModal
        visible={galleryOpen}
        images={request.images.map((uri) => ({ uri }))}
        index={currentImageIndex}
        onRequestClose={() => setGalleryOpen(false)}
      />
    </View>
  );
}

function DetailPill({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ColorValues;
}) {
  return (
    <View style={styles.detailPillGroup}>
      <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.pillLabel}>
        {label}
      </AppText>
      <View style={[styles.pillValue, { backgroundColor: colors.surfaceContainer }]}>
        <AppText variant="body" color={colors.onSurface}>{value}</AppText>
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
    padding: 16,
    paddingBottom: 32,
  },
  carouselWrap: {
    width: SCREEN_WIDTH,
    marginLeft: -H_PADDING,
    marginBottom: 8,
    position: 'relative',
  },
  carouselItem: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  carouselImage: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: 16,
  },
  slideIndicator: {
    position: 'absolute',
    top: 18,
    right: H_PADDING + 10,
  },
  slideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dots: {
    position: 'absolute',
    bottom: 18,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
  },
  description: {
    marginTop: 8,
    marginBottom: 20,
    lineHeight: 20,
    fontSize: 14,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  viewProfileBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  ownerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  ownerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  ownerInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  ownerName: {
    fontSize: 14,
  },
  ownerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
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
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  detailPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  detailPillGroup: {
    gap: 6,
  },
  pillLabel: {
    fontSize: 12,
  },
  pillValue: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  specialLabel: {
    marginBottom: 8,
    fontSize: 14,
  },
  specialText: {
    lineHeight: 20,
    marginBottom: 28,
    fontSize: 14,
  },
  applyBtn: {
    alignSelf: 'stretch',
    paddingVertical: 14,
  },
});
