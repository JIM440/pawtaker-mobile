import { Colors } from "@/src/constants/colors";
import { HomeTakerActionsMenu } from "@/src/features/home/components/home-taker-actions-menu";
import { SearchFilterStyles } from "@/src/constants/searchFilter";
import { filterOutBlockedUsers, hasUserBlockRelation } from "@/src/lib/blocks/user-blocks";
import { blockIfKycNotApproved, isKycApproved } from "@/src/lib/kyc/kyc-gate";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import {
  formatCarePointsPts,
  normalizeCareTypeForPoints,
} from "@/src/lib/points/carePoints";
import { useUnreadNotificationCount } from "@/src/lib/notifications/useUnreadNotificationCount";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import {
  errorMessageFromUnknown,
  isMissingBackendResourceError,
} from "@/src/lib/supabase/errors";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { PetCard, TakerCard } from "@/src/shared/components/cards";
import { SearchField } from "@/src/shared/components/forms/SearchField";
import { KycPromptModal } from "@/src/shared/components/kyc/KycPromptModal";
import { PageContainer } from "@/src/shared/components/layout";
import { SendRequestToUserModal } from "@/src/features/profile/components/public-profile/SendRequestToUserModal";
import {
  FeedRequestsSkeleton,
  FeedTakersSkeleton,
} from "@/src/shared/components/skeletons/FeedSkeleton";
import {
  DataState,
  IllustratedEmptyState,
  IllustratedEmptyStateIllustrations,
} from "@/src/shared/components/ui";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import {
  CARE_TYPE_KEYS,
  type CareTypeKey,
} from "@/src/shared/components/ui/CareTypeSelector";
import { RangeSlider } from "@/src/shared/components/ui/RangeSlider";
import { TabBar } from "@/src/shared/components/ui/TabBar";
import { useRouter } from "expo-router";
import { Bell, Search, SlidersHorizontal } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

/** Inclusive km range for feed filter (0 = no minimum). */
const DISTANCE_MIN_KM = 0;
const DISTANCE_MAX_KM = 50;

function parseDistanceKm(s: string): number {
  const n = parseInt(s.replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function clampKm(n: number): number {
  return Math.max(DISTANCE_MIN_KM, Math.min(DISTANCE_MAX_KM, Math.round(n)));
}

function formatRequestDateRange(
  startDateRaw?: string | null,
  endDateRaw?: string | null,
): string {
  if (!startDateRaw) return "";
  const start = new Date(startDateRaw);
  const end = endDateRaw ? new Date(endDateRaw) : null;
  if (Number.isNaN(start.getTime())) return "";
  if (end && Number.isNaN(end.getTime())) return "";

  const monthShort = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short" });
  const day = (d: Date) => d.getDate();

  if (!end) return `${monthShort(start)} ${day(start)}`;
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();

  return sameMonth
    ? `${monthShort(start)} ${day(start)}-${day(end)}`
    : `${monthShort(start)} ${day(start)}-${monthShort(end)} ${day(end)}`;
}

function formatRequestTimeRange(
  startTimeRaw?: string | null,
  endTimeRaw?: string | null,
): string {
  const toLabel = (raw?: string | null) => {
    if (!raw || typeof raw !== "string") return "";
    const hhmm = raw.slice(0, 5);
    const [hRaw, mRaw] = hhmm.split(":");
    const hour = Number(hRaw);
    const minute = Number(mRaw);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return "";
    const isPm = hour >= 12;
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    const minutePart = minute === 0 ? "" : `:${String(minute).padStart(2, "0")}`;
    return `${hour12}${minutePart}${isPm ? "pm" : "am"}`;
  };

  const start = toLabel(startTimeRaw);
  const end = toLabel(endTimeRaw);
  if (!start && !end) return "";
  if (!end) return start;
  if (!start) return end;
  return `${start}-${end}`;
}

/** `taker_profiles.availability_json` — matches DB trigger shape (`available` boolean). */
function isTakerAvailableFromJson(availabilityJson: unknown): boolean {
  if (!availabilityJson || typeof availabilityJson !== "object") return false;
  return (availabilityJson as Record<string, unknown>)["available"] === true;
}

type FilterTab = "all" | "requests" | "takers";

type Taker = {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  species: string;
  tags: CareTypeKey[];
  location: string;
  distance: string;
  status: "available" | "unavailable";
  completedTasks?: number;
  petsHandled?: number;
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const { user, profile } = useAuthStore();
  const colors = Colors[resolvedTheme];
  const [refreshing, setRefreshing] = useState(false);

  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [requestsLoaded, setRequestsLoaded] = useState(false);

  const [takers, setTakers] = useState<Taker[]>([]);
  const [takersLoading, setTakersLoading] = useState(false);
  const [takersError, setTakersError] = useState<string | null>(null);
  const [takersLoaded, setTakersLoaded] = useState(false);

  const [userPets, setUserPets] = useState<any[]>([]);
  const [userPetsLoading, setUserPetsLoading] = useState(false);
  const [userPetsError, setUserPetsError] = useState<string | null>(null);
  const [userPetsLoaded, setUserPetsLoaded] = useState(false);

  const { count: notificationsUnreadCount, markAllRead: markNotificationsRead } = useUnreadNotificationCount();
  const [filter, setFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [openMenuTaker, setOpenMenuTaker] = useState<Taker | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [sendRequestOpen, setSendRequestOpen] = useState(false);
  const showToast = useToastStore((s) => s.showToast);
  const [selectedSeekingPet, setSelectedSeekingPet] = useState<any | null>(
    null,
  );
  const [sendRequestBusy, setSendRequestBusy] = useState(false);
  /** Subtitle under each pet in send-request modal: open-request dates • care type, or species • breed. */
  const [petSendSubtitleById, setPetSendSubtitleById] = useState<
    Record<string, string>
  >({});

  const loadRequestsTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setRequestsLoading(true);
    setRequestsError(null);
    try {
      const { data: reqData, error: reqError } = await supabase
        .from("care_requests")
        .select("*")
        .eq("status", "open")
        .order("start_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (reqError && !isMissingBackendResourceError(reqError)) throw reqError;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeReqData = (reqData ?? []).filter((r: any) => {
        const endRaw = r?.end_date as string | undefined;
        if (!endRaw) return true;
        const end = new Date(endRaw);
        if (Number.isNaN(end.getTime())) return true;
        end.setHours(0, 0, 0, 0);
        return end >= today;
      });

      const ownerIds = Array.from(
        new Set(activeReqData.map((r: any) => r.owner_id)),
      );
      const blockedOwnerIds = await filterOutBlockedUsers(user.id, ownerIds);
      const visibleReqData = activeReqData.filter(
        (r: any) => !blockedOwnerIds.has(r.owner_id),
      );
      const petIds = Array.from(
        new Set(visibleReqData.map((r: any) => r.pet_id)),
      );

      const [
        { data: owners, error: ownersError },
        { data: requestPets, error: requestPetsError },
      ] = await Promise.all([
        ownerIds.length
          ? supabase
              .from("users")
              .select("id,full_name,city,avatar_url")
              .in("id", ownerIds)
          : Promise.resolve({ data: [], error: null }),
        petIds.length
          ? supabase.from("pets").select("*").in("id", petIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (ownersError && !isMissingBackendResourceError(ownersError))
        throw ownersError;
      if (requestPetsError && !isMissingBackendResourceError(requestPetsError))
        throw requestPetsError;

      const ownersById = (owners ?? []).reduce(
        (acc: any, o: any) => ({ ...acc, [o.id]: o }),
        {},
      );
      const petsById = (requestPets ?? []).reduce(
        (acc: any, p: any) => ({ ...acc, [p.id]: p }),
        {},
      );

      setRequests(
        visibleReqData.map((r: any) => {
          const pet = petsById[r.pet_id];
          const owner = ownersById[r.owner_id];
          const parsedPet = parsePetNotes(pet?.notes);
          const feedDescription = parsedPet.bio?.trim() ?? "";
          const petYard =
            typeof (pet as any)?.yard_type === "string" &&
            (pet as any).yard_type.trim().length > 0
              ? (pet as any).yard_type.trim()
              : parsedPet.yardType;
          const petAge =
            typeof (pet as any)?.age_range === "string" &&
            (pet as any).age_range.trim().length > 0
              ? (pet as any).age_range.trim()
              : parsedPet.ageRange;
          const petEnergy =
            typeof (pet as any)?.energy_level === "string" &&
            (pet as any).energy_level.trim().length > 0
              ? (pet as any).energy_level.trim()
              : parsedPet.energyLevel;

          const feedTags: string[] = [];
          if (petYard) feedTags.push(petYard);
          if (petAge) feedTags.push(petAge);
          if (petEnergy) feedTags.push(petEnergy);
          return {
            id: r.id,
            petId: r.pet_id as string,
            imageSource: petGalleryUrls(pet ?? {}),
            petName: pet?.name ?? "Pet",
            breed: pet?.breed ?? "Unknown breed",
            petType: pet?.species ?? "Pet",
            dateRange: formatRequestDateRange(r.start_date, r.end_date),
            time: formatRequestTimeRange(r.start_time, r.end_time),
            careTypeKey: normalizeCareTypeForPoints(r.care_type),
            location:
              owner?.city?.trim() || t("profile.noLocation", "No location"),
            distance: "0km",
            description: feedDescription,
            tags: feedTags,
            caretaker: {
              id: owner?.id ?? "",
              name: resolveDisplayName(owner) || "Owner",
              avatarUri:
                typeof owner?.avatar_url === "string" &&
                owner.avatar_url.trim().length > 0
                  ? owner.avatar_url.trim()
                  : null,
              rating: 0,
              reviewsCount: 0,
              petsCount: 0,
            },
          };
        }),
      );
      setRequestsLoaded(true);
    } catch (err) {
      setRequestsError(
        errorMessageFromUnknown(err, "Failed to load requests."),
      );
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadTakersTab = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setTakersLoading(true);
    setTakersError(null);
    try {
      // Takers who appear in the feed must have a taker_profiles row; users is only for display + KYC.
      // Include the current user so sole/approved takers still see themselves in the directory (others could see none).
      const { data: profilesRaw, error: profilesError } = await supabase
        .from("taker_profiles")
        .select("user_id, availability_json, accepted_species");
      if (profilesError && !isMissingBackendResourceError(profilesError))
        throw profilesError;

      const profileRows = profilesRaw ?? [];
      const userIds = profileRows.map((p) => p.user_id);
      if (userIds.length === 0) {
        setTakers([]);
        setTakersLoaded(true);
        return;
      }

      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select(
          "id,full_name,avatar_url,city,kyc_status,care_given_count,care_received_count",
        )
        .in("id", userIds)
        .eq("kyc_status", "approved");
      if (usersError && !isMissingBackendResourceError(usersError))
        throw usersError;

      const profileByUserId = profileRows.reduce(
        (acc, row) => {
          acc[row.user_id] = row;
          return acc;
        },
        {} as Record<string, (typeof profileRows)[number]>,
      );

      setTakers(
        (usersData ?? []).map((u: any) => {
          const tp = profileByUserId[u.id];
          const speciesList = (tp?.accepted_species ?? []) as string[];
          const speciesChip =
            speciesList.length > 0
              ? speciesList.map((s) => s.trim()).join(" • ")
              : t("feed.takerSpeciesFallback", "Pets");
          const avatarTrimmed =
            typeof u.avatar_url === "string" ? u.avatar_url.trim() : "";
          return {
            id: u.id,
            name: resolveDisplayName(u) || "User",
            avatar: avatarTrimmed,
            rating: 0,
            species: speciesChip,
            tags: ["daytime"] as CareTypeKey[],
            location: u.city?.trim() || t("profile.noLocation", "No location"),
            distance: "0km",
            status: isTakerAvailableFromJson(tp?.availability_json)
              ? ("available" as const)
              : ("unavailable" as const),
            completedTasks: u.care_given_count ?? 0,
            petsHandled: u.care_received_count ?? 0,
          };
        }),
      );
      setTakersLoaded(true);
    } catch (err) {
      setTakersError(errorMessageFromUnknown(err, "Failed to load takers."));
    } finally {
      setTakersLoading(false);
    }
  };

  const loadUserPets = async (opts?: { refresh?: boolean }) => {
    if (!user?.id) return;
    if (!opts?.refresh) setUserPetsLoading(true);
    setUserPetsError(null);
    try {
      const { data: myPets, error: petsError } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });
      if (petsError && !isMissingBackendResourceError(petsError))
        throw petsError;
      setUserPets(myPets ?? []);
      setUserPetsLoaded(true);
    } catch (err) {
      setUserPetsError(
        errorMessageFromUnknown(err, "Failed to load your pets."),
      );
    } finally {
      setUserPetsLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const shouldLoadRequests = filter === "all" || filter === "requests";
    if (
      shouldLoadRequests &&
      !requestsLoading &&
      !requestsLoaded &&
      !requestsError
    ) {
      void loadRequestsTab();
    }

    const shouldLoadTakers = filter === "all" || filter === "takers";
    if (shouldLoadTakers && !takersLoading && !takersLoaded && !takersError) {
      void loadTakersTab();
    }
  }, [
    user?.id,
    filter,
    requestsLoading,
    requestsLoaded,
    requestsError,
    takersLoading,
    takersLoaded,
    takersError,
  ]);

  useEffect(() => {
    if (!sendRequestOpen) return;
    if (userPetsLoaded || userPetsLoading || userPetsError) return;
    void loadUserPets();
  }, [
    sendRequestOpen,
    user?.id,
    userPetsLoaded,
    userPetsLoading,
    userPetsError,
  ]);

  useEffect(() => {
    if (!sendRequestOpen || !user?.id) {
      setPetSendSubtitleById({});
      return;
    }
    const ids = (userPets as { id?: string }[])
      .map((p) => p.id)
      .filter(Boolean) as string[];
    if (!ids.length) {
      setPetSendSubtitleById({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await supabase
        .from("care_requests")
        .select("pet_id,start_date,end_date,care_type,created_at")
        .eq("owner_id", user.id)
        .eq("status", "open")
        .in("pet_id", ids)
        .order("start_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (cancelled || error) return;
      const bestByPet: Record<string, any> = {};
      for (const row of data ?? []) {
        const pid = row.pet_id as string;
        if (!bestByPet[pid]) bestByPet[pid] = row;
      }
      const next: Record<string, string> = {};
      for (const p of userPets as any[]) {
        const pid = p.id as string;
        const r = bestByPet[pid];
        if (!r) {
          next[pid] = [p.species || "Pet", p.breed || "—"]
            .filter(Boolean)
            .join(" · ");
          continue;
        }
        const d1 = r.start_date ? new Date(r.start_date as string) : null;
        const d2 = r.end_date ? new Date(r.end_date as string) : null;
        const datePart =
          d1 && d2
            ? `${d1.toLocaleDateString(undefined, { month: "short", day: "numeric" })}-${d2.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : d1
              ? d1.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })
              : "";
        const careKey = normalizeCareTypeForPoints(r.care_type);
        const carePart = t(`feed.careTypes.${careKey}` as any);
        next[pid] = [datePart, carePart].filter(Boolean).join(" · ");
      }
      if (!cancelled) setPetSendSubtitleById(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [sendRequestOpen, user?.id, userPets, t]);


  const onRefresh = async () => {
    setRefreshing(true);
    try {
      if (filter === "all" || filter === "requests") {
        await loadRequestsTab({ refresh: true });
      }
      if (filter === "all" || filter === "takers") {
        await loadTakersTab({ refresh: true });
      }
      if (sendRequestOpen) {
        await loadUserPets({ refresh: true });
      }
      await loadPetLikes();
    } finally {
      setRefreshing(false);
    }
  };
  const [takerForSendRequest, setTakerForSendRequest] = useState<Taker | null>(
    null,
  );

  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [showKycPrompt, setShowKycPrompt] = useState(false);
  const [careTypeFilter, setCareTypeFilter] = useState<string[]>([]);
  const [distanceRange, setDistanceRange] = useState({
    min: DISTANCE_MIN_KM,
    max: DISTANCE_MAX_KM,
  });
  const [filterDraft, setFilterDraft] = useState({
    careTypes: [] as string[],
    minKm: DISTANCE_MIN_KM,
    maxKm: DISTANCE_MAX_KM,
  });

  React.useEffect(() => {
    if (!profile) return;
    if (!isKycApproved(profile.kyc_status)) {
      setShowKycPrompt(true);
    } else {
      setShowKycPrompt(false);
    }
  }, [profile]);

  const loadPetLikes = React.useCallback(async () => {
    if (!user?.id) {
      setFavorites(new Set());
      return;
    }
    try {
      const { data, error } = await supabase
        .from("pet_likes")
        .select("pet_id")
        .eq("user_id", user.id);
      if (error && !isMissingBackendResourceError(error)) throw error;
      setFavorites(
        new Set((data ?? []).map((r: { pet_id: string }) => r.pet_id)),
      );
    } catch {
      setFavorites(new Set());
    }
  }, [user?.id]);

  useEffect(() => {
    void loadPetLikes();
  }, [loadPetLikes]);

  const toggleFavorite = async (
    petId: string,
    careRequestId: string | null,
  ) => {
    if (!user?.id || !petId) return;
    const wasLiked = favorites.has(petId);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (wasLiked) next.delete(petId);
      else next.add(petId);
      return next;
    });
    try {
      if (wasLiked) {
        const { error } = await supabase
          .from("pet_likes")
          .delete()
          .eq("user_id", user.id)
          .eq("pet_id", petId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pet_likes").insert({
          user_id: user.id,
          pet_id: petId,
          care_request_id: careRequestId,
        });
        if (error) throw error;
      }
    } catch (err) {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.add(petId);
        else next.delete(petId);
        return next;
      });
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t("common.error", "Something went wrong"),
        ),
        durationMs: 3200,
      });
    }
  };

  const resetFilters = () => {
    const resetValue = {
      careTypes: [] as string[],
      minKm: DISTANCE_MIN_KM,
      maxKm: DISTANCE_MAX_KM,
    };
    setFilterDraft(resetValue);
    setCareTypeFilter([]);
    setDistanceRange({ min: resetValue.minKm, max: resetValue.maxKm });
  };

  const commitFilters = (draft: typeof filterDraft, closePanel: boolean) => {
    const lo = Math.min(draft.minKm, draft.maxKm);
    const hi = Math.max(draft.minKm, draft.maxKm);
    const next = { min: clampKm(lo), max: clampKm(hi) };

    // Commit to the active filters that drive the results list.
    setCareTypeFilter([...draft.careTypes]);
    setDistanceRange(next);
    setFilterDraft({
      careTypes: [...draft.careTypes],
      minKm: next.min,
      maxKm: next.max,
    });

    if (closePanel) setFilterPanelOpen(false);
  };

  const applyFilters = () => commitFilters(filterDraft, true);

  const toggleCareTypeAndApply = (key: string) => {
    const selected = filterDraft.careTypes.includes(key);
    const nextCareTypes = selected
      ? filterDraft.careTypes.filter((x) => x !== key)
      : [...filterDraft.careTypes, key];

    // Apply immediately when user taps a care type pill.
    commitFilters(
      {
        ...filterDraft,
        careTypes: nextCareTypes,
      },
      false,
    );
  };

  const setDraftMinKmFromText = (text: string) => {
    const raw = text.replace(/[^0-9]/g, "");
    if (raw === "") {
      setFilterDraft((d) => ({ ...d, minKm: DISTANCE_MIN_KM }));
      return;
    }
    const n = clampKm(parseInt(raw, 10));
    setFilterDraft((d) => ({
      ...d,
      minKm: Math.min(n, d.maxKm),
    }));
  };

  const setDraftMaxKmFromText = (text: string) => {
    const raw = text.replace(/[^0-9]/g, "");
    if (raw === "") {
      setFilterDraft((d) => ({ ...d, maxKm: DISTANCE_MAX_KM }));
      return;
    }
    const n = clampKm(parseInt(raw, 10));
    setFilterDraft((d) => ({
      ...d,
      maxKm: Math.max(n, d.minKm),
    }));
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      if (filter === "takers") return false;
      if (
        careTypeFilter.length > 0 &&
        !careTypeFilter.includes(item.careTypeKey)
      )
        return false;
      const distKm = parseDistanceKm(item.distance);
      if (distKm < distanceRange.min || distKm > distanceRange.max) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.petName.toLowerCase().includes(q) ||
        item.breed.toLowerCase().includes(q) ||
        item.petType.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, careTypeFilter, distanceRange, requests]);

  const filteredTakers = useMemo(() => {
    return takers.filter((taker) => {
      if (filter === "requests") return false;
      if (
        careTypeFilter.length > 0 &&
        !taker.tags.some((tag) => careTypeFilter.includes(tag))
      )
        return false;
      const distKm = parseDistanceKm(taker.distance);
      if (distKm < distanceRange.min || distKm > distanceRange.max) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        taker.name.toLowerCase().includes(q) ||
        taker.species.toLowerCase().includes(q) ||
        taker.location.toLowerCase().includes(q)
      );
    });
  }, [filter, searchQuery, careTypeFilter, distanceRange, takers]);

  const showRequests = filter === "all" || filter === "requests";
  const showTakers = filter === "all" || filter === "takers";

  const handleConfirmSendRequest = async () => {
    if (!selectedSeekingPet || !takerForSendRequest || !user?.id) return;
    if (sendRequestBusy) return;
    setSendRequestBusy(true);
    try {
      const petId = selectedSeekingPet.id as string;
      const takerId = takerForSendRequest.id;
      const blocked = await hasUserBlockRelation(user.id, takerId);
      if (blocked) {
        showToast({
          variant: "error",
          message: t(
            "messages.blockedNoMessaging",
            "You cannot message this user because one of you has blocked the other.",
          ),
          durationMs: 3200,
        });
        return;
      }

      const { data: openReqRows, error: openReqErr } = await supabase
        .from("care_requests")
        .select("id,pet_id,owner_id,start_date,end_date,points_offered,care_type")
        .eq("owner_id", user.id)
        .eq("pet_id", petId)
        .eq("status", "open")
        .order("start_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);
      if (openReqErr && !isMissingBackendResourceError(openReqErr))
        throw openReqErr;
      const openReq = openReqRows?.[0] as any | undefined;
      if (!openReq?.id) {
        showToast({
          variant: "info",
          message: t(
            "home.sendRequest.needsOpenRequest",
            "Create an open care request for this pet first, then you can message a taker.",
          ),
          durationMs: 3200,
        });
        router.push({
          pathname: "/(private)/post-requests",
          params: { petId },
        } as any);
        setSendRequestOpen(false);
        return;
      }

      const requestId = openReq.id as string;
      const participants = [user.id, takerId].sort();

      let threadId: string | null = null;
      const { data: existing, error: existingError } = await supabase
        .from("threads")
        .select("id")
        .eq("request_id", requestId)
        .contains("participant_ids", participants)
        .maybeSingle();
      if (existingError && !isMissingBackendResourceError(existingError))
        throw existingError;
      if (existing?.id) {
        threadId = existing.id;
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from("threads")
          .insert({
            participant_ids: participants,
            request_id: requestId,
          })
          .select("id")
          .single();
        if (insertError && !isMissingBackendResourceError(insertError))
          throw insertError;
        threadId = inserted?.id ?? null;
      }
      if (!threadId) throw new Error("Could not create chat thread.");

      const petName = selectedSeekingPet.name ?? t("pets.add.name", "Pet");
      const breed = selectedSeekingPet.breed ?? "";
      const dateRange =
        openReq.start_date && openReq.end_date
          ? `${new Date(openReq.start_date).toLocaleDateString()} - ${new Date(openReq.end_date).toLocaleDateString()}`
          : "";
      const price =
        openReq.start_date && openReq.end_date
          ? formatCarePointsPts(
              openReq.care_type,
              openReq.start_date,
              openReq.end_date,
            )
          : "";

      const { error: msgError } = await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: user.id,
        content: t("common.sendRequest", "Send request"),
        type: "proposal",
        metadata: { requestId },
      });
      if (msgError && !isMissingBackendResourceError(msgError)) throw msgError;

      await supabase
        .from("threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", threadId);

      setSendRequestOpen(false);
      router.push({
        pathname: "/(private)/(tabs)/messages/[threadId]" as any,
        params: {
          threadId,
          mode: "seeking",
          petName,
          breed,
          date: dateRange,
          time: "",
          price,
          offerId: requestId,
        } as any,
      });
    } catch (err) {
      showToast({
        variant: "error",
        message: errorMessageFromUnknown(
          err,
          t(
            "home.sendRequest.sendFailed",
            "Couldn't send the request right now. Please try again.",
          ),
        ),
        durationMs: 3400,
      });
    } finally {
      setSendRequestBusy(false);
    }
  };

  const HomeHeader = (
    <View className="flex-row items-center justify-between pb-3">
      <AppText variant="headline" style={{ fontSize: 22, letterSpacing: -0.1 }}>
        {t("app.name")}
      </AppText>
      <TouchableOpacity
        className="relative pr-3"
        hitSlop={12}
        onPress={() => {
          void markNotificationsRead();
          router.push("/(private)/(tabs)/(home)/notifications");
        }}
      >
        <Bell size={24} color={colors.onSurface} />
        {notificationsUnreadCount > 0 ? (
          <View
            className="absolute bottom-4 right-1 min-w-[16px] h-[16px] rounded-full items-center justify-center px-1"
            style={{ backgroundColor: colors.primary }}
          >
            <AppText
              variant="caption"
              color={colors.onPrimary}
              style={{ fontSize: 10, lineHeight: 12 }}
            >
              {notificationsUnreadCount > 99 ? "99+" : notificationsUnreadCount}
            </AppText>
          </View>
        ) : null}
      </TouchableOpacity>
    </View>
  );

  return (
    <PageContainer>
      {HomeHeader}
      {/* Pet cards list */}
      <FlatList
        data={showRequests ? filteredRequests : []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 24, gap: 8, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surfaceContainerLow}
          />
        }
        ListHeaderComponent={
          <>
            {/* Search + filter (Figma-aligned styles) */}
            <View style={styles.searchFilterRow}>
              <SearchField
                containerStyle={styles.searchBar}
                placeholder={t("feed.searchPlaceholder")}
                value={searchQuery}
                onChangeText={setSearchQuery}
                rightSlot={<Search size={20} color={colors.onSurfaceVariant} />}
              />
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: colors.surfaceContainerHighest,
                    borderWidth: filterPanelOpen ? 2 : 0,
                    borderColor: filterPanelOpen
                      ? colors.primary
                      : "transparent",
                  },
                ]}
                hitSlop={8}
                onPress={() => {
                  if (!filterPanelOpen) {
                    setFilterDraft({
                      careTypes: [...careTypeFilter],
                      minKm: distanceRange.min,
                      maxKm: distanceRange.max,
                    });
                  }
                  setFilterPanelOpen((o) => !o);
                }}
              >
                <SlidersHorizontal
                  size={SearchFilterStyles.searchIconSize}
                  color={colors.onSurface}
                />
              </TouchableOpacity>
            </View>

            {/* Inline filter panel (Figma: sheet-style, not centered modal) */}
            {filterPanelOpen ? (
              <View
                style={[
                  styles.filterInlinePanel,
                  {
                    backgroundColor: colors.surfaceContainerHigh,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                <View style={[styles.filterPanelHeader]}>
                  <AppText variant="body" color={colors.onSurfaceVariant}>
                    {t("filters.title")}
                  </AppText>
                  <TouchableOpacity
                    onPress={resetFilters}
                    hitSlop={12}
                    style={styles.filterPanelHeaderBtn}
                  >
                    <AppText
                      variant="body"
                      color={colors.primary}
                      style={{ textDecorationLine: "underline" }}
                    >
                      {t("filters.reset")}
                    </AppText>
                  </TouchableOpacity>
                </View>

                <View style={styles.filterPanelBody}>
                  <AppText
                    variant="label"
                    color={colors.onSurfaceVariant}
                    style={styles.filterSectionLabel}
                  >
                    {t("filters.careType")}
                  </AppText>
                  <View style={styles.filterCareTypesBlock}>
                    <View style={styles.careTypePillsRow}>
                      {CARE_TYPE_KEYS.map((key) => {
                        const active = filterDraft.careTypes.includes(key);
                        return (
                          <TouchableOpacity
                            key={key}
                            activeOpacity={0.9}
                            onPress={() => toggleCareTypeAndApply(key)}
                            style={[
                              styles.careTypePill,
                              {
                                borderColor: active
                                  ? colors.primary
                                  : colors.outlineVariant,
                              },
                            ]}
                          >
                            <AppText
                              variant="label"
                              color={
                                active
                                  ? colors.primary
                                  : colors.onSurfaceVariant
                              }
                              style={styles.careTypePillLabel}
                            >
                              {t(`feed.careTypes.${key}`)}
                            </AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <AppText
                    variant="label"
                    color={colors.onSurfaceVariant}
                    style={styles.filterSectionLabel}
                  >
                    {t("filters.distanceRange")}
                  </AppText>

                  <View style={styles.distanceInputsRow}>
                    <View
                      style={[
                        styles.distanceCard,
                        {
                          backgroundColor: colors.surfaceContainerHighest,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                        style={styles.distanceCardLabel}
                      >
                        {t("filters.minKm")}
                      </AppText>
                      <TextInput
                        value={String(filterDraft.minKm)}
                        onChangeText={setDraftMinKmFromText}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="0"
                        placeholderTextColor={colors.onSurfaceVariant}
                        style={[
                          styles.distanceCardInput,
                          {
                            color: colors.onSurface,
                          },
                        ]}
                      />
                    </View>

                    <View style={styles.distanceDash}>
                      <AppText
                        variant="title"
                        color={colors.onSurfaceVariant}
                        style={styles.distanceDashText}
                      >
                        -
                      </AppText>
                    </View>

                    <View
                      style={[
                        styles.distanceCard,
                        {
                          backgroundColor: colors.surfaceContainerHighest,
                          borderColor: colors.outlineVariant,
                        },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                        style={styles.distanceCardLabel}
                      >
                        {t("filters.maxKm")}
                      </AppText>
                      <TextInput
                        value={String(filterDraft.maxKm)}
                        onChangeText={setDraftMaxKmFromText}
                        keyboardType="number-pad"
                        maxLength={2}
                        placeholder="50"
                        placeholderTextColor={colors.onSurfaceVariant}
                        style={[
                          styles.distanceCardInput,
                          {
                            color: colors.onSurface,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <RangeSlider
                    min={DISTANCE_MIN_KM}
                    max={DISTANCE_MAX_KM}
                    values={[filterDraft.minKm, filterDraft.maxKm]}
                    onValuesChange={([minv, maxv]: [number, number]) =>
                      setFilterDraft((d) => ({
                        ...d,
                        minKm: minv,
                        maxKm: maxv,
                      }))
                    }
                  />
                </View>
              </View>
            ) : null}

            {/* Filter tabs */}
            <TabBar<FilterTab>
              tabs={[
                { key: "all", label: t("feed.filterAll") },
                { key: "requests", label: t("feed.filterRequests") },
                { key: "takers", label: t("feed.filterTakers") },
              ]}
              activeKey={filter}
              onChange={setFilter}
              variant="pill"
              style={styles.filterTabs}
            />

            {showRequests ? (
              requestsLoading || (!requestsLoaded && !requestsError) ? (
                <FeedRequestsSkeleton count={3} />
              ) : requestsError ? (
                <DataState
                  title={t("common.error", "Something went wrong")}
                  message={requestsError}
                  actionLabel={t("common.retry", "Retry")}
                  onAction={() => {
                    setRequestsError(null);
                    setRequestsLoaded(false);
                    void loadRequestsTab({ refresh: true });
                  }}
                  mode="inline"
                />
              ) : filteredRequests.length === 0 ? (
                <IllustratedEmptyState
                  title={
                    searchQuery.trim() ||
                    careTypeFilter.length > 0 ||
                    distanceRange.min > DISTANCE_MIN_KM ||
                    distanceRange.max < DISTANCE_MAX_KM
                      ? "Aw aw! No results"
                      : t("feed.noRequestsTitle", "No requests near you")
                  }
                  message={
                    searchQuery.trim() ||
                    careTypeFilter.length > 0 ||
                    distanceRange.min > DISTANCE_MIN_KM ||
                    distanceRange.max < DISTANCE_MAX_KM
                      ? "We couldn't find any matches for your search. Try adjusting your filters"
                      : t(
                          "feed.noRequestsSubtitle",
                          "Try adjusting filters to find more.",
                        )
                  }
                  illustration={
                    searchQuery.trim() ||
                    careTypeFilter.length > 0 ||
                    distanceRange.min > DISTANCE_MIN_KM ||
                    distanceRange.max < DISTANCE_MAX_KM
                      ? IllustratedEmptyStateIllustrations.noSearchResult
                      : IllustratedEmptyStateIllustrations.noCare
                  }
                  mode="inline"
                />
              ) : (
                <View style={styles.resultsHeader}>
                  {careTypeFilter.length > 0 ||
                  distanceRange.min > DISTANCE_MIN_KM ||
                  distanceRange.max < DISTANCE_MAX_KM ? (
                    <View style={styles.resultsRow}>
                      <AppText variant="title" style={{ fontSize: 16 }}>
                        {t("feed.resultsLabel")}:{" "}
                      </AppText>
                      <AppText
                        variant="body"
                        color={colors.onSurfaceVariant}
                        style={{
                          fontWeight: "600",
                          flex: 1,
                          flexShrink: 1,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {[
                          ...careTypeFilter.map((k) =>
                            t(`feed.careTypes.${k}`),
                          ),
                          t("feed.distanceKmRange", {
                            min: distanceRange.min,
                            max: distanceRange.max,
                          }),
                        ].join(", ")}
                      </AppText>
                    </View>
                  ) : (
                    <View className="flex-row items-center gap-2">
                      <AppText
                        variant="title"
                        style={{ fontSize: 16, letterSpacing: -0.1 }}
                      >
                        {t("feed.requestsNearYou")}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                      >
                        {filteredRequests.length} {t("feed.petsInArea")}
                      </AppText>
                    </View>
                  )}
                </View>
              )
            ) : null}
          </>
        }
        renderItem={({ item }) =>
          showRequests ? (
            <PetCard
              imageSource={item.imageSource}
              petName={item.petName}
              breed={item.breed}
              petType={item.petType}
              dateRange={item.dateRange}
              time={item.time}
              careType={t(`feed.careTypes.${item.careTypeKey}`)}
              location={item.location}
              distance={item.distance}
              description={item.description}
              tags={item.tags ?? []}
              caretaker={item.caretaker}
              isFavorite={Boolean(item.petId && favorites.has(item.petId))}
              onFavorite={() =>
                void toggleFavorite(item.petId, item.id ?? null)
              }
              onApply={() => {
                if (blockIfKycNotApproved()) return;
                router.push(`/(private)/post-requests/${item.id}` as any);
              }}
              onPress={() =>
                item.petId
                  ? router.push(`/(private)/pets/${item.petId}` as any)
                  : undefined
              }
              onCaretakerPress={() => {
                if (!item.caretaker?.id) return;
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: item.caretaker.id },
                });
              }}
            />
          ) : null
        }
        ListFooterComponent={
          showTakers ? (
            takersLoading || (!takersLoaded && !takersError) ? (
              <FeedTakersSkeleton count={4} />
            ) : takersError ? (
              <DataState
                title={t("common.error", "Something went wrong")}
                message={takersError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setTakersError(null);
                  setTakersLoaded(false);
                  void loadTakersTab({ refresh: true });
                }}
                mode="inline"
              />
            ) : filteredTakers.length === 0 ? (
              <IllustratedEmptyState
                title={
                  searchQuery.trim() ||
                  careTypeFilter.length > 0 ||
                  distanceRange.min > DISTANCE_MIN_KM ||
                  distanceRange.max < DISTANCE_MAX_KM
                    ? "Aw aw! No results"
                    : t("feed.noTakersTitle", "No caregivers available")
                }
                message={
                  searchQuery.trim() ||
                  careTypeFilter.length > 0 ||
                  distanceRange.min > DISTANCE_MIN_KM ||
                  distanceRange.max < DISTANCE_MAX_KM
                    ? "We couldn't find any matches for your search. Try adjusting your filters"
                    : t(
                        "feed.noTakersSubtitle",
                        "Try adjusting filters to find more.",
                      )
                }
                illustration={
                  searchQuery.trim() ||
                  careTypeFilter.length > 0 ||
                  distanceRange.min > DISTANCE_MIN_KM ||
                  distanceRange.max < DISTANCE_MAX_KM
                    ? IllustratedEmptyStateIllustrations.noSearchResult
                    : IllustratedEmptyStateIllustrations.noCare
                }
                mode="inline"
              />
            ) : (
              <View className="mt-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <AppText
                    variant="title"
                    style={{ fontSize: 16, letterSpacing: -0.1 }}
                  >
                    {t("feed.takersNearYou")}
                  </AppText>
                  <AppText variant="caption" color={colors.onSurfaceVariant}>
                    {filteredTakers.length} {t("feed.takersAvailable")}
                  </AppText>
                </View>

                <View className="gap-3">
                  {filteredTakers.map((taker) => (
                    <TakerCard
                      key={taker.id}
                      taker={{
                        ...taker,
                        tags: taker.tags.map((tag) =>
                          t(`feed.careTypes.${tag}`),
                        ),
                      }}
                      onPress={() =>
                        router.push({
                          pathname: "/(private)/(tabs)/profile/users/[id]",
                          params: { id: taker.id },
                        })
                      }
                      onMenuPress={(ref) => {
                        ref?.measureInWindow(
                          (
                            x: number,
                            y: number,
                            width: number,
                            height: number,
                          ) => {
                            setMenuPosition({ x, y, width, height });
                            setOpenMenuTaker(taker);
                          },
                        );
                      }}
                    />
                  ))}
                </View>
              </View>
            )
          ) : null
        }
      />

      <KycPromptModal
        visible={showKycPrompt}
        onClose={() => setShowKycPrompt(false)}
      />

      <HomeTakerActionsMenu
        visible={openMenuTaker != null}
        menuPosition={menuPosition}
        takerId={openMenuTaker?.id ?? null}
        currentUserId={user?.id ?? null}
        colors={colors}
        t={(key, fallback) => t(key, fallback as string)}
        onClose={() => setOpenMenuTaker(null)}
        onViewProfile={() => {
          if (!openMenuTaker) return;
          setOpenMenuTaker(null);
          router.push({
            pathname: "/(private)/(tabs)/profile/users/[id]",
            params: { id: openMenuTaker.id },
          });
        }}
        onSendRequest={() => {
          if (!openMenuTaker) return;
          setTakerForSendRequest(openMenuTaker);
          setOpenMenuTaker(null);
          setSelectedSeekingPet(null);
          setSendRequestOpen(true);
        }}
      />

      <SendRequestToUserModal
        visible={sendRequestOpen}
        colors={colors}
        styles={styles}
        userPets={userPets}
        selectedSeekingPet={selectedSeekingPet}
        petSendSubtitleById={petSendSubtitleById}
        sendingToName={takerForSendRequest?.name?.trim() || ""}
        sendRequestBusy={sendRequestBusy}
        t={t as any}
        onClose={() => setSendRequestOpen(false)}
        onSelectPet={setSelectedSeekingPet}
        onSend={() => {
          void handleConfirmSendRequest();
        }}
        onAddRequest={() => {
          setSendRequestOpen(false);
          router.push({
            pathname: "/(private)/post-requests",
            params: userPets?.[0]?.id ? { petId: userPets[0].id } : undefined,
          } as any);
        }}
      />
    </PageContainer>
  );
}

const styles = StyleSheet.create({
  searchFilterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
  },
  searchInput: {
    flex: 1,
  },
  filterButton: {
    width: SearchFilterStyles.filterButtonSize,
    height: SearchFilterStyles.filterButtonSize,
    borderRadius: SearchFilterStyles.filterButtonBorderRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  filterTabs: {
    marginBottom: 8,
    paddingHorizontal: 0,
    justifyContent: "flex-start",
    gap: 8,
  },
  resultsHeader: {
    marginBottom: 8,
  },
  resultsRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  rangeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  filterInlinePanel: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    maxHeight: 480,
    flex: 1,
  },
  filterPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  filterPanelHeaderBtn: {
    paddingVertical: 4,
    paddingLeft: 8,
  },
  filterPanelBody: {
    paddingHorizontal: 16,
  },
  filterSectionLabel: {
    marginBottom: 10,
  },
  filterCareTypesBlock: {
    marginBottom: 20,
  },
  careTypePillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  careTypePill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  careTypePillLabel: {
    fontSize: 12,
    lineHeight: 20,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  distanceInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  distanceCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  distanceInputCol: {
    flex: 1,
  },
  distanceCardLabel: {
    marginBottom: 10,
    fontWeight: "600",
  },
  distanceCardInput: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,
    fontSize: 22,
    lineHeight: 26,
    fontWeight: "600",
  },
  distanceDash: {
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  distanceDashText: {
    fontSize: 18,
    lineHeight: 20,
    fontWeight: "600",
  },
  filterPanelFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  takerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },
  sendRequestOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  sendRequestSendingTo: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
    textAlign: "center",
  },
  sendRequestCard: {
    width: "92%",
    borderRadius: 16,
    borderWidth: 1,
    maxHeight: "70%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  sendRequestTitle: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sendRequestListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  sendRequestPetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sendRequestRadioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  sendRequestRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  sendRequestPetThumb: {
    width: 48,
    height: 48,
    borderRadius: 5,
  },
  sendRequestPetName: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  sendRequestPetMeta: {
    fontSize: 12,
    lineHeight: 13,
    letterSpacing: -0.2,
  },
  sendRequestActions: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  sendRequestActionBtn: {
    flex: 1,
  },
});
