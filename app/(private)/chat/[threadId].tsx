import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import { INPUT_LIMITS } from "@/src/constants/input-limits";
import { ThreadBlockConfirmModal } from "@/src/features/messages/components/ThreadBlockConfirmModal";
import { ThreadForwardModal } from "@/src/features/messages/components/ThreadForwardModal";
import { ThreadMenus } from "@/src/features/messages/components/ThreadMenus";
import { ThreadScreenHeader } from "@/src/features/messages/components/ThreadScreenHeader";
import { ThreadSelectionHeader } from "@/src/features/messages/components/ThreadSelectionHeader";
import { useMessages } from "@/src/features/messages/hooks/useMessages";
import { useSendMessage } from "@/src/features/messages/hooks/useSendMessage";
import { useThreads } from "@/src/features/messages/hooks/useThreads";
import {
  mapThreadMessagesToUi,
  type UiMessage,
} from "@/src/features/messages/threadMessageUi";
import {
  blockUser,
  getBlockDirection,
  unblockUser,
  type BlockDirection,
} from "@/src/lib/blocks/user-blocks";
import {
  CLOUDINARY_GALLERY_UPLOAD_PRESET,
  uploadRawToCloudinary,
  uploadToCloudinary,
} from "@/src/lib/cloudinary/upload";
import { getRequestEligibility } from "@/src/lib/contracts/request-eligibility";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import type { Json } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import { ProfilePetCard } from "@/src/shared/components/cards/ProfilePetCard";
import { ChatThreadScreenSkeleton } from "@/src/shared/components/skeletons/DetailScreenSkeleton";
import {
  DataState,
  ErrorState,
  ResourceMissingState,
} from "@/src/shared/components/ui";
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { FeedbackModal } from "@/src/shared/components/ui/FeedbackModal";
import { ImageViewerModal } from "@/src/shared/components/ui/ImageViewerModal";
import { UserAvatar } from "@/src/shared/components/ui/UserAvatar";
import * as ImagePicker from "expo-image-picker";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ArrowLeft,
  CircleAlert,
  ExternalLink,
  FileText,
  Handshake,
  MapPin,
  PawPrint,
  PlayCircle,
  SendHorizonal,
  Star,
  Upload,
  X,
} from "lucide-react-native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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

const MESSAGE_MAX_LINES = 10;
const COMPOSER_MIN_HEIGHT = 44;
const COMPOSER_MAX_HEIGHT = 44 + (MESSAGE_MAX_LINES - 1) * 18.7;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;

type AttachmentKind = "image" | "video" | "file";

type AttachmentPreview = {
  kind: AttachmentKind;
  uri: string;
  name: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
};

function formatAttachmentSize(bytes?: number | null) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return null;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function joinCompactList(values: (string | null | undefined)[]) {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean)
    .join(" • ");
}

function isAllowedDocument(params: {
  mimeType?: string | null;
  name?: string | null;
  uri?: string | null;
}) {
  const lowerMime = params.mimeType?.toLowerCase() ?? "";
  const lowerName = params.name?.toLowerCase() ?? "";
  const lowerUri = params.uri?.toLowerCase() ?? "";

  return (
    ALLOWED_DOCUMENT_TYPES.includes(
      lowerMime as (typeof ALLOWED_DOCUMENT_TYPES)[number],
    ) ||
    /\.(pdf|doc|docx|ppt|pptx)$/i.test(lowerName || lowerUri)
  );
}

function canPreviewDocumentInApp(mimeType?: string | null, name?: string | null) {
  const lowerMime = mimeType?.toLowerCase() ?? "";
  const lowerName = name?.toLowerCase() ?? "";
  return lowerMime === "application/pdf" || /\.pdf$/i.test(lowerName);
}

function getAttachmentKind(params: {
  mimeType?: string | null;
  name?: string | null;
  uri?: string | null;
  explicitType?: string | null;
}): AttachmentKind {
  const { mimeType, name, uri, explicitType } = params;
  if (explicitType === "video") return "video";
  if (explicitType === "image") return "image";

  const lowerMime = mimeType?.toLowerCase() ?? "";
  const lowerName = name?.toLowerCase() ?? "";
  const lowerUri = uri?.toLowerCase() ?? "";

  if (
    lowerMime.startsWith("video/") ||
    /\.(mp4|mov|m4v|webm|mkv)$/i.test(lowerName || lowerUri)
  ) {
    return "video";
  }

  if (
    lowerMime.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif|heic)$/i.test(lowerName || lowerUri)
  ) {
    return "image";
  }

  return "file";
}

function MessageBubble({
  message,
  colors,
  selected,
  onSelect,
  onOpenImage,
  onOpenVideo,
  onOpenFile,
}: {
  message: UiMessage;
  colors: any;
  selected: boolean;
  onSelect: () => void;
  onOpenImage?: (uri: string) => void;
  onOpenVideo?: (message: UiMessage) => void;
  onOpenFile?: (message: UiMessage) => void;
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
        <Pressable onPress={() => onOpenImage?.(uri)}>
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
    const sizeLabel = formatAttachmentSize(message.fileSizeBytes);
    const secondaryLabel = [message.fileMimeType, sizeLabel]
      .filter(Boolean)
      .join(" • ");
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
          onPress={() => onOpenFile?.(message)}
          style={[
            styles.messageAttachmentCard,
            {
              backgroundColor: isRight ? colors.primary : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View
            style={[
              styles.previewFileWrap,
              {
                backgroundColor: isRight
                  ? colors.primaryContainer
                  : colors.surfaceContainerHighest,
              },
            ]}
          >
            <FileText
              size={32}
              color={isRight ? colors.onPrimaryContainer : colors.primary}
            />
          </View>
          <View style={styles.previewMetaBlock}>
            <AppText
              variant="body"
              color={isRight ? colors.onPrimary : colors.onSurface}
              numberOfLines={2}
              style={styles.previewFileName}
            >
              {name}
            </AppText>
            {secondaryLabel ? (
              <AppText
                variant="caption"
                color={
                  isRight ? colors.onPrimary : colors.onSurfaceVariant
                }
                numberOfLines={2}
              >
                {secondaryLabel}
              </AppText>
            ) : null}
          </View>
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

  if (message.type === "video") {
    const url = message.videoUrl?.trim();
    const name = message.fileName?.trim() || "Video";
    const sizeLabel = formatAttachmentSize(message.fileSizeBytes);
    const secondaryLabel = [message.fileMimeType, sizeLabel]
      .filter(Boolean)
      .join(" • ");
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
          onPress={() => onOpenVideo?.(message)}
          style={[
            styles.messageAttachmentCard,
            {
              backgroundColor: isRight ? colors.primary : colors.surface,
              borderColor: colors.outlineVariant,
            },
          ]}
        >
          <View
            style={[
              styles.messageBubbleVideoWrap,
              {
                backgroundColor: isRight
                  ? colors.primaryContainer
                  : colors.surfaceContainerHighest,
              },
            ]}
          >
            <View style={styles.messageBubbleVideoOverlay}>
              <PlayCircle
                size={32}
                color={isRight ? colors.onPrimaryContainer : colors.onSurface}
              />
            </View>
          </View>
          <View style={styles.previewMetaBlock}>
            <AppText
              variant="body"
              color={isRight ? colors.onPrimary : colors.onSurface}
              numberOfLines={2}
              style={styles.previewFileName}
            >
              {name}
            </AppText>
            <AppText
              variant="caption"
              color={isRight ? colors.onPrimary : colors.onSurfaceVariant}
                numberOfLines={2}
            >
              {secondaryLabel || t("messages.videoLabel", "Video")}
            </AppText>
          </View>
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
    const openOfferRoute = () =>
      router.push(`/(private)/offer/${offerId}` as any);
    const openRequestRoute = () =>
      router.push(`/(private)/post-requests/${offerId}` as any);
    const ctaLabel = t("messages.viewOfferDetails");
    const isTakerCard = rd.visual === "taker";
    const isOutgoingApplicationCard = isTakerCard && isRight;
    const takerPetTypesLine = joinCompactList(
      (rd.takerPetTypesLine ?? "").split("•"),
    );
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
              backgroundColor: isOutgoingApplicationCard
                ? colors.primary
                : colors.surfaceContainerHighest,
              borderColor: isOutgoingApplicationCard
                ? colors.primary
                : colors.outlineVariant,
            },
            isOutgoingApplicationCard && {
              padding: 8,
              borderRadius: 20,
              gap: 8,
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
          {rd.description ? (
            <View
              style={[
                styles.requestDescriptionBox,
                {
                  backgroundColor: isOutgoingApplicationCard
                    ? colors.inversePrimary
                    : colors.surfaceContainerHighest,
                },
              ]}
            >
              <AppText
                variant="body"
                color={
                  isOutgoingApplicationCard
                    ? colors.onSurfaceVariant
                    : isTakerCard
                      ? colors.onPrimary
                      : colors.onSurfaceVariant
                }
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
                    pathname: "/(private)/(tabs)/(home)/users/[id]",
                  params: { id: rd.takerProfileUserId },
                } as any);
              }}
              style={[
                styles.threadTakerNestedCard,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: colors.primaryContainer,
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
                    <AppText
                      variant="title"
                      numberOfLines={1}
                      color={
                        isOutgoingApplicationCard
                          ? colors.onSurface
                          : colors.onPrimaryContainer
                      }
                      style={styles.takerName}
                    >
                      {rd.takerName?.trim()
                        ? rd.takerName
                        : t("messages.takerApplicant")}
                    </AppText>
                  </View>

                  {/* Compact meta: rating • handshakes • paws */}
                  <View style={styles.takerCompactMetaRow}>
                    <View style={styles.takerRatingItem}>
                      <AppText
                        variant="caption"
                        color={
                          isOutgoingApplicationCard
                            ? colors.onSurfaceVariant
                            : colors.onPrimaryContainer
                        }
                      >
                        {(rd.takerRating ?? 0).toFixed(1)}
                      </AppText>
                      <Star
                        size={10}
                        color={colors.tertiary}
                        fill={colors.tertiary}
                      />
                    </View>
                    <View
                      style={[
                        styles.takerCompactMetaItem,
                        { backgroundColor: colors.surfaceContainerLowest },
                      ]}
                    >
                      <Handshake size={12} color={colors.onSurfaceVariant} />
                      <AppText variant="caption" color={colors.onSurfaceVariant}>
                        {rd.takerHandshakes ?? 0}
                      </AppText>
                    </View>
                    <View
                      style={[
                        styles.takerCompactMetaItem,
                        { backgroundColor: colors.surfaceContainerLowest },
                      ]}
                    >
                      <PawPrint size={12} color={colors.onSurfaceVariant} />
                      <AppText variant="caption" color={colors.onSurfaceVariant}>
                        {rd.takerPaws ?? 0}
                      </AppText>
                    </View>
                  </View>

                  {/* Bio */}
                  {takerPetTypesLine ? (
                    <AppText
                      variant="caption"
                      color={
                        isOutgoingApplicationCard
                          ? colors.onSurface
                          : colors.onPrimaryContainer
                      }
                      numberOfLines={1}
                      style={styles.takerInlineMeta}
                    >
                      {takerPetTypesLine}
                    </AppText>
                  ) : null}
                  {rd.takerCity ? (
                    <View style={styles.takerLocationRow}>
                      <MapPin size={16} color={colors.onPrimaryContainer} />
                  <AppText
                    variant="caption"
                    color={
                      isOutgoingApplicationCard
                        ? colors.onSurface
                        : colors.onPrimaryContainer
                    }
                    numberOfLines={1}
                    style={styles.takerLocationText}
                  >
                        {rd.takerCity}
                      </AppText>
                    </View>
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
            variant={isOutgoingApplicationCard ? "inverse" : "outline"}
            color={isOutgoingApplicationCard ? colors.primary : undefined}
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
                if (context === "applying") {
                  openOfferRoute();
                  return;
                }
                if (isRight) {
                  openRequestRoute();
                  return;
                }
                openOfferRoute();
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
  threadId = "",
  mode,
  petName,
  breed,
  date,
  time,
  price,
  offerId,
} = useLocalSearchParams<{
  threadId?: string;
  mode?: string;
  petName?: string;
  breed?: string;
  date?: string;
  time?: string;
  price?: string;
  offerId?: string;
}>();
  // ... rest of your code

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
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
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
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [attachMenuVisible, setAttachMenuVisible] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [composerHeight, setComposerHeight] = useState(COMPOSER_MIN_HEIGHT);
  const [messageImages, setMessageImages] = useState<string[]>([]);
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [pendingAttachment, setPendingAttachment] =
    useState<AttachmentPreview | null>(null);
  const [openVideo, setOpenVideo] = useState<{
    uri: string;
    name: string;
  } | null>(null);
  const [openFile, setOpenFile] = useState<{
    url: string;
    name: string;
    mimeType?: string;
    sizeBytes?: number | null;
    externalOnly?: boolean;
  } | null>(null);
  const pendingVideoPlayer = useVideoPlayer(
    pendingAttachment?.kind === "video" ? pendingAttachment.uri : null,
    (player) => {
      player.loop = false;
    },
  );
  const messageVideoPlayer = useVideoPlayer(openVideo?.uri ?? null, (player) => {
    player.loop = false;
  });

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

  useEffect(() => {
    if (pendingAttachment?.kind !== "video") {
      pendingVideoPlayer.pause();
    }
  }, [pendingAttachment?.kind, pendingVideoPlayer]);

  useEffect(() => {
    if (!openVideo) {
      messageVideoPlayer.pause();
    }
  }, [messageVideoPlayer, openVideo]);

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
      await unblockUser(user.id, threadHeader.userId);
      setBlockStatus("none");
      setShowUnblockConfirm(false);
      showToast({
        variant: "success",
        message: t("messages.unblocked", "User unblocked."),
      });
    } catch (err) {
      showToast({
        variant: "error",
        message:
          err instanceof Error
            ? err.message
            : t("common.error", "Could not unblock this user right now."),
      });
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
      setComposerHeight(COMPOSER_MIN_HEIGHT);
      void refetchMessages();
    } else {
      showToast({
        variant: "error",
        message:
          result.message ||
          t(
            "messages.sendFailed",
            "We couldn't send your message right now. Please try again.",
          ),
      });
    }
  };

  const preset =
    CLOUDINARY_GALLERY_UPLOAD_PRESET ||
    process.env.EXPO_PUBLIC_CLOUDINARY_KYC_PRESET ||
    "";

  const openDocumentPreview = async (url: string, fallbackMessage: string) => {
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: colors.primary,
        showTitle: true,
      });
    } catch {
      showToast({ message: fallbackMessage, variant: "error" });
    }
  };

  const openExternalDocument = async (url: string, fallbackMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("Unsupported document url");
      await Linking.openURL(url);
    } catch {
      showToast({ message: fallbackMessage, variant: "error" });
    }
  };

  const queueAttachmentPreview = (attachment: AttachmentPreview) => {
    if (
      attachment.kind === "image" &&
      attachment.sizeBytes &&
      attachment.sizeBytes > MAX_IMAGE_SIZE_BYTES
    ) {
      showToast({
        variant: "error",
        message: t(
          "messages.imageTooLarge",
          "Images must be 5MB or smaller before you can send them.",
        ),
        durationMs: 3600,
      });
      return;
    }

    if (
      attachment.kind === "video" &&
      attachment.sizeBytes &&
      attachment.sizeBytes > MAX_VIDEO_SIZE_BYTES
    ) {
      showToast({
        variant: "error",
        message: t(
          "messages.videoTooLarge",
          "Videos must be 10MB or smaller before you can send them.",
        ),
        durationMs: 3600,
      });
      return;
    }

    setPendingAttachment(attachment);
  };

  const sendPendingAttachment = async () => {
    if (!pendingAttachment) return;
    if (!threadId || !preset) {
      showToast({
        variant: "error",
        message: t("messages.uploadNotConfigured", "Upload is not configured."),
      });
      return;
    }

    setUploadingAttachment(true);
    try {
      if (pendingAttachment.kind === "image") {
        const { secure_url } = await uploadToCloudinary(
          pendingAttachment.uri,
          preset,
        );
        const result = await postMessage(threadId, secure_url, "image", null);
        if (!result.ok) {
          showToast({
            variant: "error",
            message:
              result.message ||
              t(
                "messages.imageSendFailed",
                "We couldn't send that image right now.",
              ),
          });
          return;
        }
      } else {
        const { secure_url } = await uploadRawToCloudinary(
          pendingAttachment.uri,
          pendingAttachment.name,
          pendingAttachment.mimeType ?? "application/octet-stream",
          preset,
        );
        const result = await postMessage(threadId, secure_url, "text", {
          kind: pendingAttachment.kind === "video" ? "video" : "file",
          file_name: pendingAttachment.name,
          mime_type: pendingAttachment.mimeType ?? null,
          size_bytes: pendingAttachment.sizeBytes ?? null,
        } as Json);
        if (!result.ok) {
          showToast({
            variant: "error",
            message:
              result.message ||
              t(
                pendingAttachment.kind === "video"
                  ? "messages.videoSendFailed"
                  : "messages.fileSendFailed",
                pendingAttachment.kind === "video"
                  ? "We couldn't send that video right now."
                  : "We couldn't send that document right now.",
              ),
          });
          return;
        }
      }

      setPendingAttachment(null);
      void refetchMessages();
    } catch (e) {
      showToast({
        variant: "error",
        message:
          e instanceof Error
            ? e.message
            : t(
                pendingAttachment.kind === "video"
                  ? "messages.videoSendFailed"
                  : pendingAttachment.kind === "image"
                    ? "messages.imageSendFailed"
                    : "messages.fileSendFailed",
                pendingAttachment.kind === "video"
                  ? "We couldn't send that video right now."
                  : pendingAttachment.kind === "image"
                    ? "We couldn't send that image right now."
                    : "We couldn't send that document right now.",
              ),
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
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 0.9,
    });
    const asset = picked.canceled ? null : picked.assets[0];
    if (asset?.uri) {
      queueAttachmentPreview({
        kind: getAttachmentKind({
          mimeType: asset.mimeType,
          name: asset.fileName,
          uri: asset.uri,
          explicitType: asset.type,
        }),
        uri: asset.uri,
        name: asset.fileName ?? asset.assetId ?? "Attachment",
        mimeType: asset.mimeType,
        sizeBytes: asset.fileSize ?? null,
      });
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
    const asset = shot.canceled ? null : shot.assets[0];
    if (asset?.uri) {
      queueAttachmentPreview({
        kind: "image",
        uri: asset.uri,
        name: asset.fileName ?? "Camera photo",
        mimeType: asset.mimeType,
        sizeBytes: asset.fileSize ?? null,
      });
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
        type: [...ALLOWED_DOCUMENT_TYPES],
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
      if (!asset.uri) return;
      if (
        !isAllowedDocument({
          mimeType: asset.mimeType,
          name: asset.name,
          uri: asset.uri,
        })
      ) {
        showToast({
          variant: "error",
          message: t(
            "messages.documentTypesRestricted",
            "Only PDF, Word, and PowerPoint documents can be sent here.",
          ),
          durationMs: 3200,
        });
        return;
      }
      queueAttachmentPreview({
        kind: "file",
        uri: asset.uri,
        name: asset.name ?? "Attachment",
        mimeType: asset.mimeType,
        sizeBytes: asset.size ?? null,
      });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      const nativeMissing =
        errMsg.includes("ExpoDocumentPicker") ||
        errMsg.includes("Cannot find native module");
      showToast({
        variant: "error",
        message: nativeMissing
          ? t(
              "messages.documentPickerRebuildRequired",
              "Document attachments need a new native build. Run npx expo run:android (or iOS), then open the app again.",
            )
          : t(
              "messages.filePickFailed",
              "We couldn't open the document picker right now.",
            ),
      });
    }
  };

  const openMessageVideo = (message: UiMessage) => {
    const uri = message.videoUrl?.trim();
    if (!uri) return;
    setOpenVideo({
      uri,
      name: message.fileName?.trim() || t("messages.videoLabel", "Video"),
    });
  };

  const openMessageFile = (message: UiMessage) => {
    const url = message.fileUrl?.trim();
    if (!url) return;
    const externalOnly = !canPreviewDocumentInApp(
      message.fileMimeType,
      message.fileName,
    );
    setOpenFile({
      url,
      name: message.fileName?.trim() || t("messages.attachment", "Attachment"),
      mimeType: message.fileMimeType,
      sizeBytes: message.fileSizeBytes,
      externalOnly,
    });
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
                t={(key, fallback) => t(key, fallback as string)}
                onCloseActions={() => setActionsOpen(false)}
                onViewProfile={() => {
                  setActionsOpen(false);
                  router.push({
                pathname: "/(private)/(tabs)/(home)/users/[id]",
                    params: { id: threadHeader.userId },
                  });
                }}
                onBlock={() => {
                  setActionsOpen(false);
                  setShowBlockConfirm(true);
                }}
                onUnblock={blockStatus === "i_blocked" ? () => {
                  setActionsOpen(false);
                  setShowUnblockConfirm(true);
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
                      await blockUser(user.id, threadHeader.userId);
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
                            : t(
                                "messages.blockFailed",
                                "We couldn't update this block right now.",
                              ),
                      });
                    } finally {
                      setBlockBusy(false);
                    }
                  })();
                }}
                onCancel={() => setShowBlockConfirm(false)}
              />

              <FeedbackModal
                visible={showUnblockConfirm}
                title={t("messages.unblock", "Unblock")}
                description={t(
                  "messages.unblockConfirmDescription",
                  "You’ll be able to message this user again after unblocking them.",
                )}
                primaryLabel={t("messages.unblock", "Unblock")}
                secondaryLabel={t("common.cancel")}
                primaryLoading={busy}
                onPrimary={() => {
                  void handleUnblock();
                }}
                onSecondary={() => {
                  if (busy) return;
                  setShowUnblockConfirm(false);
                }}
                onRequestClose={() => {
                  if (busy) return;
                  setShowUnblockConfirm(false);
                }}
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
                    onPress={() => setShowUnblockConfirm(true)}
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
                            onOpenImage={(uri) => {
                              setMessageImages([uri]);
                              setImageViewerOpen(true);
                            }}
                            onOpenVideo={openMessageVideo}
                            onOpenFile={openMessageFile}
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
                      height: composerHeight,
                    },
                  ]}
                  placeholder={t("messages.typeMessage")}
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  maxLength={INPUT_LIMITS.message}
                  autoCorrect={false}
                  textAlignVertical="top"
                  underlineColorAndroid="transparent"
                  selectionColor={colors.primary}
                  onContentSizeChange={(event) => {
                    const nextHeight = Math.min(
                      COMPOSER_MAX_HEIGHT,
                      Math.max(
                        COMPOSER_MIN_HEIGHT,
                        event.nativeEvent.contentSize.height,
                      ),
                    );
                    setComposerHeight(nextHeight);
                  }}
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
              <Modal
                transparent
                animationType="fade"
                visible={pendingAttachment != null}
                onRequestClose={() => {
                  if (uploadingAttachment) return;
                  setPendingAttachment(null);
                }}
              >
                <View style={styles.previewOverlay}>
                  <View
                    style={[
                      styles.previewCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View style={styles.previewHeader}>
                      <AppText variant="title" style={styles.previewTitle}>
                        {t("messages.previewAttachment", "Preview attachment")}
                      </AppText>
                      <TouchableOpacity
                        hitSlop={8}
                        disabled={uploadingAttachment}
                        onPress={() => setPendingAttachment(null)}
                      >
                        <X size={18} color={colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>

                    {pendingAttachment?.kind === "image" ? (
                      <AppImage
                        source={{ uri: pendingAttachment.uri }}
                        style={styles.previewImage}
                        contentFit="cover"
                      />
                    ) : pendingAttachment?.kind === "video" ? (
                      <View
                        style={[
                          styles.previewVideoWrap,
                          { backgroundColor: colors.surfaceContainerHighest },
                        ]}
                      >
                        <VideoView
                          player={pendingVideoPlayer}
                          style={styles.previewVideo}
                          nativeControls
                          contentFit="contain"
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.previewFileWrap,
                          { backgroundColor: colors.surfaceContainerHighest },
                        ]}
                      >
                        <FileText size={32} color={colors.primary} />
                      </View>
                    )}

                    <View style={styles.previewMetaBlock}>
                      <AppText variant="body" style={styles.previewFileName}>
                        {pendingAttachment?.name}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                      >
                        {[
                          pendingAttachment?.mimeType,
                          formatAttachmentSize(pendingAttachment?.sizeBytes),
                        ]
                          .filter(Boolean)
                          .join(" • ") ||
                          (pendingAttachment?.kind === "video"
                            ? t("messages.videoLabel", "Video")
                            : pendingAttachment?.kind === "image"
                              ? t("messages.imageLabel", "Image")
                              : t("messages.documentLabel", "Document"))}
                      </AppText>
                    </View>

                    <View style={styles.previewActions}>
                      <Button
                        label={t("common.cancel", "Cancel")}
                        variant="outline"
                        onPress={() => setPendingAttachment(null)}
                        style={styles.previewActionBtn}
                        disabled={uploadingAttachment}
                      />
                      <Button
                        label={t("messages.sendAttachment", "Send")}
                        onPress={() => {
                          void sendPendingAttachment();
                        }}
                        style={styles.previewActionBtn}
                        loading={uploadingAttachment}
                        disabled={uploadingAttachment}
                      />
                    </View>
                  </View>
                </View>
              </Modal>
              <ImageViewerModal
                visible={openVideo != null}
                images={[]}
                title={openVideo?.name || t("messages.videoLabel", "Video")}
                onRequestClose={() => setOpenVideo(null)}
              >
                <View style={styles.messageViewerBody}>
                  <View
                    style={[
                      styles.messageViewerMediaFrame,
                      { backgroundColor: colors.background },
                    ]}
                  >
                    <VideoView
                      player={messageVideoPlayer}
                      style={styles.messageViewerVideo}
                      nativeControls
                      contentFit="contain"
                    />
                  </View>
                </View>
              </ImageViewerModal>
              <ImageViewerModal
                visible={openFile != null}
                images={[]}
                title={t("messages.documentLabel", "Document")}
                onRequestClose={() => setOpenFile(null)}
              >
                <View style={styles.messageViewerBody}>
                  <View
                    style={[
                      styles.messageViewerFileCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.outlineVariant,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.previewFileWrap,
                        { backgroundColor: colors.surfaceContainerHighest },
                      ]}
                    >
                      <FileText size={32} color={colors.primary} />
                    </View>
                    <View style={styles.previewMetaBlock}>
                      <AppText variant="body" style={styles.previewFileName}>
                        {openFile?.name}
                      </AppText>
                      <AppText
                        variant="caption"
                        color={colors.onSurfaceVariant}
                      >
                        {[
                          openFile?.mimeType,
                          formatAttachmentSize(openFile?.sizeBytes),
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </AppText>
                    </View>
                    <Button
                      label={
                        openFile?.externalOnly
                          ? t("messages.openDocumentExternal", "Open externally")
                          : t("messages.openDocument", "Open document")
                      }
                      onPress={() => {
                        if (!openFile?.url) return;
                        if (openFile.externalOnly) {
                          void openExternalDocument(
                            openFile.url,
                            t(
                              "messages.documentExternalOpenFailed",
                              "We couldn't open this document in another app.",
                            ),
                          );
                          return;
                        }
                        void openDocumentPreview(
                          openFile.url,
                          t(
                            "messages.documentOpenFailed",
                            "We couldn't open this document on your device.",
                          ),
                        );
                      }}
                      style={styles.previewSingleAction}
                      leftIcon={
                        <ExternalLink
                          size={16}
                          color={colors.onPrimary}
                        />
                      }
                    />
                  </View>
                </View>
              </ImageViewerModal>
              <ImageViewerModal
                visible={imageViewerOpen}
                images={messageImages.map((uri) => ({ uri }))}
                onRequestClose={() => setImageViewerOpen(false)}
              />
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
    padding: 16,
    gap: 8,
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
  takerRatingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  takerCompactMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 999,
  },
  takerName: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.25,
    fontWeight: "600",
  },
  takerInlineMeta: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: -0.2,
    fontWeight: "500",
  },
  takerTagsRow: {
    display: "none",
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
    gap: 4,
  },
  takerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  takerLocationText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: -0.2,
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
    alignItems: "flex-end",
    marginHorizontal: 12,
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 8,
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
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 999,
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
  messageAttachmentCard: {
    width: 240,
    maxWidth: "85%",
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  fileAttachmentBody: {
    flex: 1,
    minWidth: 0,
    marginLeft: 8,
  },
  fileAttachmentTitle: {
    flex: 1,
    minWidth: 0,
  },
  fileAttachmentMeta: {
    marginTop: 2,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  previewCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    padding: 16,
    gap: 14,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  previewTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
  },
  previewImage: {
    width: "100%",
    height: 280,
    borderRadius: 16,
  },
  previewVideoWrap: {
    width: "100%",
    height: 280,
    borderRadius: 16,
    overflow: "hidden",
  },
  messageBubbleVideoWrap: {
    width: "100%",
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubbleVideo: {
    width: "100%",
    height: "100%",
  },
  messageBubbleVideoOverlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  previewVideo: {
    width: "100%",
    height: "100%",
  },
  previewFileWrap: {
    width: "100%",
    height: 140,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  previewMetaBlock: {
    gap: 4,
  },
  messageViewerBody: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  messageViewerMediaFrame: {
    width: "100%",
    maxWidth: 720,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
  },
  messageViewerVideo: {
    width: "100%",
    height: "100%",
  },
  messageViewerFileCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  previewFileName: {
    fontWeight: "600",
  },
  previewActions: {
    flexDirection: "row",
    gap: 12,
  },
  previewActionBtn: {
    flex: 1,
  },
  previewSingleAction: {
    minHeight: 48,
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
