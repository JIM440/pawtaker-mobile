import { Colors } from '@/src/constants/colors';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { PageContainer } from '@/src/shared/components/layout';
import { MyCareSkeleton } from '@/src/shared/components/skeletons';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppSwitch } from '@/src/shared/components/ui/AppSwitch';
import { AppText } from '@/src/shared/components/ui/AppText';
import { TabBar } from '@/src/shared/components/ui/TabBar';
import {
  Handshake,
  MoreHorizontal,
  PawPrint,
  Sun,
  TrendingUp
} from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// Feature Components
import { CareGivenTab } from '@/src/features/my-care/components/CareGivenTab';
import { CareReceivedTab } from '@/src/features/my-care/components/CareReceivedTab';
import { LikedTab } from '@/src/features/my-care/components/LikedTab';
import { FeedbackModal } from '@/src/shared/components/ui/FeedbackModal';

// Constants
import {
  MOCK_CARE_GIVEN_ROWS,
  MOCK_IN_CARE,
  MOCK_LIKED_PETS,
} from '@/src/features/my-care/constants';

type TabId = 'given' | 'received' | 'liked';

export default function MyCareScreen() {
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [loading] = useState(false);
  const [available, setAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('given');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [hasActiveCare] = useState(true); // Demo mode

  const onAvailableChange = (value: boolean) => {
    setAvailable(value);
    if (value) setShowSnackbar(true);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'given', label: t('myCare.tabs.careGiven') },
    { id: 'received', label: t('myCare.tabs.careReceived') },
    { id: 'liked', label: t('myCare.tabs.liked') },
  ];

  if (loading) {
    return (
      <PageContainer scrollable={false} contentStyle={styles.pageContent}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MyCareSkeleton />
        </ScrollView>
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false} contentStyle={styles.pageContent}>
      <View style={styles.header}>
        <AppText variant="headline" style={{ fontSize: 22 }}>{t('myCare.title')}</AppText>
        <View style={styles.availableRow}>
          <AppText variant="body" color={colors.onSurfaceVariant}>{t('myCare.available')}</AppText>
          <AppSwitch
            value={available}
            onValueChange={onAvailableChange}
          />
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Active Care Section */}
        {hasActiveCare && (
          <View style={[styles.inCareCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleGroup}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.inCareLabel}>{t('myCare.inCare')}</AppText>
                <AppText variant="bodyLarge" style={styles.inCarePetName}>{MOCK_IN_CARE.petName}</AppText>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <MoreHorizontal size={24} color={colors.onSurface} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.inCareBody}>
              <View style={styles.metaPills}>
                <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <Sun size={14} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{MOCK_IN_CARE.careType}</AppText>
                </View>
                <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{MOCK_IN_CARE.dayLabel}</AppText>
                </View>
              </View>

              <View style={styles.caregiverAndTimerRow}>
                <View style={styles.caregiverMain}>
                  <AppImage
                    source={{ uri: MOCK_IN_CARE.caregiverAvatar }}
                    style={styles.caregiverAvatar}
                    contentFit="cover"
                  />
                  <AppText variant="body" color={colors.onSurfaceVariant}>{MOCK_IN_CARE.caregiverName}</AppText>
                </View>
                <View style={styles.timerRow}>
                  <AppText variant="caption" color={colors.primary} style={{ fontWeight: 600 }}>
                    • {t('myCare.endsIn', { time: MOCK_IN_CARE.endsIn })}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* In Care Actions Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <Pressable
            style={styles.menuModalOverlay}
            onPress={() => setMenuVisible(false)}
          >
            <View style={[styles.menuModalContent, { backgroundColor: colors.surface, borderColor: colors.outlineVariant }]}>
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <AppText variant="body">{t('myCare.goToChat')}</AppText>
              </TouchableOpacity>
              <View style={[styles.menuDivider, { backgroundColor: colors.outlineVariant }]} />
              <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                <AppText variant="body">{t('myCare.viewAgreement')}</AppText>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Dynamic Stats Row (Compact vs Full) */}
        {!hasActiveCare || activeTab === 'liked' ? (
          <View style={styles.summaryGrid}>
            <View style={[styles.primaryStat, { backgroundColor: colors.surfaceContainerLow }]}>
              <View className="flex-row items-center gap-4">
                <View style={[styles.statIconCircle, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <TrendingUp size={36} color={colors.onSurfaceVariant} />
                </View>
                <View style={{}}>
                  <AppText variant="headline" style={styles.statLargeValue} color={colors.onSurfaceVariant} >058</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.statLabel}>{t('myCare.points')}</AppText>
                </View>
              </View>
              <View style={styles.athContainer} className='self-end mb-2'>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {t('myCare.allTimeHigh')} <AppText variant="caption" style={{ fontWeight: '700' }}>1200</AppText>
                </AppText>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View style={[styles.secondaryStat, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={[styles.statIconCircleSmall, { backgroundColor: colors.tertiaryContainer }]}>
                  <Handshake size={28} color={colors.onTertiaryContainer} />
                </View>
                <View>
                  <AppText variant="headline" style={[styles.statSmallValue, { color: colors.onSurfaceVariant }]}>012</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.statLabelSmall}>{t('myCare.careGivenShort')}</AppText>
                </View>
              </View>
              <View style={[styles.secondaryStat, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={[styles.statIconCircleSmall, { backgroundColor: colors.primaryContainer }]}>
                  <PawPrint size={28} color={colors.onPrimaryContainer} />
                </View>
                <View>
                  <AppText variant="headline" style={[styles.statSmallValue, { color: colors.onSurfaceVariant }]}>017</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.statLabelSmall}>{t('myCare.careReceivedShort')}</AppText>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.compactStatsRow}>
            <View style={[styles.compactStatsPill, { backgroundColor: colors.surfaceContainerHighest }]}>
              <TrendingUp size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" style={{ fontWeight: '600' }}>{t('myCare.pointsCount', { count: 58 })}</AppText>
            </View>
            <View style={[styles.compactStatsPill, { backgroundColor: colors.tertiaryContainer, borderColor: colors.outlineVariant }]}>
              <Handshake size={16} color={colors.tertiary} />
              <AppText variant="caption" style={{ color: colors.tertiary, fontWeight: '600' }}>12</AppText>
            </View>
            <View style={[styles.compactStatsPill, { backgroundColor: colors.primaryContainer, borderColor: colors.outlineVariant }]}>
              <PawPrint size={16} color={colors.onPrimaryContainer} />
              <AppText variant="caption" style={{ color: colors.onPrimaryContainer, fontWeight: '600' }}>17</AppText>
            </View>
          </View>
        )}

        {/* Tabs */}
        <TabBar
          tabs={tabs.map(t => ({ key: t.id, label: t.label }))}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
          style={styles.tabBarCustom}
        />

        {/* Tab content */}
        {activeTab === 'given' && (
          <CareGivenTab colors={colors as any} rows={MOCK_CARE_GIVEN_ROWS} />
        )}
        {activeTab === 'received' && (
          <CareReceivedTab colors={colors as any} />
        )}
        {activeTab === 'liked' && (
          <LikedTab
            colors={colors as any}
            pets={MOCK_LIKED_PETS}
            onApply={() => setApplyModalVisible(true)}
          />
        )}
      </ScrollView>

      {/* Applying Modal */}
      <FeedbackModal
        visible={applyModalVisible}
        title={t("myCare.applyingForPet")}
        description={t("myCare.applyingDescription")}
        icon={<PawPrint size={32} color={colors.primary} />}
        primaryLabel={t("common.continue")}
        onPrimary={() => {
          setApplyModalVisible(false);
          setShowSnackbar(true);
        }}
        secondaryLabel={t("common.cancel")}
        onSecondary={() => setApplyModalVisible(false)}
        onRequestClose={() => setApplyModalVisible(false)}
      />

      {showSnackbar && (
        <View style={[styles.snackbarShadow, { bottom: 100 }]}>
          <View style={[styles.snackbar, { backgroundColor: colors.onSurfaceVariant }]}>
            <AppText variant="body" color={colors.surfaceBright} style={{ fontWeight: '600' }}>
              {t('myCare.nowAvailableSnackbar')}{' '}
              <AppText variant="body" color={colors.surfaceBright} style={{ fontWeight: '800' }}>
                {t('myCare.availableHighlight')}
              </AppText>
            </AppText>
          </View>
        </View>
      )}
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  pageContent: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  availableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inCareCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderTitleGroup: {
    alignItems: 'center',
    gap: 8,
  },
  inCareLabel: {
    fontSize: 13,
    marginBottom: -2,
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  menuModalContent: {
    position: 'absolute',
    top: 140,
    right: 16,
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  inCareBody: {
    gap: 12,
  },
  inCarePetName: {
    fontWeight: '700',
    fontSize: 22,
  },
  metaPills: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end'
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  caregiverAndTimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  caregiverMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  caregiverAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  compactStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 99,
  },
  summaryGrid: {
    marginBottom: 24,
    gap: 12,
  },
  primaryStat: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  secondaryStat: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLargeValue: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 36,
  },
  statSmallValue: {
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 36,
  },
  statLabel: {
    lineHeight: 14,
    fontWeight: '500',
  },
  statLabelSmall: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 12,
  },
  athContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  tabBarCustom: {
  },
  snackbarShadow: {
    position: 'absolute',
    left: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 1000,
  },
  snackbar: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
});
