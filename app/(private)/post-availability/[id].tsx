import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { RatingSummary } from '@/src/shared/components/ui/RatingSummary';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft,
  EllipsisVertical,
  MapPin,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

const MOCK_OFFER = {
  petName: 'Polo',
  taker: {
    name: 'Bob Majors',
    avatarUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    available: true,
    rating: 4.1,
    handshakes: 12,
    paws: 17,
    petTypes: 'Cats • Dog • Bird',
    careOffering: 'Daytime • Play/walk',
    location: 'Syracuse, New York, US',
  },
  details: {
    yardType: 'fenced yard',
    active: 'Sat, Sun | 8AM-4PM',
    careTypes: 'Daytime, Play/walk',
    petOwner: 'Yes',
  },
  note:
    "Hi there! I'm Bob, a lifelong pet lover with 5 years of experience caring for energetic pups and senior cats alike. Whether it's a high-energy hike or a quiet afternoon, I prioritize your pet's routine and safety. I offer premium care with regular updates and photos.",
};

export default function ViewOfferScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const offer = MOCK_OFFER;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ChevronLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <View style={styles.titleRow}>
            <AppText variant="body" style={styles.titleLabel}>Applying for </AppText>
            <TouchableOpacity>
              <AppText variant="title" color={colors.primary} style={styles.titleLink}>
                {offer.petName}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Taker profile card */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() =>
            router.push({
              pathname: "/(private)/(tabs)/profile/users/[id]",
              params: { id: id ?? "t1" },
            })
          }
          style={[styles.takerCard, { backgroundColor: colors.surfaceContainerLowest }]}
        >
          <AppImage
            source={{ uri: offer.taker.avatarUri }}
            style={[styles.takerAvatar, { backgroundColor: colors.surfaceContainer }]}
            contentFit="cover"
          />
          <View style={styles.takerBody}>
            <View style={styles.takerTitleRow}>
              <AppText variant="title" numberOfLines={1} style={styles.takerName}>
                {offer.taker.name}
              </AppText>
              {offer.taker.available && (
                <View style={[styles.availablePill, { backgroundColor: colors.tertiaryContainer }]}>
                  <AppText variant="caption" color={colors.onTertiaryContainer}>Available</AppText>
                </View>
              )}
              <TouchableOpacity style={styles.menuBtn}>
                <EllipsisVertical size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>
            <View style={styles.statsRow}>
              <RatingSummary
                rating={offer.taker.rating}
                handshakes={offer.taker.handshakes}
                paws={offer.taker.paws}
              />
            </View>
            <AppText variant="caption" color={colors.onSurface} style={styles.petTypes}>
              {offer.taker.petTypes}
            </AppText>
            <View style={[styles.carePill, { backgroundColor: colors.surfaceContainer }]}>
              <AppText variant="caption" color={colors.onSecondaryContainer}>{offer.taker.careOffering}</AppText>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" color={colors.onSurfaceVariant}>{offer.taker.location}</AppText>
            </View>
          </View>
        </TouchableOpacity>

        {/* Details */}
        <AppText variant="title" style={styles.sectionTitle}>Details</AppText>
        <View style={styles.detailGrid}>
          <DetailRow label={t('requestDetails.yardType')} value={offer.details.yardType} colors={colors} />
          <DetailRow label="Active" value={offer.details.active} colors={colors} />
          <DetailRow label={t('requestDetails.careTypes')} value={offer.details.careTypes} colors={colors} />
          <DetailRow label={t('requestDetails.petOwner')} value={offer.details.petOwner} colors={colors} />
        </View>

        {/* Note */}
        <AppText variant="title" style={styles.sectionTitle}>Note</AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.note}>
          {offer.note}
        </AppText>

        <Button
          label="Accept Offer"
          onPress={() => { }}
          style={styles.acceptBtn}
        />
        <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.disclaimer}>
          By tapping Accept Offer, you approve that anyone in the community can contact you in our chat system.
        </AppText>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" color={colors.onSurfaceVariant}>{label}</AppText>
      <View style={[styles.detailValue, { backgroundColor: colors.surfaceContainer }]}>
        <AppText variant="caption" color={colors.onSecondaryContainer}>{value}</AppText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleLabel: {
    fontSize: 16,
  },
  titleLink: {
    textDecorationLine: 'underline',
    fontSize: 16,
  },
  takerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginBottom: 24,
  },
  takerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  takerBody: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  takerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  takerName: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: 180,
  },
  availablePill: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  menuBtn: {
    padding: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  petTypes: {
    fontSize: 12,
  },
  carePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  detailGrid: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailValue: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  note: {
    marginBottom: 24,
    lineHeight: 20,
  },
  acceptBtn: {
    marginBottom: 12,
  },
  disclaimer: {
    textAlign: 'center',
  },
});
