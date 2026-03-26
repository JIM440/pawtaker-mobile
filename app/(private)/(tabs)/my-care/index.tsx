import { Colors } from '@/src/constants/colors';
import { blockIfKycNotApproved } from '@/src/lib/kyc/kyc-gate';
import { useAuthStore } from '@/src/lib/store/auth.store';
import {
  errorMessageFromUnknown,
  isMissingBackendResourceError,
} from '@/src/lib/supabase/errors';
import { petGalleryUrls } from '@/src/lib/pets/petGalleryUrls';
import { parsePetNotes } from '@/src/lib/pets/parsePetNotes';
import { supabase } from '@/src/lib/supabase/client';
import type { TablesRow } from '@/src/lib/supabase/types';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { PageContainer } from '@/src/shared/components/layout';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { AppSwitch } from '@/src/shared/components/ui/AppSwitch';
import { AppText } from '@/src/shared/components/ui/AppText';
import { DataState } from '@/src/shared/components/ui';
import { FeedbackModal } from '@/src/shared/components/ui/FeedbackModal';
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

export default function MyCareScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [refreshing, setRefreshing] = useState(false);
  const [available, setAvailable] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('given');
  const [menuVisible, setMenuVisible] = useState(false);

  const [hasActiveCare, setHasActiveCare] = useState(false);
  const [activeCare, setActiveCare] = useState<any | null>(null);

  const [activeCareLoading, setActiveCareLoading] = useState(false);
  const [activeCareLoaded, setActiveCareLoaded] = useState(false);
  const [activeCareError, setActiveCareError] = useState<string | null>(null);

  const [careGivenRows, setCareGivenRows] = useState<any[]>([]);
  const [givenLoading, setGivenLoading] = useState(false);
  const [givenLoaded, setGivenLoaded] = useState(false);
  const [givenError, setGivenError] = useState<string | null>(null);

  const [careReceivedRows, setCareReceivedRows] = useState<any[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedLoaded, setReceivedLoaded] = useState(false);
  const [receivedError, setReceivedError] = useState<string | null>(null);

  const [likedPets, setLikedPets] = useState<any[]>([]);

  const [likedLoading, setLikedLoading] = useState(false);
  const [likedLoaded, setLikedLoaded] = useState(false);
  const [likedError, setLikedError] = useState<string | null>(null);

  const [stats, setStats] = useState({ points: 0, careGiven: 0, careReceived: 0 });

  const showToast = useToastStore((s) => s.showToast);
  const [availabilityErrorDialog, setAvailabilityErrorDialog] = useState<{
    title: string;
    description: string;
  } | null>(null);

  const onAvailableChange = (value: boolean) => {
    if (!user?.id || value === available) return;
    void (async () => {
      const previous = available;
      setAvailabilityLoading(true);
      // Optimistic UI: the switch should move immediately, then rollback on failure.
      setAvailable(value);
      try {
        const { data: row, error: rowErr } = await supabase
          .from('taker_profiles')
          .select(
            'availability_json,accepted_species,max_pets,hourly_points,experience_years',
          )
          .eq('user_id', user.id)
          .maybeSingle();

        if (rowErr && !isMissingBackendResourceError(rowErr)) throw rowErr;

        const baseAvailabilityJson: Record<string, any> = row?.availability_json
          ? (row.availability_json as Record<string, any>)
          : {
            available: value,
            services: [],
            days: [],
            startTime: '08:00',
            endTime: '21:00',
            petOwner: 'no',
            yardType: '',
            petKinds: [],
            note: '',
          };

        const nextAvailabilityJson = {
          ...baseAvailabilityJson,
          available: value,
        };

        const { error: upsertErr } = await supabase
          .from('taker_profiles')
          .upsert(
            {
              user_id: user.id,
              accepted_species: (row?.accepted_species ?? []) as any,
              max_pets: row?.max_pets ?? 0,
              hourly_points: row?.hourly_points ?? 0,
              experience_years: row?.experience_years ?? 0,
              availability_json: nextAvailabilityJson,
            },
            { onConflict: 'user_id' },
          );

        if (upsertErr) throw upsertErr;

        setAvailable(value);
        if (value) {
          showToast({
            variant: 'success',
            message: `${t('myCare.nowAvailableSnackbar')} ${t('myCare.availableHighlight')}`,
            durationMs: 3200,
          });
        }
      } catch (err) {
        setAvailable(previous);
        const details = errorMessageFromUnknown(
          err,
          t("common.error", "Something went wrong"),
        );
        const friendly = t("myCare.availabilityUpdateFailed", "Couldn't update availability. Please try again.");
        setAvailabilityErrorDialog({
          title: t("common.error", "Something went wrong"),
          description: `${friendly}\n\nDetails: ${details}`,
        });
      } finally {
        setAvailabilityLoading(false);
      }
    })();
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
          disabled={availabilityLoading}
          onValueChange={onAvailableChange}
        />
      </View>
    </View>
  );

  const loadMyAvailability = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh && !availabilityLoaded) setAvailabilityLoading(true);
    try {
      const { data: row, error: rowErr } = await supabase
        .from('taker_profiles')
        .select('availability_json')
        .eq('user_id', user.id)
        .maybeSingle();

      if (rowErr && !isMissingBackendResourceError(rowErr)) throw rowErr;

      const availabilityRaw =
        (row?.availability_json as Record<string, any> | null) ?? null;
      setAvailable(Boolean(availabilityRaw?.available));
      setAvailabilityLoaded(true);
    } catch {
      setAvailable(false);
      setAvailabilityLoaded(true);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const loadActiveCareCard = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setActiveCareLoading(true);
    setActiveCareError(null);
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("*")
        .or(`owner_id.eq.${user.id},taker_id.eq.${user.id}`)
        .eq("status", "active");

      if (contractsError && !isMissingBackendResourceError(contractsError))
        throw contractsError;

      const safeContracts = (contracts ?? []) as TablesRow<'contracts'>[];
      const activeContract = safeContracts[0] ?? null;
      if (!activeContract) {
        setHasActiveCare(false);
        setActiveCare(null);
        setActiveCareLoaded(true);
        return;
      }

      const { data: reqRaw, error: reqError } = await supabase
        .from("care_requests")
        .select("*")
        .eq("id", activeContract.request_id)
        .maybeSingle();

      if (reqError && !isMissingBackendResourceError(reqError))
        throw reqError;
      const req = reqRaw as TablesRow<"care_requests"> | null;

      const peerId =
        activeContract.owner_id === user.id
          ? activeContract.taker_id
          : activeContract.owner_id;

      const [{ data: peerUser, error: peerErr }, { data: pet, error: petErr }] =
        await Promise.all([
          peerId
            ? supabase
                .from("users")
                .select("id,full_name,avatar_url")
                .eq("id", peerId)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null } as any),
          req?.pet_id
            ? supabase.from("pets").select("*").eq("id", req.pet_id).maybeSingle()
            : Promise.resolve({ data: null, error: null } as any),
        ]);

      if (peerErr && !isMissingBackendResourceError(peerErr)) throw peerErr;
      if (petErr && !isMissingBackendResourceError(petErr)) throw petErr;

      setHasActiveCare(true);
      setActiveCare({
        petName: pet?.name ?? "Pet",
        careType: req?.care_type ?? "care",
        dayLabel: req?.start_date
          ? new Date(req.start_date).toLocaleDateString()
          : "",
        caregiverName: resolveDisplayName(peerUser) || "Caregiver",
        caregiverAvatar: peerUser?.avatar_url ?? "",
        endsIn: req?.end_date ? new Date(req.end_date).toLocaleDateString() : "",
      });
      setActiveCareLoaded(true);
    } catch (err) {
      if (isMissingBackendResourceError(err)) {
        setHasActiveCare(false);
        setActiveCare(null);
        setActiveCareError(null);
        setActiveCareLoaded(true);
        return;
      }
      setActiveCareError(
        errorMessageFromUnknown(err, "Failed to load active care."),
      );
    } finally {
      setActiveCareLoading(false);
    }
  };

  const loadCareGivenTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setGivenLoading(true);
    setGivenError(null);
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("*")
        .eq("taker_id", user.id);

      if (contractsError && !isMissingBackendResourceError(contractsError))
        throw contractsError;

      const safeContracts = (contracts ?? []) as TablesRow<"contracts">[];
      if (safeContracts.length === 0) {
        setCareGivenRows([]);
        setStats((s) => ({ ...s, careGiven: 0 }));
        setGivenLoaded(true);
        return;
      }

      const requestIds = Array.from(
        new Set(safeContracts.map((c: any) => c.request_id).filter(Boolean)),
      );
      const peerIds = Array.from(
        new Set(safeContracts.map((c: any) => c.owner_id).filter(Boolean)),
      );

      const { data: requests, error: requestsError } = requestIds.length
        ? await supabase
            .from("care_requests")
            .select("id,pet_id,care_type")
            .in("id", requestIds)
        : { data: [], error: null };

      if (requestsError && !isMissingBackendResourceError(requestsError))
        throw requestsError;

      const petIds = Array.from(
        new Set((requests ?? []).map((r: any) => r.pet_id).filter(Boolean)),
      );

      const { data: peers, error: peersError } = peerIds.length
        ? await supabase
            .from("users")
            .select("id,full_name,avatar_url")
            .in("id", peerIds)
        : { data: [], error: null };

      if (peersError && !isMissingBackendResourceError(peersError))
        throw peersError;

      const { data: pets, error: petsError } = petIds.length
        ? await supabase
            .from("pets")
            .select("id,name")
            .in("id", petIds)
        : { data: [], error: null };

      if (petsError && !isMissingBackendResourceError(petsError))
        throw petsError;

      const reqById = (requests ?? []).reduce<Record<string, unknown>>(
        (acc, r: any) => ({ ...acc, [r.id]: r }),
        {},
      );
      const peersById = (peers ?? []).reduce<Record<string, unknown>>(
        (acc, u: any) => ({ ...acc, [u.id]: u }),
        {},
      );
      const petsById = (pets ?? []).reduce<Record<string, unknown>>(
        (acc, p: any) => ({ ...acc, [p.id]: p }),
        {},
      );

      const rows = safeContracts.map((c: any) => {
        const peer = peersById[c.owner_id] as any;
        const req = reqById[c.request_id] as any;
        const pet = req?.pet_id ? (petsById[req.pet_id] as any) : null;
        return {
          id: c.id,
          ownerName: resolveDisplayName(peer) || "Pet owner",
          ownerAvatar: peer?.avatar_url ?? "",
          handshakes: 0,
          paws: 0,
          pet: pet?.name ?? "Pet",
          careType: req?.care_type ?? "care",
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
        };
      });

      setCareGivenRows(rows);
      setStats((s) => ({ ...s, careGiven: rows.length }));
      setGivenLoaded(true);
    } catch (err) {
      if (isMissingBackendResourceError(err)) {
        setCareGivenRows([]);
        setGivenLoaded(true);
        setGivenError(null);
        setStats((s) => ({ ...s, careGiven: 0 }));
        return;
      }
      setGivenError(
        errorMessageFromUnknown(err, "Failed to load care given."),
      );
    } finally {
      setGivenLoading(false);
    }
  };

  const loadCareReceivedTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setReceivedLoading(true);
    setReceivedError(null);
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("*")
        .eq("owner_id", user.id);

      if (contractsError && !isMissingBackendResourceError(contractsError))
        throw contractsError;

      const safeContracts = (contracts ?? []) as TablesRow<"contracts">[];
      if (safeContracts.length === 0) {
        setCareReceivedRows([]);
        setStats((s) => ({ ...s, careReceived: 0 }));
        setReceivedLoaded(true);
        return;
      }

      const requestIds = Array.from(
        new Set(safeContracts.map((c: any) => c.request_id).filter(Boolean)),
      );
      const peerIds = Array.from(
        new Set(safeContracts.map((c: any) => c.taker_id).filter(Boolean)),
      );

      const { data: requests, error: requestsError } = requestIds.length
        ? await supabase
            .from("care_requests")
            .select("id,pet_id,care_type")
            .in("id", requestIds)
        : { data: [], error: null };

      if (requestsError && !isMissingBackendResourceError(requestsError))
        throw requestsError;

      const petIds = Array.from(
        new Set((requests ?? []).map((r: any) => r.pet_id).filter(Boolean)),
      );

      const { data: peers, error: peersError } = peerIds.length
        ? await supabase
            .from("users")
            .select("id,full_name,avatar_url")
            .in("id", peerIds)
        : { data: [], error: null };

      if (peersError && !isMissingBackendResourceError(peersError))
        throw peersError;

      const { data: pets, error: petsError } = petIds.length
        ? await supabase
            .from("pets")
            .select("id,name")
            .in("id", petIds)
        : { data: [], error: null };

      if (petsError && !isMissingBackendResourceError(petsError))
        throw petsError;

      const reqById = (requests ?? []).reduce<Record<string, unknown>>(
        (acc, r: any) => ({ ...acc, [r.id]: r }),
        {},
      );
      const peersById = (peers ?? []).reduce<Record<string, unknown>>(
        (acc, u: any) => ({ ...acc, [u.id]: u }),
        {},
      );
      const petsById = (pets ?? []).reduce<Record<string, unknown>>(
        (acc, p: any) => ({ ...acc, [p.id]: p }),
        {},
      );

      const rows = safeContracts.map((c: any) => {
        const peer = peersById[c.taker_id] as any;
        const req = reqById[c.request_id] as any;
        const pet = req?.pet_id ? (petsById[req.pet_id] as any) : null;
        return {
          id: c.id,
          personName: resolveDisplayName(peer) || "Taker",
          personAvatar: peer?.avatar_url ?? "",
          handshakes: 0,
          paws: 0,
          pet: pet?.name ?? "Pet",
          careType: req?.care_type ?? "care",
          date: c.created_at ? new Date(c.created_at).toLocaleDateString() : "",
        };
      });

      setCareReceivedRows(rows);
      setStats((s) => ({ ...s, careReceived: rows.length }));
      setReceivedLoaded(true);
    } catch (err) {
      if (isMissingBackendResourceError(err)) {
        setCareReceivedRows([]);
        setReceivedLoaded(true);
        setReceivedError(null);
        setStats((s) => ({ ...s, careReceived: 0 }));
        return;
      }
      setReceivedError(
        errorMessageFromUnknown(err, "Failed to load care received."),
      );
    } finally {
      setReceivedLoading(false);
    }
  };

  const loadLikedTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setLikedLoading(true);
    setLikedError(null);
    try {
      const { data: requests, error: requestsError } = await supabase
        .from("care_requests")
        .select("id,pet_id,start_date,end_date,owner_id,status")
        .neq("owner_id", user.id)
        .eq("status", "open");

      if (requestsError && !isMissingBackendResourceError(requestsError))
        throw requestsError;

      const safeRequests = requests ?? [];
      if (safeRequests.length === 0) {
        setLikedPets([]);
        setLikedLoaded(true);
        return;
      }

      const petIds = Array.from(
        new Set(safeRequests.map((r: any) => r.pet_id).filter(Boolean)),
      );

      const { data: pets, error: petsError } = petIds.length
        ? await supabase
            .from("pets")
            .select(
              "id,photo_urls,name,breed,species,notes,yard_type,age_range,energy_level",
            )
            .in("id", petIds)
        : { data: [], error: null };

      if (petsError && !isMissingBackendResourceError(petsError))
        throw petsError;

      const petsById = (pets ?? []).reduce<Record<string, unknown>>(
        (acc, p: any) => ({ ...acc, [p.id]: p }),
        {},
      );

      const liked = safeRequests.slice(0, 8).map((r: any) => {
        const pet = petsById[r.pet_id] as any;
        const parsed = parsePetNotes(pet?.notes);
        return {
          id: r.id,
          requestId: r.id,
          imageSource: petGalleryUrls(pet ?? {})[0] ?? "",
          petName: pet?.name ?? "Pet",
          breed: pet?.breed ?? "Unknown breed",
          petType: pet?.species ?? "Pet",
          bio: parsed.bio || pet?.notes || "No details yet.",
          yardType: pet?.yard_type ?? parsed.yardType ?? undefined,
          ageRange: pet?.age_range ?? parsed.ageRange ?? undefined,
          energyLevel: pet?.energy_level ?? parsed.energyLevel ?? undefined,
          tags: [],
          seekingDateRange:
            r.start_date && r.end_date
              ? `${new Date(r.start_date).toLocaleDateString()} - ${new Date(r.end_date).toLocaleDateString()}`
              : "",
          seekingTime: "",
          isSeeking: true,
        };
      });

      setLikedPets(liked);
      setLikedLoaded(true);
    } catch (err) {
      if (isMissingBackendResourceError(err)) {
        setLikedPets([]);
        setLikedLoaded(true);
        setLikedError(null);
        return;
      }
      setLikedError(
        errorMessageFromUnknown(err, "Failed to load liked pets."),
      );
    } finally {
      setLikedLoading(false);
    }
  };

  useEffect(() => {
    setStats((s) => ({ ...s, points: profile?.points_balance ?? 0 }));
  }, [profile?.points_balance]);

  useEffect(() => {
    if (!user?.id) return;
    if (!availabilityLoaded && !availabilityLoading) {
      void loadMyAvailability();
    }
  }, [user?.id, availabilityLoaded, availabilityLoading]);

  useEffect(() => {
    if (!user?.id) return;
    if (!activeCareLoaded && !activeCareLoading) {
      void loadActiveCareCard();
    }
  }, [user?.id, activeCareLoaded, activeCareLoading]);

  useEffect(() => {
    if (!user?.id) return;

    if (activeTab === "given" && !givenLoaded && !givenLoading && !givenError) {
      void loadCareGivenTab();
    }
    if (
      activeTab === "received" &&
      !receivedLoaded &&
      !receivedLoading &&
      !receivedError
    ) {
      void loadCareReceivedTab();
    }
    if (activeTab === "liked" && !likedLoaded && !likedLoading && !likedError) {
      void loadLikedTab();
    }
  }, [
    activeTab,
    user?.id,
    givenLoaded,
    givenLoading,
    givenError,
    receivedLoaded,
    receivedLoading,
    receivedError,
    likedLoaded,
    likedLoading,
    likedError,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMyAvailability({ refresh: true });
      await loadActiveCareCard({ refresh: true });
      if (activeTab === "given") await loadCareGivenTab({ refresh: true });
      if (activeTab === "received")
        await loadCareReceivedTab({ refresh: true });
      if (activeTab === "liked") await loadLikedTab({ refresh: true });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <PageContainer scrollable={false} contentStyle={styles.pageContent}>
      {Header}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceContainerLow}
          />
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
          <>
            {givenLoading ? (
              <DataState
                title={t("common.loading", "Loading...")}
                message={t("myCare.loadingGiven", "Loading care given...")}
              />
            ) : givenError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={givenError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setGivenError(null);
                  setGivenLoaded(false);
                  void loadCareGivenTab({ refresh: true });
                }}
              />
            ) : (
              <CareGivenTab colors={colors as any} rows={careGivenRows} />
            )}
          </>
        )}
        {activeTab === 'received' && (
          <>
            {receivedLoading ? (
              <DataState
                title={t("common.loading", "Loading...")}
                message={t("myCare.loadingReceived", "Loading care received...")}
              />
            ) : receivedError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={receivedError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setReceivedError(null);
                  setReceivedLoaded(false);
                  void loadCareReceivedTab({ refresh: true });
                }}
              />
            ) : (
              <CareReceivedTab colors={colors as any} rows={careReceivedRows} />
            )}
          </>
        )}
        {activeTab === 'liked' && (
          <>
            {likedLoading ? (
              <DataState
                title={t("common.loading", "Loading...")}
                message={t("myCare.loadingLiked", "Loading liked pets...")}
              />
            ) : likedError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={likedError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setLikedError(null);
                  setLikedLoaded(false);
                  void loadLikedTab({ refresh: true });
                }}
              />
            ) : likedPets.length === 0 ? (
              <DataState
                title={t("myCare.likedEmptyTitle", "Nothing to show yet")}
                message={t(
                  "myCare.likedEmptyMessage",
                  "When you like care requests, they will appear here.",
                )}
                illustration={
                  <AppImage
                    source={require('@/assets/illustrations/pets/no-pet.svg')}
                    type="svg"
                    height={145}
                    style={{ width: 140, borderRadius: 16, backgroundColor: "transparent" }}
                  />
                }
              />
            ) : (
              <LikedTab
                colors={colors as any}
                pets={likedPets}
                onApply={(requestId) => {
                  if (blockIfKycNotApproved()) return;
                  router.push(`/(private)/post-requests/${requestId}` as any);
                }}
              />
            )}
          </>
        )}
      </ScrollView>

      <FeedbackModal
        visible={availabilityErrorDialog !== null}
        title={availabilityErrorDialog?.title ?? ""}
        description={availabilityErrorDialog?.description}
        primaryLabel={t("common.ok", "OK")}
        onPrimary={() => setAvailabilityErrorDialog(null)}
        onRequestClose={() => setAvailabilityErrorDialog(null)}
      />
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
    flexGrow: 1,
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
