import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import { formatCarePointsPts } from "@/src/lib/points/carePoints";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useThemeStore } from "@/src/lib/store/theme.store";
import { useToastStore } from "@/src/lib/store/toast.store";
import { supabase } from "@/src/lib/supabase/client";
import type { Database, Json } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
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
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Calendar,
  ChevronLeft,
  EllipsisVertical,
  SendHorizonal,
  Upload
} from "lucide-react-native";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
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

type BubbleSide = "left" | "right";
type MessageType = "text" | "image" | "request";
type UiMessage = {
  id: string;
  side: BubbleSide;
  type: MessageType;
  text?: string;
  timeLabel: string;
  requestData?: {
    petName: string;
    breed: string;
    petType?: string;
    imageUri?: string;
    description?: string;
    tags?: string[];
    careType?: string;
    date: string;
    time: string;
    price: string;
    context: "seeking" | "applying";
    offerId: string;
  };
};

type DbMessage = Database["public"]["Tables"]["messages"]["Row"];
/** Subset returned by thread message list query (not full row). */
type MessageListRow = Pick<
  DbMessage,
  "id" | "sender_id" | "content" | "type" | "metadata" | "created_at"
>;

function readMetadataString(metadata: Json | null | undefined, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const v = (metadata as Record<string, Json>)[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function MessageBubble({ message, colors }: { message: any; colors: any }) {
  const { t } = useTranslation();
  const router = useRouter();
  const isRight = message.side === "right";

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

  if (message.type === "request") {
    const rd = message.requestData;
    const context = rd.context === "seeking" ? "seeking" : "applying";
    const offerId = typeof rd.offerId === "string" ? rd.offerId.trim() : "";
    const ctaLabel = t("messages.viewOfferDetails");
    return (
      <View
        style={[
          styles.bubbleWrap,
          styles.requestBubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
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

          {/* Description box */}
          {rd.description ? (
            <View
              style={[
                styles.requestDescriptionBox,
                { backgroundColor: colors.surfaceContainerHigh },
              ]}
            >
              <AppText
                variant="body"
                color={colors.onSurfaceVariant}
                style={styles.requestDescriptionText}
                numberOfLines={5}
              >
                {rd.description}
              </AppText>
            </View>
          ) : null}

          {/* Pet preview card */}
          <View
            style={[
              styles.requestPetPreview,
              { backgroundColor: colors.surfaceBright },
            ]}
          >
            <View
              style={[
                styles.requestPetImage,
                { backgroundColor: colors.surfaceContainerHighest },
              ]}
            >
              {rd.imageUri ? (
                <AppImage
                  source={{ uri: rd.imageUri }}
                  style={styles.requestPetImage}
                  contentFit="cover"
                />
              ) : null}
            </View>

            <View style={styles.requestPetBody}>
              <View style={styles.requestPetNameRow}>
                <AppText
                  variant="title"
                  color={colors.onSurface}
                  style={styles.requestPetName}
                  numberOfLines={1}
                >
                  {rd.petName}
                </AppText>
              </View>

              <View style={styles.requestPetBreedRow}>
                <AppText
                  variant="caption"
                  color={colors.onSurface}
                  style={styles.requestPetBreed}
                  numberOfLines={1}
                >
                  {rd.breed}
                </AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>
                  {" "}
                  •{" "}
                </AppText>
                <AppText
                  variant="caption"
                  color={colors.onSurfaceVariant}
                  style={styles.requestPetBreed}
                  numberOfLines={1}
                >
                  {rd.petType ?? ""}
                </AppText>
              </View>

              <View style={styles.requestPetMetaRow}>
                <View style={styles.metaItemTight}>
                  <Calendar size={16} color={colors.onSurfaceVariant} />
                  <AppText
                    variant="caption"
                    color={colors.onSurface}
                    style={styles.metaText}
                    numberOfLines={1}
                  >
                    {rd.date}
                  </AppText>
                </View>
                {rd.careType ? (
                  <>
                    <AppText variant="caption" color={colors.onSurfaceVariant}>
                      {" "}
                      •{" "}
                    </AppText>
                    <View style={styles.metaItemTight}>
                      <AppText
                        variant="caption"
                        color={colors.onSurface}
                        style={styles.metaText}
                        numberOfLines={1}
                      >
                        {rd.careType}
                      </AppText>
                    </View>
                  </>
                ) : null}
              </View>

              {Array.isArray(rd.tags) && rd.tags.length > 0 ? (
                <View style={styles.requestTagsRow}>
                  {rd.tags.slice(0, 3).map((tag: string, idx: number) => (
                    <View
                      key={`${tag}-${idx}`}
                      style={[
                        styles.requestTag,
                        { backgroundColor: colors.surfaceContainerHigh },
                      ]}
                    >
                      <AppText
                        variant="caption"
                        color={colors.onSecondaryContainer}
                        style={styles.requestTagText}
                        numberOfLines={1}
                      >
                        {tag}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <Button
            label={ctaLabel}
            variant="outline"
            style={styles.requestCta}
            disabled={!offerId}
            onPress={() => {
              if (!offerId) return;
              if (context === "seeking") {
                router.push(`/(private)/post-requests/${offerId}` as any);
                return;
              }
              router.push(`/(private)/post-availability/${offerId}` as any);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.bubbleWrap,
        isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isRight
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 8 }
            : {
                backgroundColor: colors.surfaceContainerHigh,
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
    </View>
  );
}

export default function ThreadScreen() {
  const {
    threadId: _threadId,
    mode,
    petName,
    breed,
    date,
    time,
    price,
    offerId,
  } = useLocalSearchParams<{
    threadId: string;
    mode?: string;
    petName?: string;
    breed?: string;
    date?: string;
    time?: string;
    price?: string;
    offerId?: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const showToast = useToastStore((s) => s.showToast);
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blockBusy, setBlockBusy] = useState(false);
  const [thread, setThread] = useState<{
    userId: string;
    name: string;
    subtitle: string;
    avatarUri: string | null;
    messages: UiMessage[];
  }>({
    userId: "",
    name: "User",
    subtitle: "",
    avatarUri: null,
    messages: [],
  });

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

  const formatTime = (iso?: string) => {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const loadThread = async () => {
    if (!user?.id || !_threadId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const { data: threadRow, error: threadError } = await supabase
        .from("threads")
        .select("id,participant_ids,request_id")
        .eq("id", _threadId)
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
      const [{ data: peer }, { data: messages }, { data: req }] =
        await Promise.all([
          peerId
            ? supabase
                .from("users")
                .select("id,full_name,avatar_url")
                .eq("id", peerId)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
          supabase
            .from("messages")
            .select("id,sender_id,content,type,metadata,created_at")
            .eq("thread_id", _threadId)
            .order("created_at", { ascending: true }),
          threadRow?.request_id
            ? supabase
                .from("care_requests")
                .select(
                  "id,pet_id,start_date,end_date,start_time,end_time,points_offered,care_type",
                )
                .eq("id", threadRow.request_id)
                .maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);

      let pet: any = null;
      if (req?.pet_id) {
        const { data: petData } = await supabase
          .from("pets")
          .select(
            "id,name,breed,species,photo_urls,notes,yard_type,age_range,energy_level,has_special_needs,special_needs_description",
          )
          .eq("id", req.pet_id)
          .maybeSingle();
        pet = petData;
      }

      const uiMessages: UiMessage[] = (messages ?? []).map(
        (m: MessageListRow) => {
          const side: BubbleSide = m.sender_id === user.id ? "right" : "left";
          const asRequest =
            (m.type === "proposal" || m.type === "agreement") &&
            (pet || paramPetName || paramBreed);
          if (asRequest) {
            const metaRequestId = readMetadataString(m.metadata, "requestId");
            const offer =
              paramOfferId ??
              metaRequestId ??
              (typeof req?.id === "string" ? req.id : "");

            const petNotes = parsePetNotes(pet?.notes);
            const tags = [
              pet?.yard_type ?? petNotes.yardType,
              pet?.energy_level ?? petNotes.energyLevel,
              pet?.age_range ?? petNotes.ageRange,
            ].filter(
              (v: any): v is string =>
                typeof v === "string" && v.trim().length > 0,
            );

            const img = pet ? (petGalleryUrls(pet)[0] ?? "") : "";

            return {
              id: m.id,
              side,
              type: "request",
              timeLabel: formatTime(m.created_at),
              requestData: {
                petName: paramPetName ?? pet?.name ?? "Pet",
                breed: paramBreed ?? pet?.breed ?? "Unknown breed",
                petType: pet?.species ?? "",
                imageUri: img || undefined,
                description:
                  (petNotes.bio || "").trim().length > 0
                    ? (petNotes.bio || "").trim()
                    : undefined,
                tags,
                careType:
                  typeof req?.care_type === "string" && req.care_type.trim()
                    ? req.care_type
                    : undefined,
                date:
                  paramDate ??
                  (req?.start_date && req?.end_date
                    ? `${new Date(req.start_date).toLocaleDateString()} - ${new Date(req.end_date).toLocaleDateString()}`
                    : ""),
                time:
                  paramTime ??
                  (typeof req?.start_time === "string" &&
                  typeof req?.end_time === "string"
                    ? `${req.start_time.slice(0, 5)} - ${req.end_time.slice(0, 5)}`
                    : ""),
                price:
                  paramPrice ??
                  (req?.start_date && req?.end_date
                    ? formatCarePointsPts(
                        req.care_type,
                        req.start_date as string,
                        req.end_date as string,
                      )
                    : ""),
                context,
                offerId: offer,
              },
            };
          }
          return {
            id: m.id,
            side,
            type: "text",
            text: m.content ?? "",
            timeLabel: formatTime(m.created_at),
          };
        },
      );

      setThread({
        userId: peer?.id ?? peerId,
        name: resolveDisplayName(peer) || "User",
        subtitle: pet?.name ? `Caring for ${pet.name}` : "",
        avatarUri: peer?.avatar_url ?? null,
        messages: uiMessages,
      });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load thread.",
      );
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    void loadThread();
  }, [_threadId, user?.id]);

  const sendMessage = async () => {
    if (!user?.id || !_threadId || !input.trim() || sending) return;
    const body = input.trim();
    setSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        thread_id: _threadId,
        sender_id: user.id,
        content: body,
        type: "text",
        metadata: null,
        read_at: null,
      });
      if (error) throw error;
      setInput("");
      await supabase
        .from("threads")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", _threadId);
      await loadThread();
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {loading ? (
          <ChatThreadScreenSkeleton onPressBack={() => router.back()} />
        ) : isResourceNotFound(loadError) ? (
          <>
            <View
              style={[
                styles.header,
                { borderBottomColor: colors.outlineVariant },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                hitSlop={12}
              >
                <ChevronLeft size={24} color={colors.onSurface} />
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
                { borderBottomColor: colors.outlineVariant },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                hitSlop={12}
              >
                <ChevronLeft size={24} color={colors.onSurface} />
              </TouchableOpacity>
              <View style={{ flex: 1 }} />
              <View style={{ width: 40 }} />
            </View>
            <ErrorState
              error={loadError}
              actionLabel={t("common.retry", "Retry")}
              onAction={() => {
                void loadThread();
              }}
              mode="full"
            />
          </>
        ) : (
          <>
            {/* Header: back, avatar, name, subtitle, menu */}
            <View
              style={[
                styles.header,
                { borderBottomColor: colors.outlineVariant },
              ]}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backBtn}
                hitSlop={12}
              >
                <ChevronLeft size={24} color={colors.onSurface} />
              </TouchableOpacity>
              {thread.avatarUri ? (
                <AppImage
                  source={{ uri: thread.avatarUri }}
                  style={styles.headerAvatar}
                  contentFit="cover"
                />
              ) : (
                <View
                  style={[
                    styles.headerAvatar,
                    { backgroundColor: colors.surfaceContainer },
                  ]}
                />
              )}
              <View style={styles.headerText}>
                <AppText
                  variant="body"
                  numberOfLines={1}
                  style={ChatTypography.threadHeaderName}
                >
                  {thread.name}
                </AppText>
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  numberOfLines={1}
                  style={ChatTypography.threadHeaderSubtitle}
                >
                  {thread.subtitle}
                </AppText>
              </View>
              <TouchableOpacity
                style={[
                  styles.menuBtn,
                  {
                    backgroundColor: actionsOpen
                      ? colors.surfaceContainer
                      : "transparent",
                  },
                ]}
                hitSlop={12}
                onPress={() => setActionsOpen(true)}
              >
                <EllipsisVertical size={24} color={colors.onSurface} />
              </TouchableOpacity>
            </View>

            {/* Chat actions menu (Figma 374-13745) */}
            <Modal
              transparent
              visible={actionsOpen}
              onRequestClose={() => setActionsOpen(false)}
              animationType="fade"
            >
              <Pressable
                style={styles.actionsOverlay}
                onPress={() => setActionsOpen(false)}
              >
                <View
                  style={[
                    styles.actionsCard,
                    {
                      backgroundColor: colors.surfaceContainerLowest,
                      borderColor: colors.outlineVariant,
                    },
                  ]}
                  onStartShouldSetResponder={() => true}
                >
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionItem,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      setActionsOpen(false);
                      router.push({
                        pathname: "/(private)/(tabs)/profile/users/[id]",
                        params: { id: thread.userId },
                      });
                    }}
                  >
                    <AppText
                      variant="body"
                      color={colors.onSurface}
                      numberOfLines={1}
                      style={styles.actionItemText}
                    >
                      {t("messages.viewProfile")}
                    </AppText>
                  </Pressable>

                  <View
                    style={[
                      styles.menuDivider,
                      { backgroundColor: colors.outlineVariant },
                    ]}
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionItem,
                      styles.actionItemDanger,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => {
                      setActionsOpen(false);
                      setShowBlockConfirm(true);
                    }}
                  >
                    <AppText
                      variant="body"
                      color={colors.error}
                      numberOfLines={1}
                      style={styles.actionItemText}
                    >
                      {t("messages.block")}
                    </AppText>
                  </Pressable>
                </View>
              </Pressable>
            </Modal>

            <FeedbackModal
              visible={showBlockConfirm}
              title={t("messages.blockConfirmTitle")}
              description={t("messages.blockConfirmDescription")}
              primaryLabel={t("messages.block")}
              secondaryLabel={t("common.cancel")}
              destructive
              primaryLoading={blockBusy}
              onPrimary={() => {
                void (async () => {
                  if (!user?.id || !thread.userId) return;
                  if (blockBusy) return;
                  setBlockBusy(true);
                  try {
                    const { error } = await supabase
                      .from("user_blocks")
                      .upsert(
                        { blocker_id: user.id, blocked_id: thread.userId },
                        { onConflict: "blocker_id,blocked_id" },
                      );
                    if (error) throw error;
                    setShowBlockConfirm(false);
                    showToast({
                      message: t("messages.blockedToast", "User blocked."),
                    });
                    // Back to chats list after blocking.
                    router.replace("/(private)/(tabs)/messages" as any);
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
              onSecondary={() => setShowBlockConfirm(false)}
              onRequestClose={() => setShowBlockConfirm(false)}
            />

            {/* Messages */}
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {thread.messages.length > 0 ? (
                thread.messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} colors={colors} />
                ))
              ) : (
                <DataState
                  title={t("messages.noMessagesTitle", "No messages yet")}
                  message={t(
                    "messages.noMessagesSubtitle",
                    "Start the conversation by sending your first message.",
                  )}
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
                },
              ]}
            >
              <TouchableOpacity
                style={[styles.attachBtn, { backgroundColor: "transparent" }]}
                hitSlop={8}
              >
                <Upload size={18} color={colors.onSurface} />
              </TouchableOpacity>
              <TextInput
                style={[styles.composerInput, { color: colors.onSurface }]}
                placeholder={t("messages.typeMessage")}
                placeholderTextColor={colors.onSurfaceVariant}
                value={input}
                onChangeText={setInput}
                multiline={false}
                maxLength={500}
                autoCorrect={false}
                textAlignVertical="center"
                underlineColorAndroid="transparent"
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: colors.tertiaryContainer,
                    borderColor: colors.outlineVariant,
                  },
                ]}
                hitSlop={8}
                onPress={() => {
                  void sendMessage();
                }}
                disabled={sending || !input.trim()}
              >
                <SendHorizonal size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  requestBubbleWrap: {
    maxWidth: "100%",
    alignSelf: "stretch",
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
    marginTop: 2,
  },
  composerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    marginHorizontal: 12,
    marginBottom: 8,
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
    paddingHorizontal: 4,
    paddingVertical: 0,
    margin: 0,
    fontSize: 18,
    lineHeight: 22,
    letterSpacing: -0.25,
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
