import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
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
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';

export type PetCardCaretaker = {
  name: string;
  avatarUri?: string | number | null;
  rating: number;
  reviewsCount: number;
  petsCount: number;
};

export type PetCardProps = {
  imageSource: string | number | { uri: string };
  petName: string;
  breed: string;
  petType: string;
  dateRange: string;
  time: string;
  careType: string;
  location: string;
  distance: string;
  description: string;
  caretaker: PetCardCaretaker;
  isFavorite?: boolean;
  onFavorite?: () => void;
  onApply?: () => void;
};

const CARD_RADIUS = 20;
const IMAGE_HEIGHT = 160;
const IMAGE_TOP_RADIUS = 16;

export function PetCard({
  imageSource,
  petName,
  breed,
  petType,
  dateRange,
  time,
  careType,
  location,
  distance,
  description,
  caretaker,
  isFavorite = false,
  onFavorite,
  onApply,
}: PetCardProps) {
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainerLowest ?? '#fffafa' }]}>
      <View style={styles.imageWrap}>
        <AppImage
          source={typeof imageSource === 'string' ? { uri: imageSource } : imageSource}
          style={[styles.image, { borderTopLeftRadius: IMAGE_TOP_RADIUS, borderTopRightRadius: IMAGE_TOP_RADIUS }]}
          contentFit="cover"
        />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.nameRow}>
            <AppText variant="headline" style={styles.petName}>{petName}</AppText>
            <View style={styles.breedRow}>
              <AppText variant="caption" style={styles.breed}>{breed}</AppText>
              <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
              <AppText variant="caption" style={styles.breed}>{petType}</AppText>
            </View>
          </View>
          <TouchableOpacity
            onPress={onFavorite}
            style={[styles.favButton, { backgroundColor: colors.surfaceContainer }]}
            hitSlop={8}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.primary : colors.onSurfaceVariant}
              fill={isFavorite ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={16} color={colors.onSurface} />
            <AppText variant="caption" style={styles.metaText}>{dateRange}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <View style={styles.metaItem}>
            <Clock size={16} color={colors.onSurface} />
            <AppText variant="caption" style={styles.metaText}>{time}</AppText>
          </View>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="caption" style={styles.metaText}>{careType}</AppText>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={16} color={colors.onSurface} />
          <AppText variant="caption" style={styles.locationText} numberOfLines={1}>{location}</AppText>
          <AppText variant="caption" color={colors.onSurfaceVariant}> • </AppText>
          <AppText variant="caption" style={styles.metaText}>{distance}</AppText>
        </View>

        <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={3} style={styles.description}>
          {description}
        </AppText>

        <View style={styles.footer}>
          <View style={[styles.caretakerChip, { backgroundColor: colors.surfaceContainer }]}>
            {caretaker.avatarUri != null ? (
              <AppImage
                source={typeof caretaker.avatarUri === 'string' ? { uri: caretaker.avatarUri } : caretaker.avatarUri}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surfaceVariant }]} />
            )}
            <View style={styles.caretakerInfo}>
              <AppText variant="label" color={colors.onSurfaceVariant}>{caretaker.name}</AppText>
              <View style={styles.statsRow}>
                <AppText variant="caption" color={colors.onSurfaceVariant}>{caretaker.rating}</AppText>
                <Star size={10} color={colors.onSurfaceVariant} fill={colors.onSurfaceVariant} />
                <View style={[styles.statPill, { backgroundColor: colors.surfaceContainerLowest }]}>
                  <Handshake size={12} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{caretaker.reviewsCount}</AppText>
                </View>
                <View style={[styles.statPill, { backgroundColor: colors.surfaceContainerLowest }]}>
                  <PawPrint size={12} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{caretaker.petsCount}</AppText>
                </View>
              </View>
            </View>
          </View>
          <Button label="Apply" onPress={onApply} style={styles.applyBtn} fullWidth />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    padding: 4,
  },
  imageWrap: {
    height: IMAGE_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  petName: {
    fontSize: 22,
    letterSpacing: -0.1,
  },
  breedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  breed: {
    fontSize: 11,
    lineHeight: 13,
  },
  favButton: {
    padding: 6,
    borderRadius: 999,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 2,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexWrap: 'wrap',
  },
  locationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    minWidth: 0,
  },
  description: {
    fontSize: 11,
    lineHeight: 13,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  caretakerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    paddingRight: 12,
    paddingVertical: 8,
    borderRadius: 999,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  caretakerInfo: {
    flex: 1,
    minWidth: 0,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  applyBtn: {
    alignSelf: 'stretch',
    minWidth: 80,
  },
});
