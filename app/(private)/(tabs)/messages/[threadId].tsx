import { ChatTypography } from "@/src/constants/chatTypography";
import { Colors } from "@/src/constants/colors";
import { useMessages } from "@/src/features/messages/hooks/useMessages";
import { useSendMessage } from "@/src/features/messages/hooks/useSendMessage";
import {
  mapThreadMessagesToUi,
  type UiMessage,
} from "@/src/features/messages/threadMessageUi";
import { ThreadScreenHeader } from "@/src/features/messages/components/ThreadScreenHeader";
import { ThreadBlockConfirmModal } from "@/src/features/messages/components/ThreadBlockConfirmModal";
import { ThreadMenus } from "@/src/features/messages/components/ThreadMenus";
import {
  CLOUDINARY_GALLERY_UPLOAD_PRESET,
  uploadRawToCloudinary,
  uploadToCloudinary,
} from "@/src/lib/cloudinary/upload";
import {
  isResourceNotFound,
  RESOURCE_NOT_FOUND,
} from "@/src/lib/errors/resource-not-found";
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
import { AppImage } from "@/src/shared/components/ui/AppImage";
import { AppText } from "@/src/shared/components/ui/AppText";
import { Button } from "@/src/shared/components/ui/Button";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileText, SendHorizonal, Upload } from "lucide-react-native";
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

function MessageBubble({
  message,
  colors,
}: {
  message: UiMessage;
  colors: any;
}) {
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

  if (message.type === "image") {
    const uri = message.imageUri?.trim() || message.text?.trim();
    if (!uri) return null;
    const isRight = message.side === "right";
    return (
      <View
        style={[
          styles.bubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
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
      </View>
    );
  }

  if (message.type === "file") {
    const url = message.fileUrl?.trim();
    const name = message.fileName?.trim() || "File";
    if (!url) return null;
    const isRight = message.side === "right";
    return (
      <View
        style={[
          styles.bubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
        ]}
      >
        <Pressable
          onPress={() => void Linking.openURL(url)}
          style={[
            styles.fileAttachmentBubble,
            {
              backgroundColor: isRight
                ? colors.primary
                : colors.surfaceContainerHigh,
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
      </View>
    );
  }

  if (message.type === "request") {
    const rd = message.requestData;
    if (!rd) return null;
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

          {/* Pet preview card (same renderer as profile cards) */}
          <ProfilePetCard
            imageSource={rd.imageUri ? { uri: rd.imageUri } : ""}
            petName={rd.petName}
            breed={rd.breed}
            petType={rd.petType ?? ""}
            bio={rd.description ?? ""}
            yardType={rd.yardType}
            ageRange={rd.ageRange}
            energyLevel={rd.energyLevel}
            tags={[]}
            seekingDateRange={rd.date}
            seekingTime={rd.time}
            showMenu={false}
          />

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
  const [metaRetryKey, setMetaRetryKey] = useState(0);

  const {
    messages,
    loading: messagesLoading,
    error: messagesLoadError,
    refetch: refetchMessages,
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
      context,
      paramPetName,
      paramBreed,
      paramDate,
      paramTime,
      paramPrice,
      paramOfferId,
    ],
  );

  useEffect(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [uiMessages.length]);

  useEffect(() => {
    let cancelled = false;

    const loadThreadMeta = async () => {
      setThreadReady(false);
      setMetaLoading(true);
      setLoadError(null);
      setPet(null);
      setReq(null);

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
                  "id,pet_id,start_date,end_date,start_time,end_time,points_offered,care_type",
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
        const bioLine =
          typeof peer?.bio === "string"
            ? peer.bio.replace(/\s+/g, " ").trim()
            : "";
        const careLine = petRow?.name
          ? t("messages.caringForPet", { petName: petRow.name })
          : "";
        setThreadHeader({
          userId: peer?.id ?? peerId,
          name: resolveDisplayName(peer) || "User",
          subtitle: bioLine || careLine,
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

  const sendMessage = async () => {
    if (!user?.id || !threadId || !input.trim() || sending) return;
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
                  { borderBottomColor: colors.outlineVariant },
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
                  { borderBottomColor: colors.outlineVariant },
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
              <ThreadScreenHeader
                colors={colors}
                styles={styles}
                threadHeader={threadHeader}
                actionsOpen={actionsOpen}
                onBack={() => router.back()}
                onOpenActions={() => setActionsOpen(true)}
              />

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
                onCancel={() => setShowBlockConfirm(false)}
              />

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
                  uiMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} colors={colors} />
                  ))
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
                    marginBottom:
                      keyboardInset > 0 ? 8 : Math.max(insets.bottom, 2),
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
