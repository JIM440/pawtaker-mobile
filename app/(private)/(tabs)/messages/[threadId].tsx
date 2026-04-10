import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import { useMessages } from "@/src/features/messages/hooks/useMessages";
import { useSendMessage } from "@/src/features/messages/hooks/useSendMessage";
import {
  mapThreadMessagesToUi,
  type UiMessage,
} from "@/src/features/messages/threadMessageUi";
import { ThreadForwardModal } from "@/src/features/messages/components/ThreadForwardModal";
import { ThreadScreenHeader } from "@/src/features/messages/components/ThreadScreenHeader";
import { ThreadSelectionHeader } from "@/src/features/messages/components/ThreadSelectionHeader";
import { ThreadBlockConfirmModal } from "@/src/features/messages/components/ThreadBlockConfirmModal";
import { ThreadMenus } from "@/src/features/messages/components/ThreadMenus";
import { useThreads } from "@/src/features/messages/hooks/useThreads";
import {
  CLOUDINARY_GALLERY_UPLOAD_PRESET,
  uploadRawToCloudinary,
  uploadToCloudinary,
} from "@/src/lib/cloudinary/upload";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import {
  getBlockDirection,
  type BlockDirection,
} from "@/src/lib/blocks/user-blocks";
import { getRequestEligibility } from "@/src/lib/contracts/request-eligibility";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import type { Json } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { ChatThreadScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import { ProfilePetCard } from "@/src/shared/components/cards/ProfilePetCard";
import {
  DataState,
  ErrorState,
  ResourceMissingState,
} from "@/src/shared/components/ui";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CircleAlert,
  FileText,
  Handshake,
  MapPin,
  PawPrint,
  SendHorizonal,
  Star,
  Upload,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function selectedBubbleStyle(_selected: boolean, _colors: any) {
  return undefined;
}

function MessageBubble({
  message,
  colors,
  selected,
  onSelect,
}: {
  message: UiMessage;
  colors: any;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const isRight = message.side === "right";
  const hi = selectedBubbleStyle(selected, colors);

  if (message.type === "date") {
    return (
      <View style={styles.dateLabel}>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={ChatTypography.threadDatePill}
        >
          {message.text}
        </AppText>
      </View>
    );
  }

  if (message.type === "image") {
    const uri = message.imageUri?.trim() || message.text?.trim();
    if (!uri) return null;
    const isRight = message.side === "right";
    return (
      <Pressable
        onLongPress={onSelect}
        delayLongPress={450}
        style={[
          styles.bubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
          styles.bubbleSelectableWrap,
          hi,
        ]}
      >
        <Pressable onPress={() => void Linking.openURL(uri)}>
          <AppImage
            source={{ uri }}
            style={styles.chatImageAttachment}
            contentFit="cover"
          />
        </Pressable>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={[
            ChatTypography.bubbleTime,
            { marginTop: 4, alignSelf: isRight ? "flex-end" : "flex-start" },
          ]}
        >
          {message.timeLabel}
        </AppText>
      </Pressable>
    );
  }

  if (message.type === "file") {
    const url = message.fileUrl?.trim();
    const name = message.fileName?.trim() || "File";
    if (!url) return null;
    const isRight = message.side === "right";
    return (
      <Pressable
        onLongPress={onSelect}
        delayLongPress={450}
        style={[
          styles.bubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
          styles.bubbleSelectableWrap,
          hi,
        ]}
      >
        <Pressable
          onPress={() => void Linking.openURL(url)}
          style={[
            styles.fileAttachmentBubble,
            {
              backgroundColor: isRight
                ? colors.primary
                : colors.surfaceContainerHighest,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <FileText
            size={18}
            color={isRight ? colors.onPrimary : colors.onSurface}
          />
          <AppText
            variant="body"
            color={isRight ? colors.onPrimary : colors.onSurface}
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ flex: 1, minWidth: 0, marginLeft: 8 }}
          >
            {name}
          </AppText>
        </Pressable>
        <AppText
          variant="caption"
          color={colors.onSurfaceVariant}
          style={[
            ChatTypography.bubbleTime,
            { marginTop: 4, alignSelf: isRight ? "flex-end" : "flex-start" },
          ]}
        >
          {message.timeLabel}
        </AppText>
      </Pressable>
    );
  }

  if (message.type === "request") {
    const rd = message.requestData;
    if (!rd) return null;
    const context = rd.context === "seeking" ? "seeking" : "applying";
    const offerId = typeof rd.offerId === "string" ? rd.offerId.trim() : "";
    const ctaLabel = t("messages.viewOfferDetails");
    const isTakerCard = rd.visual === "taker";
    return (
      <Pressable
        onLongPress={onSelect}
        delayLongPress={450}
        style={[
          styles.requestBubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
          styles.bubbleSelectableWrap,
          hi,
        ]}
      >
        <View
          style={[
            styles.requestCard,
            {
              backgroundColor: colors.surfaceContainerHighest,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          {/* Seeking / Applying pill */}
          <View
            style={[
              styles.requestTopPill,
              { backgroundColor: colors.tertiaryContainer },
            ]}
          >
            <AppText
              variant="caption"
              color={colors.onTertiaryContainer}
              style={styles.requestTopPillText}
              numberOfLines={1}
            >
              {context === "applying"
                ? t("messages.applyingForPet", { petName: rd.petName })
                : t("messages.seekingForPet", { petName: rd.petName })}
            </AppText>
          </View>

          {/* Short note (pet bio or offer message) — only for pet cards */}
          {rd.description && !isTakerCard ? (
            <View
              style={[
                styles.requestDescriptionBox,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              <AppText
                variant="body"
                color={colors.onSurfaceVariant}
                style={styles.requestDescriptionText}
                numberOfLines={2}
              >
                {rd.description}
              </AppText>
            </View>
          ) : null}

          {isTakerCard ? (
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={!rd.takerProfileUserId}
              onPress={() => {
                if (!rd.takerProfileUserId) return;
                router.push({
                  pathname: "/(private)/(tabs)/profile/users/[id]",
                  params: { id: rd.takerProfileUserId },
                } as any);
              }}
              style={[
                styles.threadTakerNestedCard,
                {
                  backgroundColor: colors.surfaceContainerLowest,
                  borderColor: colors.outlineVariant,
                },
              ]}
            >
              {/* Header row: avatar + name/badge/meta/bio */}
              <View style={styles.takerOfferHeaderRow}>
                <UserAvatar
                  uri={rd.takerAvatarUri ?? null}
                  name={rd.takerName ?? ""}
                  size={80}
                />
                <View style={styles.takerOfferHeaderText}>
                  {/* Name + available badge */}
                  <View style={styles.threadTakerTitleRow}>
                    <AppText variant="title" numberOfLines={1} style={{ flex: 1 }}>
                      {rd.takerName?.trim()
                        ? rd.takerName
                        : t("messages.takerApplicant")}
                    </AppText>
                    {rd.takerAvailable ? (
                      <View
                        style={[
                          styles.threadTakerAvailablePill,
                          { backgroundColor: colors.tertiaryContainer },
                        ]}
                      >
                        <AppText
                          variant="caption"
                          color={colors.onTertiaryContainer}
                          numberOfLines={1}
                        >
                          {t("myCare.available")}
                        </AppText>
                      </View>
                    ) : null}
                  </View>

                  {/* Compact meta: rating • handshakes • paws */}
                  <View style={styles.takerCompactMetaRow}>
                    <View style={[styles.takerCompactMetaItem, { backgroundColor: colors.surfaceContainer }]}>
                      <AppText variant="caption" color={colors.onSurface}>
                        {(rd.takerRating ?? 0).toFixed(1)}
                      </AppText>
                      <Star size={11} color={colors.tertiary} fill={colors.tertiary} />
                    </View>
                    <View style={[styles.takerCompactMetaItem, { backgroundColor: colors.surfaceContainer }]}>
                      <Handshake size={11} color={colors.tertiary} />
                      <AppText variant="caption" color={colors.tertiary}>
                        {rd.takerHandshakes ?? 0}
                      </AppText>
                    </View>
                    <View style={[styles.takerCompactMetaItem, { backgroundColor: colors.surfaceContainer }]}>
                      <PawPrint size={11} color={colors.tertiary} />
                      <AppText variant="caption" color={colors.tertiary}>
                        {rd.takerPaws ?? 0}
                      </AppText>
                    </View>
                  </View>

                  {/* Bio */}
                  {rd.takerBio ? (
                    <AppText
                      variant="caption"
                      color={colors.onSurfaceVariant}
                      numberOfLines={2}
                      style={{ marginTop: 4 }}
                    >
                      {rd.takerBio}
                    </AppText>
                  ) : null}
                </View>
              </View>

              {/* Tags row: species • care types • location — all small pills */}
              <View style={styles.takerTagsRow}>
                {rd.takerPetTypesLine ? (
                  <View style={[styles.takerTagPill, { backgroundColor: colors.surfaceContainer }]}>
                    <AppText variant="caption" color={colors.onSurface} numberOfLines={1}>
                      {rd.takerPetTypesLine}
                    </AppText>
                  </View>
                ) : null}
                {rd.takerCareTypeKeys && rd.takerCareTypeKeys.length > 0 ? (
                  <View style={[styles.takerTagPill, { backgroundColor: colors.surfaceContainer }]}>
                    <AppText variant="caption" color={colors.onSecondaryContainer} numberOfLines={1}>
                      {rd.takerCareTypeKeys
                        .map((key) => t(`feed.careTypes.${key}`, key))
                        .join(" • ")}
                    </AppText>
                  </View>
                ) : null}
                {rd.takerCity ? (
                  <View style={[styles.takerTagPill, { backgroundColor: colors.surfaceContainer }]}>
                    <MapPin size={12} color={colors.onSurfaceVariant} />
                    <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
                      {rd.takerCity}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : (
            <ProfilePetCard
              imageSource={rd.imageUri ? { uri: rd.imageUri } : ""}
              petName={rd.petName}
              breed={rd.breed}
              petType={rd.petType ?? ""}
              bio=""
              yardType={rd.yardType}
              ageRange={rd.ageRange}
              energyLevel={rd.energyLevel}
              tags={[]}
              seekingDateRange={rd.date}
              seekingTime={rd.time}
              showMenu={false}
            />
          )}

          <Button
            label={ctaLabel}
            variant="outline"
            style={styles.requestCta}
            disabled={!offerId}
            onPress={() => {
              void (async () => {
                if (!offerId) return;
                try {
                  const eligibility = await getRequestEligibility(offerId);
                  if (!eligibility.eligible && eligibility.contractId) {
                    router.push(
                      `/(private)/(tabs)/my-care/contract/${eligibility.contractId}` as any,
                    );
                    return;
                  }
                } catch {
                  // Fall back to previous route behavior if eligibility lookup fails.
                }
                if (context === "seeking") {
                  router.push(`/(private)/post-requests/${offerId}` as any);
                  return;
                }
                router.push(`/(private)/post-availability/${offerId}` as any);
              })();
            }}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onSelect}
      onLongPress={onSelect}
      delayLongPress={450}
      style={[
        styles.bubbleWrap,
        isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
        styles.bubbleSelectableWrap,
        hi,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isRight
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 8 }
            : {
                backgroundColor: colors.surfaceContainerHighest,
                borderBottomLeftRadius: 8,
              },
        ]}
      >
        <AppText
          variant="body"
          color={isRight ? colors.onPrimary : colors.onSurface}
          style={ChatTypography.bubbleBody}
        >
          {message.text}
        </AppText>
      </View>
      <AppText
        variant="caption"
        color={colors.onSurfaceVariant}
        style={[
          ChatTypography.bubbleTime,
          { marginTop: 4, alignSelf: isRight ? "flex-end" : "flex-start" },
        ]}
      >
        {message.timeLabel}
      </AppText>
    </Pressable>
  );
}

export default function ThreadScreen() {
  const {
    threadId: threadIdParam,
    mode,
    petName,
    breed,
    date,
    time,
    price,
    offerId,
  } = useLocalSearchParams<{
    threadId: string | string[];
    mode?: string;
    petName?: string;
    breed?: string;
    date?: string;
    time?: string;
    price?: string;
    offerId?: string;
  }>();
  const threadId =
    typeof threadIdParam === "string"
      ? threadIdParam
      : (threadIdParam?.[0] ?? "");

  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [input, setInput] = useState("");
  const [metaLoading, setMetaLoading] = useState(true);
  const [threadReady, setThreadReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [blockStatus, setBlockStatus] = useState<BlockDirection>("none");
  const [threadHeader, setThreadHeader] = useState<{
    userId: string;
    name: string;
    subtitle: string;
    avatarUri: string | null;
  }>({
    userId: "",
    name: "User",
    subtitle: "",
    avatarUri: null,
  });
  const [pet, setPet] = useState<any>(null);
  const [req, setReq] = useState<any>(null);
  const [takerProfile, setTakerProfile] = useState<any | null>(null);
  const [takerUser, setTakerUser] = useState<any | null>(null);
  const [takerRatingAvg, setTakerRatingAvg] = useState(0);
  const [threadTakerParticipantId, setThreadTakerParticipantId] = useState<
    string | null
  >(null);
  const [metaRetryKey, setMetaRetryKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteMessageModal, setShowDeleteMessageModal] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [deleteMessageBusy, setDeleteMessageBusy] = useState(false);

  const {
    threads: allThreads,
    loading: threadsListLoading,
    refetch: refetchThreadsList,
  } = useThreads();

  const {
    messages,
    loading: messagesLoading,
    error: messagesLoadError,
    refetch: refetchMessages,
    deleteMessage,
  } = useMessages(threadReady && threadId ? threadId : null);
  const { sendMessage: postMessage, sending } = useSendMessage();
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardInset(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardInset(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const context = mode === "seeking" ? "seeking" : "applying";
  const paramPetName =
    typeof petName === "string" && petName.trim() ? petName : undefined;
  const paramBreed =
    typeof breed === "string" && breed.trim() ? breed : undefined;
  const paramDate = typeof date === "string" && date.trim() ? date : undefined;
  const paramTime = typeof time === "string" && time.trim() ? time : undefined;
  const paramPrice =
    typeof price === "string" && price.trim() ? price : undefined;
  const paramOfferId =
    typeof offerId === "string" && offerId.trim() ? offerId : undefined;

  const uiMessages = useMemo(
    () =>
      mapThreadMessagesToUi({
        rows: messages,
        userId: user?.id ?? "",
        pet,
        req,
        requestOwnerId: req?.owner_id ?? null,
        takerParticipantId: threadTakerParticipantId,
        takerReviewRatingAvg: takerRatingAvg,
        takerBundle:
          takerProfile || takerUser
            ? { profile: takerProfile, user: takerUser }
            : null,
        context,
        paramPetName,
        paramBreed,
        paramDate,
        paramTime,
        paramPrice,
        paramOfferId,
      }),
    [
      messages,
      user?.id,
      pet,
      req,
      threadTakerParticipantId,
      takerRatingAvg,
      takerProfile,
      takerUser,
      context,
      paramPetName,
      paramBreed,
      paramDate,
      paramTime,
      paramPrice,
      paramOfferId,
    ],
  );

  const canDeleteSelected =
    selectedIds.size > 0 &&
    Boolean(user?.id) &&
    Array.from(selectedIds).every((sid) =>
      messages.some((m) => m.id === sid && m.sender_id === user?.id),
    );

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [uiMessages.length]);

  useEffect(() => {
    if (selectedIds.size > 0) setActionsOpen(false);
  }, [selectedIds]);

  useEffect(() => {
    if (showForwardModal) void refetchThreadsList({ silent: true });
  }, [showForwardModal, refetchThreadsList]);

  useEffect(() => {
    let cancelled = false;

    const loadThreadMeta = async () => {
      setThreadReady(false);
      setMetaLoading(true);
      setLoadError(null);
      setPet(null);
      setReq(null);
      setTakerProfile(null);
      setTakerUser(null);
      setTakerRatingAvg(0);
      setThreadTakerParticipantId(null);

      if (!user?.id || !threadId) {
        setMetaLoading(false);
        if (!threadId) setLoadError(RESOURCE_NOT_FOUND);
        return;
      }

      try {
        const { data: threadRow, error: threadError } = await supabase
          .from("threads")
          .select("id,participant_ids,request_id")
          .eq("id", threadId)
          .maybeSingle();
        if (threadError) throw threadError;
        if (!threadRow) {
          setLoadError(RESOURCE_NOT_FOUND);
          return;
        }

        const peerId =
          ((threadRow.participant_ids ?? []) as string[]).find(
            (id) => id !== user.id,
          ) ?? "";

        const [{ data: peer }, { data: reqRow }] = await Promise.all([
          peerId
            ? supabase
                .from("users")
                .select("id,full_name,avatar_url,bio")
                .eq("id", peerId)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
          threadRow?.request_id
            ? supabase
                .from("care_requests")
                .select(
                  "id,owner_id,pet_id,taker_id,start_date,end_date,start_time,end_time,points_offered,care_type",
                )
                .eq("id", threadRow.request_id)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);

        if (cancelled) return;

        let petRow: any = null;
        if (reqRow?.pet_id) {
          const { data: petData } = await supabase
            .from("pets")
            .select(
              "id,name,breed,species,photo_urls,notes,yard_type,age_range,energy_level,has_special_needs,special_needs_description",
            )
            .eq("id", reqRow.pet_id)
            .maybeSingle();
          petRow = petData;
        }

        if (cancelled) return;

        setReq(reqRow ?? null);
        setPet(petRow);

        const ownerIdThread = (reqRow as any)?.owner_id as string | undefined;
        let takerProf: any = null;
        let takerUsr: any = null;
        let ratingAvg = 0;
        let takerParticipantResolved: string | null = null;
        if (ownerIdThread && peerId && user.id) {
          takerParticipantResolved =
            peerId === ownerIdThread ? user.id : peerId;
          const [
            { data: tp },
            { data: tu },
            { data: revRows },
          ] = await Promise.all([
            supabase
              .from("taker_profiles")
              .select("*")
              .eq("user_id", takerParticipantResolved)
              .maybeSingle(),
            supabase
              .from("users")
              .select(
                "id,full_name,avatar_url,city,care_given_count,care_received_count,bio",
              )
              .eq("id", takerParticipantResolved)
              .maybeSingle(),
            supabase
              .from("reviews")
              .select("rating")
              .eq("reviewee_id", takerParticipantResolved),
          ]);
          if (!cancelled) {
            takerProf = tp ?? null;
            takerUsr = tu ?? null;
            const nums = (revRows ?? [])
              .map((r) => (typeof r.rating === "number" ? r.rating : null))
              .filter((x): x is number => x != null && Number.isFinite(x));
            ratingAvg =
              nums.length > 0
                ? nums.reduce((a, b) => a + b, 0) / nums.length
                : 0;
          }
        }
        if (!cancelled) {
          setTakerProfile(takerProf);
          setTakerUser(takerUsr);
          setTakerRatingAvg(ratingAvg);
          setThreadTakerParticipantId(takerParticipantResolved);
        }

        // Load block direction
        if (peerId && user.id) {
          try {
            const dir = await getBlockDirection(user.id, peerId);
            if (!cancelled) setBlockStatus(dir);
          } catch {
            // non-fatal
          }
        }

        const bioLine =
          typeof peer?.bio === "string"
            ? peer.bio.replace(/\s+/g, " ").trim()
            : "";
        const subtitle = petRow?.name
          ? (reqRow as any)?.taker_id
            ? t("messages.caringForPet", { petName: petRow.name })
            : t("messages.applyingForPet", { petName: petRow.name })
          : bioLine;
        setThreadHeader({
          userId: peer?.id ?? peerId,
          name: resolveDisplayName(peer) || "User",
          subtitle,
          avatarUri: peer?.avatar_url ?? null,
        });
        setThreadReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load thread.",
          );
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    };

    void loadThreadMeta();
    return () => {
      cancelled = true;
    };
  }, [threadId, user?.id, metaRetryKey, t]);

  const handleUnblock = async () => {
    if (!user?.id || !threadHeader.userId) return;
    setBusy(true);
    try {
      const { error } = await supabase
        .from("user_blocks")
        .delete()
        .eq("blocker_id", user.id)
        .eq("blocked_id", threadHeader.userId);
      if (error) throw error;
      setBlockStatus("none");
      showToast({ variant: "success", message: t("messages.unblocked", "User unblocked.") });
    } catch (err) {
      showToast({ variant: "error", message: err instanceof Error ? err.message : t("common.error", "Something went wrong") });
    } finally {
      setBusy(false);
    }
  };

  const [busy, setBusy] = useState(false);
  const blockBannerMessage =
    blockStatus === "i_blocked"
      ? t(
          "messages.youBlockedBanner",
          "You have blocked this user. Unblock them to message them.",
        )
      : blockStatus === "they_blocked"
        ? t(
            "messages.blockedByOtherBanner",
            "This user has blocked you, so they can't message you and you can't message them.",
          )
        : null;

  const sendMessage = async () => {
    if (!user?.id || !threadId || !input.trim() || sending) return;
    if (blockStatus !== "none") {
      showToast({
        variant: "error",
        message: blockStatus === "i_blocked"
          ? t("messages.blockedBySelfSend", "You blocked this user. Unblock them to send messages.")
          : t("messages.blockedByOtherSend", "You can't message this user because they have blocked you."),
        durationMs: 3200,
      });
      return;
    }
    const body = input.trim();
    const result = await postMessage(threadId, body, "text", null);
    if (result.ok) {
      setInput("");
      void refetchMessages();
    } else {
      showToast({
        message: result.message || t("common.error", "Something went wrong"),
      });
    }
  };

  const preset =
    CLOUDINARY_GALLERY_UPLOAD_PRESET ||
    process.env.EXPO_PUBLIC_CLOUDINARY_KYC_PRESET ||
    "";

  const sendAttachmentImage = async (localUri: string) => {
    if (!threadId || !preset) {
      showToast({
        message: t("messages.uploadNotConfigured", "Upload is not configured."),
      });
      return;
    }
    setUploadingAttachment(true);
    try {
      const { secure_url } = await uploadToCloudinary(localUri, preset);
      const result = await postMessage(threadId, secure_url, "image", null);
      if (!result.ok) {
        showToast({
          message: result.message || t("common.error", "Something went wrong"),
        });
      } else {
        void refetchMessages();
      }
    } catch (e) {
      showToast({
        message:
          e instanceof Error
            ? e.message
            : t("messages.imageUploadFailed", "Could not send image."),
      });
    } finally {
      setUploadingAttachment(false);
    }
  };

  const openPhotoLibrary = async () => {
    setAttachMenuVisible(false);
    await new Promise<void>((resolve) => setTimeout(resolve, 250));
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast({
        message: t(
          "messages.galleryPermissionRequired",
          "Allow photo library access to attach images.",
        ),
      });
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });
    if (!picked.canceled && picked.assets[0]?.uri) {
      await sendAttachmentImage(picked.assets[0].uri);
    }
  };

  const openCamera = async () => {
    setAttachMenuVisible(false);
    // Wait for the modal to fully close before launching the camera.
    // On Android, launching the camera while a transparent modal is still
    // animating out causes the activity result to be lost (photo confirm → app "exits").
    await new Promise<void>((resolve) => setTimeout(resolve, 250));
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showToast({
        message: t(
          "messages.cameraPermissionRequired",
          "Camera access is required to take a photo.",
        ),
      });
      return;
    }
    const shot = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.9,
    });
    if (!shot.canceled && shot.assets[0]?.uri) {
      await sendAttachmentImage(shot.assets[0].uri);
    }
  };

  const openDocumentPicker = async () => {
    setAttachMenuVisible(false);
    try {
      // Dynamic import: avoids crashing the whole screen when the dev client
      // was built before expo-document-picker was added (native module missing).
      const { getDocumentAsync } = await import("expo-document-picker");
      const picked = await getDocumentAsync({
        copyToCacheDirectory: true,
        type: "*/*",
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      if (!threadId || !preset) {
        showToast({
          message: t(
            "messages.uploadNotConfigured",
            "Upload is not configured.",
          ),
        });
        return;
      }
      if (asset.mimeType?.startsWith("image/") && asset.uri) {
        await sendAttachmentImage(asset.uri);
        return;
      }
      if (!asset.uri) return;
      setUploadingAttachment(true);
      try {
        const { secure_url } = await uploadRawToCloudinary(
          asset.uri,
          asset.name ?? "file",
          asset.mimeType ?? "application/octet-stream",
          preset,
        );
        const fileMeta: Json = {
          kind: "file",
          file_name: asset.name ?? "File",
        };
        const result = await postMessage(
          threadId,
          secure_url,
          "text",
          fileMeta,
        );
        if (!result.ok) {
          showToast({
            message:
              result.message || t("common.error", "Something went wrong"),
          });
        } else {
          void refetchMessages();
        }
      } catch (e) {
        showToast({
          message:
            e instanceof Error
              ? e.message
              : t("messages.fileUploadFailed", "Could not send file."),
        });
      } finally {
        setUploadingAttachment(false);
      }
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const nativeMissing =
        errMsg.includes("ExpoDocumentPicker") ||
        errMsg.includes("Cannot find native module");
      showToast({
        message: nativeMissing
          ? t(
              "messages.documentPickerRebuildRequired",
              "Document attachments need a new native build. Run npx expo run:android (or iOS), then open the app again.",
            )
          : t("messages.fileUploadFailed", "Could not send file."),
      });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1, paddingBottom: keyboardInset }}>
        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          {metaLoading ? (
            <ChatThreadScreenSkeleton onPressBack={() => router.back()} />
          ) : isResourceNotFound(loadError) ? (
            <>
              <View
                style={[
                  styles.header,
                  { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow },
                ]}
              >
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backBtn}
                  hitSlop={12}
                >
                  <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <View style={styles.headerText}>
                  <AppText
                    variant="body"
                    numberOfLines={1}
                    style={ChatTypography.threadHeaderName}
                  >
                    {t("messages.chatUnavailable")}
                  </AppText>
                </View>
                <View style={{ width: 40 }} />
              </View>
              <ResourceMissingState
                onBack={() => router.back()}
                onHome={() =>
                  router.replace(
                    "/(private)/(tabs)/(home)" as Parameters<
                      typeof router.replace
                    >[0],
                  )
                }
              />
            </>
          ) : loadError ? (
            <>
              <View
                style={[
                  styles.header,
                  { borderBottomColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow },
                ]}
              >
                <TouchableOpacity
                  onPress={() => router.back()}
                  style={styles.backBtn}
                  hitSlop={12}
                >
                  <ArrowLeft size={24} color={colors.onSurface} />
                </TouchableOpacity>
                <View style={{ flex: 1 }} />
                <View style={{ width: 40 }} />
              </View>
              <ErrorState
                error={loadError}
                actionLabel={t("common.retry", "Retry")}
                onAction={() => {
                  setMetaRetryKey((k) => k + 1);
                }}
                mode="full"
              />
            </>
          ) : (
            <>
              {selectedIds.size > 0 ? (
                <ThreadSelectionHeader
                  colors={colors}
                  styles={styles}
                  selectedCount={selectedIds.size}
                  showDelete={canDeleteSelected}
                  onBack={() => setSelectedIds(new Set())}
                  onForward={() => setShowForwardModal(true)}
                  onDelete={() => setShowDeleteMessageModal(true)}
                />
              ) : (
                <ThreadScreenHeader
                  colors={colors}
                  styles={styles}
                  threadHeader={threadHeader}
                  actionsOpen={actionsOpen}
                  onBack={() => router.back()}
                  onOpenActions={() => setActionsOpen(true)}
                />
              )}

              <ThreadMenus
                actionsOpen={actionsOpen}
                attachMenuVisible={attachMenuVisible}
                colors={colors}
                styles={styles}
                insetsBottom={insets.bottom}
                tabBarHeight={tabBarHeight}
                t={(key, fallback) => t(key, fallback as string)}
                onCloseActions={() => setActionsOpen(false)}
                onViewProfile={() => {
                  setActionsOpen(false);
                  router.push({
                    pathname: "/(private)/(tabs)/profile/users/[id]",
                    params: { id: threadHeader.userId },
                  });
                }}
                onBlock={() => {
                  setActionsOpen(false);
                  setShowBlockConfirm(true);
                }}
                onUnblock={blockStatus === "i_blocked" ? () => {
                  setActionsOpen(false);
                  void handleUnblock();
                } : undefined}
                onCloseAttach={() => setAttachMenuVisible(false)}
                onOpenPhotoLibrary={() => {
                  void openPhotoLibrary();
                }}
                onOpenDocumentPicker={() => {
                  void openDocumentPicker();
                }}
                onOpenCamera={() => {
                  void openCamera();
                }}
              />

              <ThreadBlockConfirmModal
                visible={showBlockConfirm}
                blockBusy={blockBusy}
                t={(key, fallback) => t(key, fallback as string)}
                onConfirm={(_reason) => {
                  void (async () => {
                    if (!user?.id || !threadHeader.userId) return;
                    if (blockBusy) return;
                    setBlockBusy(true);
                    try {
                      const { error } = await supabase
                        .from("user_blocks")
                        .upsert(
                          {
                            blocker_id: user.id,
                            blocked_id: threadHeader.userId,
                          },
                          { onConflict: "blocker_id,blocked_id" },
                        );
                      if (error) throw error;
                      setShowBlockConfirm(false);
                      setBlockStatus("i_blocked");
                      showToast({
                        message: t("messages.blockedToast", "User blocked."),
                      });
                    } catch (err) {
                      showToast({
                        message:
                          err instanceof Error
                            ? err.message
                            : t("common.error", "Something went wrong"),
                      });
                    } finally {
                      setBlockBusy(false);
                    }
                  })();
                }}
                onCancel={() => setShowBlockConfirm(false)}
              />

              <FeedbackModal
                visible={showDeleteMessageModal}
                title={t("messages.deleteMessageTitle")}
                description={t("messages.deleteMessageBody")}
                primaryLabel={t("common.delete")}
                secondaryLabel={t("common.cancel")}
                destructive
                primaryLoading={deleteMessageBusy}
                onPrimary={async () => {
                  if (selectedIds.size === 0) return;
                  setDeleteMessageBusy(true);
                  try {
                    for (const sid of Array.from(selectedIds)) {
                      await deleteMessage(sid);
                    }
                    setShowDeleteMessageModal(false);
                    setSelectedIds(new Set());
                  } catch {
                    showToast({
                      variant: "error",
                      message: t(
                        "messages.deleteMessageFailed",
                        "Could not delete message.",
                      ),
                    });
                  } finally {
                    setDeleteMessageBusy(false);
                  }
                }}
                onSecondary={() => setShowDeleteMessageModal(false)}
                onRequestClose={() => setShowDeleteMessageModal(false)}
              />

              <ThreadForwardModal
                visible={showForwardModal}
                currentThreadId={threadId}
                threads={allThreads}
                threadsLoading={threadsListLoading}
                onClose={() => setShowForwardModal(false)}
                onSelectThread={(targetThreadId) => {
                  void (async () => {
                    const toForward = Array.from(selectedIds)
                      .map((sid) => messages.find((m) => m.id === sid))
                      .filter(Boolean) as typeof messages;
                    if (toForward.length === 0) {
                      setShowForwardModal(false);
                      return;
                    }
                    setShowForwardModal(false);
                    setSelectedIds(new Set());
                    let failed = 0;
                    for (const raw of toForward) {
                      const result = await postMessage(
                        targetThreadId,
                        raw.content,
                        raw.type,
                        raw.metadata,
                      );
                      if (!result.ok) failed++;
                    }
                    if (failed === 0) {
                      showToast({
                        message: t(
                          "messages.forwardSuccess",
                          "Message forwarded.",
                        ),
                      });
                    } else {
                      showToast({
                        variant: "error",
                        message: t(
                          "messages.forwardFailed",
                          "Could not forward message.",
                        ),
                      });
                    }
                  })();
                }}
              />

              <View
                style={[
                  styles.blockBanner,
                  {
                    backgroundColor:
                      blockStatus === "none"
                        ? "transparent"
                        : colors.errorContainer,
                    borderColor:
                      blockStatus === "none"
                        ? "transparent"
                        : colors.error,
                    borderWidth: blockStatus === "none" ? 0 : 1,
                  },
                ]}
              >
                {blockStatus !== "none" && (
                  <CircleAlert size={16} color={colors.onErrorContainer} />
                )}
                <AppText
                  variant="caption"
                  color={
                    blockStatus === "none"
                      ? colors.onSurfaceVariant
                      : colors.onErrorContainer
                  }
                  style={[
                    styles.blockBannerText,
                    blockStatus === "none" && { textAlign: "center" },
                  ]}
                >
                  {blockStatus === "none"
                    ? t(
                        "messages.adviceMeet",
                        "You are advised to meet users before confirming care agreements.",
                      )
                    : blockBannerMessage}
                </AppText>
                {blockStatus === "i_blocked" && (
                  <TouchableOpacity
                    onPress={() => void handleUnblock()}
                    hitSlop={8}
                  >
                    <AppText
                      variant="caption"
                      color={colors.error}
                      style={styles.blockBannerAction}
                    >
                      {t("messages.unblock", "Unblock")}
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Messages */}
              <ScrollView
                ref={scrollRef}
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {messagesLoadError ? (
                  <ErrorState
                    error={messagesLoadError}
                    actionLabel={t("common.retry", "Retry")}
                    onAction={() => {
                      void refetchMessages();
                    }}
                    mode="inline"
                  />
                ) : messagesLoading && uiMessages.length === 0 ? (
                  <View style={{ paddingVertical: 32, alignItems: "center" }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : uiMessages.length > 0 ? (
                  <>
                    {uiMessages.map((msg) => {
                      const isSelected = selectedIds.has(msg.id);
                      return (
                        <View
                          key={msg.id}
                          style={
                            isSelected
                              ? { backgroundColor: colors.primaryContainer }
                              : undefined
                          }
                        >
                          <MessageBubble
                            message={msg}
                            colors={colors}
                            selected={isSelected}
                            onSelect={() =>
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(msg.id)) next.delete(msg.id);
                                else next.add(msg.id);
                                return next;
                              })
                            }
                          />
                        </View>
                      );
                    })}
                  </>
                ) : (
                  <DataState
                    title={t("messages.noMessagesTitle", "No messages yet")}
                    message={t(
                      "messages.noMessagesSubtitle",
                      "Start the conversation by sending your first message.",
                    )}
                    illustration={<View />}
                    mode="inline"
                  />
                )}
              </ScrollView>

              {/* Input */}
              <View
                style={[
                  styles.composerWrapper,
                  {
                    backgroundColor: colors.surfaceBright,
                    borderColor: colors.outlineVariant,
                    marginBottom: keyboardInset > 0 ? 8 : 4,
                  },
                ]}
              >
                <TouchableOpacity
                  style={[styles.attachBtn, { backgroundColor: "transparent" }]}
                  hitSlop={8}
                  disabled={uploadingAttachment || sending}
                  onPress={() => setAttachMenuVisible(true)}
                >
                  <Upload size={18} color={colors.onSurface} />
                </TouchableOpacity>
                <TextInput
                  style={[
                    styles.composerInput,
                    ChatTypography.composerInput,
                    {
                      color: colors.onSurface,
                      ...(Platform.OS === "android"
                        ? {
                            paddingVertical: 10,
                            minHeight: 40,
                          }
                        : { paddingVertical: 8 }),
                    },
                  ]}
                  placeholder={t("messages.typeMessage")}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={input}
                  onChangeText={setInput}
                  multiline={false}
                  maxLength={500}
                  autoCorrect={false}
                  textAlignVertical="center"
                  underlineColorAndroid="transparent"
                  selectionColor={colors.primary}
                  {...(Platform.OS === "android"
                    ? { cursorColor: colors.primary }
                    : {})}
                />
                {uploadingAttachment ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                ) : null}
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    {
                      backgroundColor: colors.secondaryContainer,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                  hitSlop={8}
                  onPress={() => {
                    void sendMessage();
                  }}
                  disabled={sending || !input.trim() || uploadingAttachment}
                >
                  <SendHorizonal
                    size={22}
                    color={colors.onSecondaryContainer}
                  />
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  menuBtn: {
    padding: 4,
  },
  selectionHeaderSpacer: {
    flex: 1,
  },
  selectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectionHeaderIconBtn: {
    padding: 4,
  },
  bubbleSelectableWrap: {
    borderRadius: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  dateLabel: {
    alignItems: "center",
    marginVertical: 16,
  },
  bubbleWrap: {
    marginBottom: 12,
    maxWidth: "85%",
  },
  /** Proposal / application cards: wide (~90%) but not full width so side alignment still reads as sender. */
  requestBubbleWrap: {
    marginBottom: 12,
    maxWidth: "92%",
    width: "92%",
  },
  bubbleWrapLeft: {
    alignSelf: "flex-start",
  },
  bubbleWrapRight: {
    alignSelf: "flex-end",
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  requestCard: {
    padding: 10,
    borderRadius: 16,
    borderWidth: 0,
    maxWidth: "100%",
    width: "100%",
    gap: 10,
  },

  requestTopPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  requestTopPillText: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.2,
    fontWeight: "600",
  },
  requestDescriptionBox: {
    padding: 8,
    borderRadius: 16,
    width: "100%",
  },
  requestDescriptionText: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  requestPetPreview: {
    width: "100%",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    gap: 10,
  },
  requestPetImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: "hidden",
  },
  requestPetBody: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  requestPetNameRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  requestPetName: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
    fontWeight: "600",
  },
  requestPetBreedRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
  },
  requestPetBreed: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: -0.2,
    fontWeight: "500",
    flexShrink: 1,
  },
  requestPetMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 4,
  },
  metaItemTight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.2,
  },
  requestTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    width: "100%",
    marginTop: 2,
  },
  requestTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    maxWidth: "100%",
  },
  requestTagText: {
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: -0.2,
    fontWeight: "400",
  },

  requestCta: {
    marginTop: 6,
  },
  threadTakerNestedCard: {
    width: "100%",
    borderRadius: 16,
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  threadTakerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  threadTakerAvailablePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  takerCompactMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  takerCompactMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
  },
  takerTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  takerTagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 1,
  },
  takerOfferBody: {
    width: "100%",
    gap: 10,
  },
  takerOfferHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  takerOfferHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  takerChipWrap: {
    gap: 6,
  },
  takerSubLabel: {
    marginBottom: 2,
    fontWeight: "600",
  },
  takerChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  takerChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    maxWidth: "100%",
  },
  takerDetailLine: {
    gap: 4,
  },
  blockBanner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 12,
    gap: 8,
  },
  blockBannerText: {
    flex: 1,
  },
  blockBannerAction: {
    fontWeight: "600",
  },
  composerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    marginHorizontal: 12,
    // marginBottom: 8,
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
  },
  attachBtn: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    paddingHorizontal: 6,
    margin: 0,
    fontSize: 16,
    letterSpacing: -0.2,
  },
  chatImageAttachment: {
    width: 220,
    maxWidth: "85%",
    height: 160,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  fileAttachmentBubble: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "85%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    gap: 0,
  },
  attachOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    paddingLeft: 12,
  },
  attachPopup: {
    minWidth: 210,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    paddingVertical: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  attachPopupRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "nowrap",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  attachPopupLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  attachPopupDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 0,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionsOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "flex-end",
    paddingTop: 60,
    paddingRight: 16,
    backgroundColor: "transparent",
  },
  actionsCard: {
    width: 172,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 0,
    paddingHorizontal: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
    overflow: "hidden",
  },
  actionItem: {
    height: 48,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: "center",
  },
  actionItemDanger: {},
  actionItemText: {
    lineHeight: 20,
    letterSpacing: -0.2,
    fontWeight: "400",
    flexShrink: 1,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: 12,
  },
});
