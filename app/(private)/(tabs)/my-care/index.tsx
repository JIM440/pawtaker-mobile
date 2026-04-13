import { Colors } from "@/src/constants/colors";
import { EmptyState } from "@/src/features/my-care/components/EmptyState";
import { MyCareInCareMenu } from "@/src/features/my-care/components/MyCareInCareMenu";
import { MyCareStatsSection } from "@/src/features/my-care/components/MyCareStatsSection";
import { useFocusEffect } from "@react-navigation/native";
import {
  formatCompactDate,
  formatRequestDateRange,
  formatRequestTimeRange,
} from "@/src/lib/datetime/request-date-time-format";
import { completeExpiredContractsForUser } from "@/src/lib/contracts/complete-expired-contracts";
import { blockIfKycNotApproved } from "@/src/lib/kyc/kyc-gate";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { isRequestSeekingActive } from "@/src/lib/requests/is-request-seeking-active";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import {
  errorMessageFromUnknown,
  isMissingBackendResourceError,
} from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PageContainer } from "@/src/shared/components/layout";
import { ProfilePetsTabSkeleton } from "@/src/shared/components/skeletons/ProfileTabSkeletons";
import { ErrorState } from "@/src/shared/components/ui";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppSwitch } from "@/src/shared/components/ui/AppSwitch";
import { AppText } from "@/src/shared/components/ui/AppText";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import {
  MoreHorizontal,
  Sun,
} from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Feature Components
import { CareGivenTab } from "@/src/features/my-care/components/CareGivenTab";
import { CareReceivedTab } from "@/src/features/my-care/components/CareReceivedTab";
import { LikedTab } from "@/src/features/my-care/components/LikedTab";
import { CareRow } from "@/src/features/my-care/components/CareTable";
import { useOrCreateThread } from "@/src/features/messages/hooks/useOrCreateThread";
import { useRouter } from "expo-router";

// Constants
type TabId = "given" | "received" | "liked";

export default function MyCareScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, profile, fetchProfile } = useAuthStore();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [refreshing, setRefreshing] = useState(false);
  const [available, setAvailable] = useState(false);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("given");
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

  const [stats, setStats] = useState({
    points: 0,
    careGiven: 0,
    careReceived: 0,
  });

  const showToast = useToastStore((s) => s.showToast);
  const { openThread } = useOrCreateThread();
  const [hasAvailabilityProfile, setHasAvailabilityProfile] = useState(false);

  const onAvailableChange = (value: boolean) => {
    if (!user?.id || value === available) return;
    void (async () => {
      const previous = available;
      setAvailabilityLoading(true);
      // Optimistic UI: the switch should move immediately, then rollback on failure.
      setAvailable(value);
      try {
        const { data: row, error: rowErr } = await supabase
          .from("taker_profiles")
          .select(
            "availability_json,accepted_species,max_pets,hourly_points,experience_years",
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (rowErr && !isMissingBackendResourceError(rowErr)) throw rowErr;

        const baseAvailabilityJson: Record<string, any> = row?.availability_json
          ? (row.availability_json as Record<string, any>)
          : {
              available: value,
              services: [],
              days: [],
              startTime: "08:00",
              endTime: "21:00",
              petOwner: "no",
              yardType: "",
              petKinds: [],
              note: "",
            };

        const nextAvailabilityJson = {
          ...baseAvailabilityJson,
          available: value,
        };

        const { error: upsertErr } = await supabase
          .from("taker_profiles")
          .upsert(
            {
              user_id: user.id,
              accepted_species: (row?.accepted_species ?? []) as any,
              max_pets: row?.max_pets ?? 0,
              hourly_points: row?.hourly_points ?? 0,
              experience_years: row?.experience_years ?? 0,
              availability_json: nextAvailabilityJson,
            },
            { onConflict: "user_id" },
          );

        if (upsertErr) throw upsertErr;

        setAvailable(value);
        showToast({
          variant: "success",
          message: value
            ? `${t("myCare.nowAvailableSnackbar")} ${t("myCare.availableHighlight")}`
            : t("profile.edit.availabilityToast", "Availability updated."),
          durationMs: 2800,
        });
      } catch (err) {
        setAvailable(previous);
        const details = errorMessageFromUnknown(
          err,
          t(
            "myCare.availabilityUpdateFailed",
            "We couldn't update your availability right now.",
          ),
        );
        showToast({
          variant: "error",
          message: details,
          durationMs: 3400,
        });
      } finally {
        setAvailabilityLoading(false);
      }
    })();
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "given", label: t("myCare.tabs.careGiven") },
    { id: "received", label: t("myCare.tabs.careReceived") },
    { id: "liked", label: t("myCare.tabs.liked") },
  ];

  const Header = (
    <View style={styles.header}>
      <AppText variant="headline" style={{ fontSize: 22 }}>
        {t("myCare.title")}
      </AppText>
      <View style={styles.availableRow}>
        <AppText variant="body" color={colors.onSurfaceVariant}>
          {t("myCare.available")}
        </AppText>
        {!hasAvailabilityProfile ? (
          <Pressable
            onPress={() => {
              if (availabilityLoading) return;
              showToast({
                variant: "info",
                message: t("myCare.availabilityProfileRequired"),
                durationMs: 3200,
              });
            }}
            hitSlop={8}
          >
            <AppSwitch value={available} disabled onValueChange={() => {}} />
          </Pressable>
        ) : (
          <AppSwitch
            value={available}
            disabled={availabilityLoading}
            onValueChange={onAvailableChange}
          />
        )}
      </View>
    </View>
  );

  const loadMyAvailability = useCallback(async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh && !availabilityLoaded) setAvailabilityLoading(true);
    try {
      const { data: row, error: rowErr } = await supabase
        .from("taker_profiles")
        .select("availability_json")
        .eq("user_id", user.id)
        .maybeSingle();

      if (rowErr && !isMissingBackendResourceError(rowErr)) throw rowErr;

      const availabilityRaw =
        (row?.availability_json as Record<string, any> | null) ?? null;
      setHasAvailabilityProfile(Boolean(row));
      setAvailable(Boolean(availabilityRaw?.available));
      setAvailabilityLoaded(true);
    } catch {
      setHasAvailabilityProfile(false);
      setAvailable(false);
      setAvailabilityLoaded(true);
    } finally {
      setAvailabilityLoading(false);
    }
  }, [availabilityLoaded, user?.id]);

  const loadActiveCareCard = useCallback(async (opts?: { refresh?: boolean }) => {
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

      const safeContracts = (contracts ?? []) as TablesRow<"contracts">[];
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

      if (reqError && !isMissingBackendResourceError(reqError)) throw reqError;
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
            ? supabase
                .from("pets")
                .select("*")
                .eq("id", req.pet_id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null } as any),
        ]);

      if (peerErr && !isMissingBackendResourceError(peerErr)) throw peerErr;
      if (petErr && !isMissingBackendResourceError(petErr)) throw petErr;

      setHasActiveCare(true);
      setActiveCare({
        contractId: activeContract.id,
        requestId: activeContract.request_id,
        peerId,
        petName: pet?.name ?? "Pet",
        careType: req?.care_type ?? "care",
        dayLabel: req?.start_date
          ? formatCompactDate(req.start_date)
          : "",
        caregiverName: resolveDisplayName(peerUser) || "Caregiver",
        caregiverAvatar: peerUser?.avatar_url ?? "",
        endsIn: req?.end_date
          ? formatCompactDate(req.end_date)
          : "",
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
  }, [user?.id]);

  const loadCareGivenTab = useCallback(async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setGivenLoading(true);
    setGivenError(null);
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("*")
        .eq("taker_id", user.id)
        .eq("status", "completed");

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
            .select("id,pet_id,care_type,start_date")
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
        ? await supabase.from("pets").select("id,name").in("id", petIds)
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

      const contractsByRequestStart = [...safeContracts].sort((c1, c2) => {
        const r1 = reqById[c1.request_id] as { start_date?: string } | undefined;
        const r2 = reqById[c2.request_id] as { start_date?: string } | undefined;
        return String(r2?.start_date ?? "").localeCompare(
          String(r1?.start_date ?? ""),
        );
      });

      const rows = contractsByRequestStart.map((c: any) => {
        const peer = peersById[c.owner_id] as any;
        const req = reqById[c.request_id] as any;
        const pet = req?.pet_id ? (petsById[req.pet_id] as any) : null;
        return {
          id: c.id,
          contractId: c.id,
          petId: req?.pet_id ?? undefined,
          ownerId: c.owner_id ?? undefined,
          ownerName: resolveDisplayName(peer) || "Pet owner",
          ownerAvatar: peer?.avatar_url ?? "",
          handshakes: 0,
          paws: 0,
          pet: pet?.name ?? "Pet",
          careType: req?.care_type ?? "care",
          date: c.created_at ? formatCompactDate(c.created_at) : "",
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
      setGivenError(errorMessageFromUnknown(err, "Failed to load care given."));
    } finally {
      setGivenLoading(false);
    }
  }, [user?.id]);

  const loadCareReceivedTab = useCallback(async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setReceivedLoading(true);
    setReceivedError(null);
    try {
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("*")
        .eq("owner_id", user.id)
        .eq("status", "completed");

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
            .select("id,pet_id,care_type,start_date")
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
        ? await supabase.from("pets").select("id,name").in("id", petIds)
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

      const contractsByRequestStart = [...safeContracts].sort((c1, c2) => {
        const r1 = reqById[c1.request_id] as { start_date?: string } | undefined;
        const r2 = reqById[c2.request_id] as { start_date?: string } | undefined;
        return String(r2?.start_date ?? "").localeCompare(
          String(r1?.start_date ?? ""),
        );
      });

      const rows = contractsByRequestStart.map((c: any) => {
        const peer = peersById[c.taker_id] as any;
        const req = reqById[c.request_id] as any;
        const pet = req?.pet_id ? (petsById[req.pet_id] as any) : null;
        return {
          id: c.id,
          contractId: c.id,
          petId: req?.pet_id ?? undefined,
          personId: c.taker_id ?? undefined,
          personName: resolveDisplayName(peer) || "Taker",
          personAvatar: peer?.avatar_url ?? "",
          handshakes: 0,
          paws: 0,
          pet: pet?.name ?? "Pet",
          careType: req?.care_type ?? "care",
          date: c.created_at ? formatCompactDate(c.created_at) : "",
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
  }, [user?.id]);

  const loadLikedTab = useCallback(async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setLikedLoading(true);
    setLikedError(null);
    try {
      const { data: likes, error: likesError } = await supabase
        .from("pet_likes")
        .select("pet_id,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (likesError && !isMissingBackendResourceError(likesError))
        throw likesError;

      const safeLikes = likes ?? [];
      if (safeLikes.length === 0) {
        setLikedPets([]);
        setLikedLoaded(true);
        return;
      }

      const petIds = Array.from(
        new Set(
          safeLikes.map((l: { pet_id: string }) => l.pet_id).filter(Boolean),
        ),
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

      const { data: openReqs, error: reqErr } = petIds.length
        ? await supabase
            .from("care_requests")
            .select(
              "id,pet_id,start_date,end_date,start_time,end_time,owner_id,status,created_at",
            )
            .in("pet_id", petIds)
            .neq("owner_id", user.id)
            .eq("status", "open")
            .order("start_date", { ascending: false })
            .order("created_at", { ascending: false })
        : { data: [], error: null };

      if (reqErr && !isMissingBackendResourceError(reqErr)) throw reqErr;

      const openReqByPetId: Record<
        string,
        {
          id: string;
          pet_id: string;
          start_date: string;
          end_date: string;
          start_time?: string;
          end_time?: string;
        }
      > = {};
      for (const r of openReqs ?? []) {
        const row = r as {
          id: string;
          pet_id: string;
          start_date: string;
          end_date: string;
          start_time?: string;
          end_time?: string;
          status?: string;
          taker_id?: string | null;
        };
        if (!isRequestSeekingActive(row)) continue;
        if (row.pet_id && !openReqByPetId[row.pet_id])
          openReqByPetId[row.pet_id] = row;
      }

      const liked = safeLikes.map((like: { pet_id: string }) => {
        const pet = petsById[like.pet_id] as any;
        const parsed = parsePetNotes(pet?.notes);
        const req = openReqByPetId[like.pet_id];
        const isSeeking = isRequestSeekingActive(req);
        return {
          petId: like.pet_id,
          requestId: req?.id ?? null,
          imageSource: pet ? (petGalleryUrls(pet ?? {})[0] ?? "") : "",
          petName: pet?.name ?? "Pet",
          breed: pet?.breed ?? "Unknown breed",
          petType: pet?.species ?? "Pet",
          bio: parsed.bio || pet?.notes || "No details yet.",
          yardType: pet?.yard_type ?? parsed.yardType ?? undefined,
          ageRange: pet?.age_range ?? parsed.ageRange ?? undefined,
          energyLevel: pet?.energy_level ?? parsed.energyLevel ?? undefined,
          tags: [],
          seekingDateRange: isSeeking
            ? formatRequestDateRange(req?.start_date, req?.end_date)
            : undefined,
          seekingTime: isSeeking
            ? formatRequestTimeRange(req?.start_time, req?.end_time)
            : undefined,
          isSeeking,
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
      setLikedError(errorMessageFromUnknown(err, "Failed to load liked pets."));
    } finally {
      setLikedLoading(false);
    }
  }, [user?.id]);

  const removePetLike = async (petId: string) => {
    if (!user?.id || !petId) return;
    try {
      const { error } = await supabase
        .from("pet_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("pet_id", petId);
      if (error) throw error;
      setLikedPets((prev) =>
        prev.filter((p: { petId: string }) => p.petId !== petId),
      );
      showToast({
        variant: "success",
        message: t("myCare.removedFromLiked", "Removed from liked pets."),
        durationMs: 2200,
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t(
            "myCare.removeLikeFailed",
            "We couldn't remove this pet from your liked list.",
          ),
        ),
        durationMs: 3200,
      });
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
  }, [
    availabilityLoaded,
    availabilityLoading,
    loadMyAvailability,
    user?.id,
  ]);

  useEffect(() => {
    if (!user?.id) return;
    if (!activeCareLoaded && !activeCareLoading) {
      void loadActiveCareCard();
    }
  }, [activeCareLoaded, activeCareLoading, loadActiveCareCard, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    if (!givenLoaded && !givenLoading && !givenError) {
      void loadCareGivenTab();
    }
    if (!receivedLoaded && !receivedLoading && !receivedError) {
      void loadCareReceivedTab();
    }
    if (!likedLoaded && !likedLoading && !likedError) {
      void loadLikedTab();
    }
  }, [
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
    loadCareGivenTab,
    loadCareReceivedTab,
    loadLikedTab,
  ]);

  const refreshScreenData = useCallback(async () => {
    if (!user?.id) return;

    await completeExpiredContractsForUser(user.id);
    await fetchProfile(user.id);
    await Promise.all([
      loadMyAvailability({ refresh: true }),
      loadActiveCareCard({ refresh: true }),
      loadCareGivenTab({ refresh: true }),
      loadCareReceivedTab({ refresh: true }),
      loadLikedTab({ refresh: true }),
    ]);
  }, [
    fetchProfile,
    loadActiveCareCard,
    loadCareGivenTab,
    loadCareReceivedTab,
    loadLikedTab,
    loadMyAvailability,
    user?.id,
  ]);

  useFocusEffect(
    useCallback(() => {
      void refreshScreenData();
    }, [refreshScreenData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshScreenData();
    } finally {
      setRefreshing(false);
    }
  };

  const onPressCarePerson = (row: CareRow) => {
    if (!row.personId) return;
    router.push({
                pathname: "/(private)/(tabs)/(home)/users/[id]",
      params: { id: row.personId },
    });
  };

  const onPressCarePet = (row: CareRow) => {
    const agreementId = row.contractId ?? row.id;
    if (!agreementId) return;
    router.push(`/(private)/(tabs)/my-care/contract/${agreementId}` as any);
  };

  const onGoToInCareChat = async () => {
    setMenuVisible(false);
    const otherUserId = activeCare?.peerId as string | undefined;
    const requestId = activeCare?.requestId as string | undefined;
    if (!otherUserId) return;
    const result = await openThread(otherUserId, requestId);
    if (!result.ok) {
      showToast({ variant: "error", message: result.message, durationMs: 3200 });
    }
  };

  const onViewInCareAgreement = () => {
    setMenuVisible(false);
    const agreementId = activeCare?.contractId as string | undefined;
    if (!agreementId) return;
    router.push(`/(private)/(tabs)/my-care/contract/${agreementId}` as any);
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
          <View
            style={[
              styles.inCareCard,
              { backgroundColor: colors.surfaceContainerLow },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderTitleGroup}>
                <AppText
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  style={styles.inCareLabel}
                >
                  {t("myCare.inCare")}
                </AppText>
                <AppText variant="bodyLarge" style={styles.inCarePetName}>
                  {activeCare.petName}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setMenuVisible(true)}>
                <MoreHorizontal
                  size={24}
                  color={colors.onSurface}
                  strokeWidth={2.5}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inCareBody}>
              <View style={styles.metaPills}>
                <View
                  style={[
                    styles.metaPill,
                    { backgroundColor: colors.surfaceContainerHighest },
                  ]}
                >
                  <Sun size={14} color={colors.onSurfaceVariant} />
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    {activeCare.careType}
                  </AppText>
                </View>
                <View
                  style={[
                    styles.metaPill,
                    { backgroundColor: colors.surfaceContainerHighest },
                  ]}
                >
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    {activeCare.dayLabel}
                  </AppText>
                </View>
              </View>

              <View style={styles.caregiverAndTimerRow}>
                <View style={styles.caregiverMain}>
                  <AppImage
                    source={{ uri: activeCare.caregiverAvatar }}
                    style={styles.caregiverAvatar}
                    contentFit="cover"
                  />
                  <AppText variant="body" color={colors.onSurfaceVariant}>
                    {activeCare.caregiverName}
                  </AppText>
                </View>
                <View style={styles.timerRow}>
                  <AppText
                    variant="caption"
                    color={colors.primary}
                    style={{ fontWeight: 600 }}
                  >
                    • {t("myCare.endsIn", { time: activeCare.endsIn })}
                  </AppText>
                </View>
              </View>
            </View>
          </View>
        )}

        <MyCareInCareMenu
          visible={menuVisible}
          colors={colors}
          styles={styles}
          t={(key, fallback) => t(key, fallback as string)}
          onClose={() => setMenuVisible(false)}
          onGoToChat={() => void onGoToInCareChat()}
          onViewAgreement={onViewInCareAgreement}
        />

        <MyCareStatsSection
          hasActiveCare={hasActiveCare}
          activeTab={activeTab}
          stats={stats}
          colors={colors}
          styles={styles}
          t={t as any}
        />

        {/* Tabs */}
        <TabBar
          tabs={tabs.map((t) => ({ key: t.id, label: t.label }))}
          activeKey={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />

        {/* Tab content */}
        {activeTab === "given" && (
          <>
            {givenError ? (
              <ErrorState
                error={givenError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setGivenError(null);
                  setGivenLoaded(false);
                  void loadCareGivenTab({ refresh: true });
                }}
                mode="inline"
              />
            ) : (
              <CareGivenTab
                colors={colors as any}
                rows={careGivenRows}
                loading={givenLoading}
                onPressPerson={onPressCarePerson}
                onPressPet={onPressCarePet}
              />
            )}
          </>
        )}
        {activeTab === "received" && (
          <>
            {receivedError ? (
              <ErrorState
                error={receivedError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setReceivedError(null);
                  setReceivedLoaded(false);
                  void loadCareReceivedTab({ refresh: true });
                }}
                mode="inline"
              />
            ) : (
              <CareReceivedTab
                colors={colors as any}
                rows={careReceivedRows}
                loading={receivedLoading}
                onPressPerson={onPressCarePerson}
                onPressPet={onPressCarePet}
              />
            )}
          </>
        )}
        {activeTab === "liked" && (
          <>
            {likedLoading ? (
              <ProfilePetsTabSkeleton count={3} />
            ) : likedError ? (
              <ErrorState
                error={likedError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setLikedError(null);
                  setLikedLoaded(false);
                  void loadLikedTab({ refresh: true });
                }}
                mode="inline"
              />
            ) : likedPets.length === 0 ? (
              <EmptyState variant="liked" />
            ) : (
              <LikedTab
                colors={colors as any}
                pets={likedPets}
                onApply={(requestId, petId) => {
                  if (blockIfKycNotApproved()) return;
                  if (requestId) {
                    router.push(`/(private)/post-requests/${requestId}` as any);
                  } else {
                    router.push(`/(private)/pets/${petId}` as any);
                  }
                }}
                onRemovePet={(petId) => void removePetLike(petId)}
              />
            )}
          </>
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
    flexGrow: 1,
    paddingBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingHorizontal: 16,
  },
  availableRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inCareCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    position: "relative",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderTitleGroup: {
    alignItems: "center",
    gap: 8,
  },
  inCareLabel: {
    fontSize: 13,
    marginBottom: -2,
  },
  menuModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  menuModalContent: {
    position: "absolute",
    top: 140,
    right: 16,
    width: 160,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    shadowColor: "#000",
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
    fontWeight: "700",
    fontSize: 22,
  },
  metaPills: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  caregiverAndTimerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  caregiverMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  caregiverAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  compactStatsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  compactStatsPill: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 20,
  },
  secondaryStat: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statLargeValue: {
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 36,
  },
  statSmallValue: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 36,
  },
  statLabel: {
    lineHeight: 14,
    fontWeight: "500",
  },
  statLabelSmall: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 12,
  },
  athContainer: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  tabBarCustom: {},
  snackbarShadow: {
    position: "absolute",
    left: 16,
    right: 16,
    shadowColor: "#000",
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
    alignItems: "center",
  },
});
