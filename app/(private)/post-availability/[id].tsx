import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppText } from '@/src/shared/components/ui/AppText';
import { Button } from '@/src/shared/components/ui/Button';
import { RatingSummary } from '@/src/shared/components/ui/RatingSummary';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FeedbackModal } from '@/src/shared/components/ui/FeedbackModal';
import {
  ChevronLeft,
  EllipsisVertical,
  MapPin,
} from 'lucide-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useToastStore } from '@/src/lib/store/toast.store';

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
  const { id, accepted: acceptedParam } = useLocalSearchParams<{
    id: string;
    accepted?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const offer = MOCK_OFFER;
  const [acceptedConfirmOpen, setAcceptedConfirmOpen] = React.useState(false);
  const [accepted, setAccepted] = React.useState(
    () => acceptedParam === '1' || acceptedParam === 'true',
  );
  const [actionsOpen, setActionsOpen] = React.useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = React.useState(false);
  const showToast = useToastStore((s) => s.showToast);

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
            <AppText variant="body" style={styles.titleLabel}>
              {t("messages.applyingFor")}
            </AppText>
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
                  <AppText variant="caption" color={colors.onTertiaryContainer}>
                    {t("myCare.available")}
                  </AppText>
                </View>
              )}
              <TouchableOpacity
                style={styles.menuBtn}
                hitSlop={8}
                onPress={() => {
                  if (!accepted) return;
                  setActionsOpen(true);
                }}
                activeOpacity={0.9}
              >
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
        <AppText variant="title" style={styles.sectionTitle}>
          {t("requestDetails.details")}
        </AppText>
        <View style={styles.detailGrid}>
          <DetailRow label={t('requestDetails.yardType')} value={offer.details.yardType} colors={colors} />
          <DetailRow label={t("myCare.contract.active")} value={offer.details.active} colors={colors} />
          <DetailRow label={t('requestDetails.careTypes')} value={offer.details.careTypes} colors={colors} />
          <DetailRow label={t('requestDetails.petOwner')} value={offer.details.petOwner} colors={colors} />
        </View>

        {/* Note */}
        <AppText variant="title" style={styles.sectionTitle}>{t("post.availability.note")}</AppText>
        <AppText variant="body" color={colors.onSurfaceVariant} style={styles.note}>
          {offer.note}
        </AppText>

        {!accepted ? (
          <>
            <Button
              label={t("myCare.contract.acceptOffer")}
              onPress={() => setAcceptedConfirmOpen(true)}
              style={styles.acceptBtn}
            />
            <AppText
              variant="caption"
              color={colors.onSurfaceVariant}
              style={styles.disclaimer}
            >
              {t("myCare.contract.acceptDisclaimer")}
            </AppText>
          </>
        ) : null}
      </ScrollView>

      {/* Actions (hide Accept Offer when already accepted) */}
      <Modal
        transparent
        visible={actionsOpen}
        onRequestClose={() => setActionsOpen(false)}
        animationType="fade"
      >
        <Pressable style={styles.actionsOverlay} onPress={() => setActionsOpen(false)}>
          <View
            style={[
              styles.actionsCard,
              { backgroundColor: colors.surfaceContainerLowest, borderColor: colors.outlineVariant },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionsOpen(false);
                router.push(`/(private)/(tabs)/my-care/review/${id}` as any);
              }}
            >
              <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                {t("myCare.contract.rateAndReview")}
              </AppText>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionsOpen(false);
                setAccepted(false);
                showToast({
                  variant: 'info',
                  message: t("myCare.contract.terminatedDemo"),
                  durationMs: 3000,
                });
              }}
            >
              <AppText variant="body" color={colors.onSurface} numberOfLines={1}>
                {t("myCare.contract.terminate")}
              </AppText>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />

            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setActionsOpen(false);
                setShowBlockConfirm(true);
              }}
            >
              <AppText variant="body" color={colors.error} numberOfLines={1}>
                {t("profile.blockUser")}
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <FeedbackModal
        visible={showBlockConfirm}
        title={t('messages.blockConfirmTitle')}
        description={t('messages.blockConfirmDescription')}
        primaryLabel={t('messages.block')}
        secondaryLabel={t('common.cancel')}
        destructive
        onPrimary={() => {
          setShowBlockConfirm(false);
          showToast({
            variant: 'info',
            message: t("messages.blockedDemo"),
            durationMs: 3000,
          });
        }}
        onSecondary={() => setShowBlockConfirm(false)}
        onRequestClose={() => setShowBlockConfirm(false)}
      />

      <FeedbackModal
        visible={acceptedConfirmOpen}
        title={t("myCare.contract.acceptConfirmTitle")}
        description={t("myCare.contract.acceptConfirmDescription")}
        primaryLabel={t("myCare.contract.acceptOffer")}
        secondaryLabel={t("common.cancel")}
        onPrimary={() => {
          setAcceptedConfirmOpen(false);
          router.push({
            pathname: "/(private)/(tabs)/my-care/contract/[id]" as any,
            params: { id: id ?? "1", accepted: "1" } as any,
          });
        }}
        onSecondary={() => setAcceptedConfirmOpen(false)}
        onRequestClose={() => setAcceptedConfirmOpen(false)}
      />
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
  actionsOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
    backgroundColor: 'transparent',
  },
  actionsCard: {
    width: 172,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },
  actionItem: {
    height: 48,
    paddingHorizontal: 16,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});
