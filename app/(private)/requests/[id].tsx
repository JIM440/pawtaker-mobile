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
import {
  Heart,
  Calendar,
  Clock,
  MapPin,
  Star,
  Handshake,
  PawPrint,
} from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { Button } from '@/src/shared/components/ui/Button';

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
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const request = MOCK_REQUEST;
  const imageCount = request.images.length;

  const onApplyNow = () => {
    // Navigate to offer flow or submit application
    router.push(`/offers/${id ?? '1'}`);
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
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
            renderItem={({ item }) => (
              <View style={styles.carouselItem}>
                <AppImage
                  source={{ uri: item }}
                  style={[styles.carouselImage, { width: IMAGE_WIDTH }]}
                  contentFit="cover"
                />
              </View>
            )}
            keyExtractor={(_, i) => String(i)}
          />
          <View style={styles.slideIndicator}>
            <View style={[styles.slideBadge, { backgroundColor: 'rgba(255,255,255,0.38)' }]}>
              <AppText variant="caption" color="#fff">
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
            <AppText variant="headline" style={styles.petName}>{request.petName}</AppText>
            <View style={styles.breedRow}>
              <AppText variant="caption">{request.breed}</AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
              <AppText variant="caption">{request.petType}</AppText>
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
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={16} color={colors.onSurface} />
            <AppText variant="body" style={styles.metaText}>{request.dateRange}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <View style={styles.metaItem}>
            <Clock size={16} color={colors.onSurface} />
            <AppText variant="body" style={styles.metaText}>{request.time}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="body" style={styles.metaText}>{request.careType}</AppText>
        </View>

        {/* Location */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={16} color={colors.onSurface} />
            <AppText variant="body" style={styles.metaText}>{request.location}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="body" style={styles.metaText}>{request.distance}</AppText>
        </View>

        {/* Description */}
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.description}>
          {request.description}
        </AppText>

        {/* Pet owner card */}
        <View style={[styles.ownerCard, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.ownerLeft}>
            <AppImage
              source={{ uri: request.owner.avatar }}
              style={styles.ownerAvatar}
              contentFit="cover"
            />
            <View style={styles.ownerInfo}>
              <AppText variant="title" style={styles.ownerName}>{request.owner.name}</AppText>
              <View style={styles.ownerStats}>
                <AppText variant="caption" color={colors.onSurfaceVariant}>{request.owner.rating}</AppText>
                <Star size={10} color={colors.onSurfaceVariant} fill={colors.onSurfaceVariant} />
                <View style={[styles.miniPill, { backgroundColor: colors.surfaceContainerLowest }]}>
                  <Handshake size={12} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{request.owner.handshakes}</AppText>
                </View>
                <View style={[styles.miniPill, { backgroundColor: colors.surfaceContainerLowest }]}>
                  <PawPrint size={12} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{request.owner.paws}</AppText>
                </View>
              </View>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push(`/users/${request.owner.id}`)}>
            <AppText variant="title" color={colors.primary}>View Profile</AppText>
          </TouchableOpacity>
        </View>

        {/* Details section */}
        <AppText variant="title" style={styles.sectionTitle}>Details</AppText>
        <View style={styles.detailPills}>
          <DetailPill label="Yard Type" value={request.details.yardType} colors={colors} />
          <DetailPill label="Age" value={request.details.age} colors={colors} />
          <DetailPill label="Energy Level" value={request.details.energyLevel} colors={colors} />
        </View>

        {/* Special needs */}
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.specialLabel}>
          *Special needs
        </AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.specialText}>
          {request.specialNeeds}
        </AppText>

        <Button
          label="Apply Now"
          onPress={onApplyNow}
          style={styles.applyBtn}
        />
      </ScrollView>
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
  colors: typeof Colors.light;
}) {
  return (
    <View style={styles.detailPillGroup}>
      <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.pillLabel}>
        {label}
      </AppText>
      <View style={[styles.pillValue, { borderColor: colors.outlineVariant }]}>
        <AppText variant="caption" color={colors.onSurfaceVariant}>{value}</AppText>
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
    backgroundColor: '#eee',
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
    marginBottom: 16,
    lineHeight: 16,
  },
  ownerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 999,
    marginBottom: 24,
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
    backgroundColor: '#eee',
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
  detailPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    marginBottom: 16,
  },
  detailPillGroup: {
    gap: 4,
  },
  pillLabel: {
    fontSize: 12,
  },
  pillValue: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  specialLabel: {
    marginBottom: 8,
    fontSize: 12,
  },
  specialText: {
    lineHeight: 16,
    marginBottom: 24,
    fontSize: 12,
  },
  applyBtn: {
    alignSelf: 'stretch',
  },
});
