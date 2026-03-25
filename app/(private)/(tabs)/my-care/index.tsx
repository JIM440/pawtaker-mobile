import { Colors } from '@/src/constants/colors';
import { blockIfKycNotApproved } from '@/src/lib/kyc/kyc-gate';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { supabase } from '@/src/lib/supabase/client';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { PageContainer } from '@/src/shared/components/layout';
import { MyCareSkeleton } from '@/src/shared/components/skeletons';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppSwitch } from '@/src/shared/components/ui/AppSwitch';
import { AppText } from '@/src/shared/components/ui/AppText';
import { DataState } from '@/src/shared/components/ui';
import { TabBar } from '@/src/shared/components/ui/TabBar';
import { useToastStore } from '@/src/lib/store/toast.store';
import { resolveDisplayName } from '@/src/lib/user/displayName';
import {
  Handshake,
  MoreHorizontal,
  PawPrint,
  Sun,
  TrendingUp
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

// Feature Components
import { CareGivenTab } from '@/src/features/my-care/components/CareGivenTab';
import { CareReceivedTab } from '@/src/features/my-care/components/CareReceivedTab';
import { LikedTab } from '@/src/features/my-care/components/LikedTab';
import { useRouter } from 'expo-router';

// Constants
type TabId = 'given' | 'received' | 'liked';

function isMissingBackendResourceError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; message?: string };
  if (maybe.code === "42P01") return true;
  const message = (maybe.message || "").toLowerCase();
  return message.includes("does not exist") || message.includes("relation");
}

export default function MyCareScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [available, setAvailable] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('given');
  const [menuVisible, setMenuVisible] = useState(false);
  const [hasActiveCare, setHasActiveCare] = useState(false);
  const [activeCare, setActiveCare] = useState<any | null>(null);
  const [careGivenRows, setCareGivenRows] = useState<any[]>([]);
  const [careReceivedRows, setCareReceivedRows] = useState<any[]>([]);
  const [likedPets, setLikedPets] = useState<any[]>([]);
  const [stats, setStats] = useState({ points: 0, careGiven: 0, careReceived: 0 });

  const showToast = useToastStore((s) => s.showToast);

  const onAvailableChange = (value: boolean) => {
    setAvailable(value);
    if (value) {
      showToast({
        variant: 'success',
        message: `${t('myCare.nowAvailableSnackbar')} ${t('myCare.availableHighlight')}`,
        durationMs: 3200,
      });
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'given', label: t('myCare.tabs.careGiven') },
    { id: 'received', label: t('myCare.tabs.careReceived') },
    { id: 'liked', label: t('myCare.tabs.liked') },
  ];

  const Header = (
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
  );

  const loadMyCareData = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (!opts?.refresh) {
      setLoading(true);
    }
    setLoadError(null);
    try {
      const [{ data: contracts }, { data: requests }, { data: pets }] = await Promise.all([
        supabase
          .from("contracts")
          .select("*")
          .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`),
        supabase
          .from("care_requests")
          .select("*")
          .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`),
        supabase.from("pets").select("*").eq("owner_id", user.id),
      ]);
      // Treat missing resources as empty-state content instead of hard errors.
      const safeContracts = contracts ?? [];
      const safeRequests = requests ?? [];
      const safePets = pets ?? [];

      const activeContract = safeContracts.find((c: any) => c.status === "active") ?? null;
      setHasActiveCare(Boolean(activeContract));

      let nextActiveCare: any = null;
      if (activeContract) {
        const req = safeRequests.find((r: any) => r.id === activeContract.request_id);
        const peerId =
          activeContract.owner_id === user.id
            ? activeContract.taker_id
            : activeContract.owner_id;
        const [{ data: peerUser }, { data: pet }] = await Promise.all([
          peerId
            ? supabase
              .from("users")
              .select("id,full_name,avatar_url")
              .eq("id", peerId)
              .maybeSingle()
            : Promise.resolve({ data: null } as any),
          req?.pet_id
            ? supabase.from("pets").select("*").eq("id", req.pet_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);

        nextActiveCare = {
          petName: pet?.name ?? "Pet",
          careType: req?.care_type ?? "care",
          dayLabel: req?.start_date
            ? new Date(req.start_date).toLocaleDateString()
            : "",
          caregiverName: resolveDisplayName(peerUser) || "Caregiver",
          caregiverAvatar: peerUser?.avatar_url ?? "",
          endsIn: req?.end_date
            ? new Date(req.end_date).toLocaleDateString()
            : "",
        };
      }
      setActiveCare(nextActiveCare);

      const givenContracts = safeContracts.filter((c: any) => c.taker_id === user.id);
      const receivedContracts = safeContracts.filter((c: any) => c.owner_id === user.id);

      const mapContractsToRows = async (items: any[], forReceived: boolean) => {
        const rows = await Promise.all(
          items.map(async (c: any) => {
            const req = safeRequests.find((r: any) => r.id === c.request_id);
            const peerId = forReceived ? c.taker_id : c.owner_id;
            const [{ data: peer }, { data: pet }] = await Promise.all([
              peerId
                ? supabase
                  .from("users")
                  .select("id,full_name,avatar_url")
                  .eq("id", peerId)
                  .maybeSingle()
                : Promise.resolve({ data: null } as any),
              req?.pet_id
                ? supabase.from("pets").select("name").eq("id", req.pet_id).maybeSingle()
                : Promise.resolve({ data: null } as any),
            ]);
            return {
              id: c.id,
              personName: resolveDisplayName(peer) || (forReceived ? "Taker" : "Pet owner"),
              personAvatar: peer?.avatar_url ?? "",
              handshakes: 0,
              paws: 0,
              pet: pet?.name ?? "Pet",
              careType: req?.care_type ?? "care",
              date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
            };
          }),
        );
        return rows;
      };

      const [givenRows, receivedRows] = await Promise.all([
        mapContractsToRows(givenContracts, false),
        mapContractsToRows(receivedContracts, true),
      ]);

      setCareGivenRows(givenRows);
      setCareReceivedRows(receivedRows);
      setLikedPets(
        safeRequests
          .filter((r: any) => r.owner_id !== user.id && r.status === "open")
          .slice(0, 8)
          .map((r: any) => {
            const pet = safePets.find((p: any) => p.id === r.pet_id);
            return {
              id: r.id,
              requestId: r.id,
              imageSource: pet?.avatar_url ?? "",
              petName: pet?.name ?? "Pet",
              breed: pet?.breed ?? "Unknown breed",
              petType: pet?.species ?? "Pet",
              bio: pet?.notes ?? "No details yet.",
              tags: [],
              seekingDateRange:
                r.start_date && r.end_date
                  ? `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}`
                  : "",
              seekingTime: "",
              isSeeking: true,
            };
          }),
      );

      setStats({
        points: profile?.points_balance ?? 0,
        careGiven: givenContracts.length,
        careReceived: receivedContracts.length,
      });
    } catch (err) {
      if (isMissingBackendResourceError(err)) {
        setActiveCare(null);
        setHasActiveCare(false);
        setCareGivenRows([]);
        setCareReceivedRows([]);
        setLikedPets([]);
        setStats({
          points: profile?.points_balance ?? 0,
          careGiven: 0,
          careReceived: 0,
        });
        setLoadError(null);
        return;
      }
      setLoadError(err instanceof Error ? err.message : "Failed to load my care.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyCareData();
  }, [profile?.points_balance, user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyCareData({ refresh: true });
    setRefreshing(false);
  };

  if (loading) {
    return (
      <PageContainer scrollable={false} contentStyle={styles.pageContent}>
        {Header}
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

  if (loadError) {
    return (
      <PageContainer scrollable={false} contentStyle={styles.pageContent}>
        {Header}
        <DataState
          title={t("common.error", "Something went wrong")}
          message={loadError}
          actionLabel={t("common.retry", "Retry")}
          onAction={() => {
            void loadMyCareData();
          }}
          mode="full"
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer scrollable={false} contentStyle={styles.pageContent}>
      {Header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >

        {/* Active Care Section */}
        {hasActiveCare && activeCare && (
          <View style={[styles.inCareCard, { backgroundColor: colors.surfaceContainerLow }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleGroup}>
                <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.inCareLabel}>{t('myCare.inCare')}</AppText>
                <AppText variant="bodyLarge" style={styles.inCarePetName}>{activeCare.petName}</AppText>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <MoreHorizontal size={24} color={colors.onSurface} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.inCareBody}>
              <View style={styles.metaPills}>
                <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <Sun size={14} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{activeCare.careType}</AppText>
                </View>
                <View style={[styles.metaPill, { backgroundColor: colors.surfaceContainerHighest }]}>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>{activeCare.dayLabel}</AppText>
                </View>
              </View>

              <View style={styles.caregiverAndTimerRow}>
                <View style={styles.caregiverMain}>
                  <AppImage
                    source={{ uri: activeCare.caregiverAvatar }}
                    style={styles.caregiverAvatar}
                    contentFit="cover"
                  />
                  <AppText variant="body" color={colors.onSurfaceVariant}>{activeCare.caregiverName}</AppText>
                </View>
                <View style={styles.timerRow}>
                  <AppText variant="caption" color={colors.primary} style={{ fontWeight: 600 }}>
                    • {t('myCare.endsIn', { time: activeCare.endsIn })}
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
                  <AppText variant="headline" style={styles.statLargeValue} color={colors.onSurfaceVariant} >{String(stats.points).padStart(3, "0")}</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.statLabel}>{t('myCare.points')}</AppText>
                </View>
              </View>
              <View style={styles.athContainer} className='self-end mb-2'>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {t('myCare.allTimeHigh')} <AppText variant="caption" style={{ fontWeight: '700' }}>{stats.points}</AppText>
                </AppText>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View style={[styles.secondaryStat, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={[styles.statIconCircleSmall, { backgroundColor: colors.tertiaryContainer }]}>
                  <Handshake size={28} color={colors.onTertiaryContainer} />
                </View>
                <View>
                  <AppText variant="headline" style={[styles.statSmallValue, { color: colors.onSurfaceVariant }]}>{String(stats.careGiven).padStart(3, "0")}</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.statLabelSmall}>{t('myCare.careGivenShort')}</AppText>
                </View>
              </View>
              <View style={[styles.secondaryStat, { backgroundColor: colors.surfaceContainerLow }]}>
                <View style={[styles.statIconCircleSmall, { backgroundColor: colors.primaryContainer }]}>
                  <PawPrint size={28} color={colors.onPrimaryContainer} />
                </View>
                <View>
                  <AppText variant="headline" style={[styles.statSmallValue, { color: colors.onSurfaceVariant }]}>{String(stats.careReceived).padStart(3, "0")}</AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.statLabelSmall}>{t('myCare.careReceivedShort')}</AppText>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.compactStatsRow}>
            <View style={[styles.compactStatsPill, { backgroundColor: colors.surfaceContainerHighest }]}>
              <TrendingUp size={16} color={colors.onSurfaceVariant} />
              <AppText variant="caption" style={{ fontWeight: '600' }}>{t('myCare.pointsCount', { count: stats.points })}</AppText>
            </View>
            <View style={[styles.compactStatsPill, { backgroundColor: colors.tertiaryContainer, borderColor: colors.outlineVariant }]}>
              <Handshake size={16} color={colors.tertiary} />
              <AppText variant="caption" style={{ color: colors.tertiary, fontWeight: '600' }}>{stats.careGiven}</AppText>
            </View>
            <View style={[styles.compactStatsPill, { backgroundColor: colors.primaryContainer, borderColor: colors.outlineVariant }]}>
              <PawPrint size={16} color={colors.onPrimaryContainer} />
              <AppText variant="caption" style={{ color: colors.onPrimaryContainer, fontWeight: '600' }}>{stats.careReceived}</AppText>
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
          <CareGivenTab colors={colors as any} rows={careGivenRows} />
        )}
        {activeTab === 'received' && (
          <CareReceivedTab colors={colors as any} rows={careReceivedRows} />
        )}
        {activeTab === 'liked' && (
          <LikedTab
            colors={colors as any}
            pets={likedPets}
            onApply={(requestId) => {
              if (blockIfKycNotApproved()) return;
              router.push(`/(private)/post-requests/${requestId}` as any);
            }}
          />
        )}
      </ScrollView>

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
