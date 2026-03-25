import React, { useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send, EllipsisVertical, Upload, Calendar, Clock } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { ChatTypography } from '@/src/constants/chatTypography';
import { useAuthStore } from '@/src/lib/store/auth.store';
import { supabase } from '@/src/lib/supabase/client';
import { resolveDisplayName } from '@/src/lib/user/displayName';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { FeedbackModal } from '@/src/shared/components/ui/FeedbackModal';
import { Button } from '@/src/shared/components/ui/Button';
import { DataState } from '@/src/shared/components/ui';

type BubbleSide = 'left' | 'right';
type MessageType = 'text' | 'image' | 'request';
type UiMessage = {
  id: string;
  side: BubbleSide;
  type: MessageType;
  text?: string;
  timeLabel: string;
  requestData?: {
    petName: string;
    breed: string;
    date: string;
    time: string;
    price: string;
    context: 'seeking' | 'applying';
    offerId: string;
  };
};

function MessageBubble({
  message,
  colors,
}: {
  message: any;
  colors: any;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const isRight = message.side === 'right';
  
  if (message.type === 'date') {
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

  if (message.type === 'request') {
    const rd = message.requestData;
    const context = rd.context === 'seeking' ? 'seeking' : 'applying';
    const offerId = String(rd.offerId ?? 1);
    return (
      <View
        style={[
          styles.bubbleWrap,
          isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft,
        ]}
      >
        <View
          style={[
            styles.requestCard,
            { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant },
          ]}
        >
          <AppText
            variant="caption"
            color={colors.onSurfaceVariant}
            style={[ChatTypography.requestCardLabel, styles.requestLabelSpacing]}
          >
            {context === 'applying'
              ? t("messages.applyingForPet", { petName: rd.petName })
              : t("messages.seekingForPet", { petName: rd.petName })}
          </AppText>
          <View style={styles.requestInfo}>
            <View style={styles.requestHeader}>
              <View style={[styles.petCircle, { backgroundColor: colors.surfaceContainerHighest }]}>
                <AppText variant="body" style={ChatTypography.requestPetName}>
                  {rd.petName.charAt(0)}
                </AppText>
              </View>
              <View style={styles.requestHeaderText}>
                <AppText variant="body" style={ChatTypography.requestPetName} numberOfLines={1}>
                  {rd.petName}
                </AppText>
                <AppText
                  variant="body"
                  color={colors.onSurfaceVariant}
                  style={ChatTypography.requestSecondary}
                  numberOfLines={1}
                >
                  {rd.breed}
                </AppText>
              </View>
            </View>
            <View style={styles.requestMeta}>
              <View style={styles.metaItem}>
                <Calendar size={16} color={colors.primary} />
                <AppText variant="body" color={colors.onSurface} style={ChatTypography.requestMeta}>
                  {rd.date}
                </AppText>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color={colors.primary} />
                <AppText variant="body" color={colors.onSurface} style={ChatTypography.requestMeta}>
                  {rd.time}
                </AppText>
              </View>
            </View>
            <AppText variant="caption" color={colors.onSurfaceVariant} style={styles.requestPrice}>
              {rd.price}
            </AppText>
          </View>
          <Button
            label={t("messages.viewOfferDetails")}
            size="sm"
            style={styles.requestCta}
            onPress={() => {
              if (context === 'seeking') {
                router.push({
                  pathname: "/(private)/(tabs)/my-care/contract/[id]" as any,
                  params: {
                    id: offerId,
                    mode: "seeking",
                    petName: rd.petName,
                    breed: rd.breed,
                    date: rd.date,
                    time: rd.time,
                    price: rd.price,
                  } as any,
                });
                return;
              }
              router.push(
                `/(private)/post-availability/${offerId}` as any,
              );
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.bubbleWrap, isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
      <View
        style={[
          styles.bubble,
          isRight
            ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
            : { backgroundColor: colors.surfaceContainer, borderBottomLeftRadius: 4 },
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
          { marginTop: 4, alignSelf: isRight ? 'flex-end' : 'flex-start' },
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
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
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

  const context = mode === 'seeking' ? 'seeking' : 'applying';

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
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
        .from('threads')
        .select('id,participant_ids,request_id')
        .eq('id', _threadId)
        .single();
      if (threadError) throw threadError;

      const peerId = ((threadRow?.participant_ids ?? []) as string[]).find((id) => id !== user.id) ?? '';
      const [{ data: peer }, { data: messages }, { data: req }] = await Promise.all([
        peerId
          ? supabase.from('users').select('id,full_name,avatar_url').eq('id', peerId).maybeSingle()
          : Promise.resolve({ data: null } as any),
        supabase
          .from('messages')
          .select('id,sender_id,content,type,metadata,created_at')
          .eq('thread_id', _threadId)
          .order('created_at', { ascending: true }),
        threadRow?.request_id
          ? supabase.from('care_requests').select('id,pet_id,start_date,end_date,points_offered').eq('id', threadRow.request_id).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);

      let pet: any = null;
      if (req?.pet_id) {
        const { data: petData } = await supabase
          .from('pets')
          .select('id,name,breed')
          .eq('id', req.pet_id)
          .maybeSingle();
        pet = petData;
      }

      const uiMessages: UiMessage[] = (messages ?? []).map((m: any) => {
        const side: BubbleSide = m.sender_id === user.id ? 'right' : 'left';
        const asRequest =
          (m.type === 'proposal' || m.type === 'agreement') &&
          (pet || petName || breed);
        if (asRequest) {
          return {
            id: m.id,
            side,
            type: 'request',
            timeLabel: formatTime(m.created_at),
            requestData: {
              petName: petName ?? pet?.name ?? 'Pet',
              breed: breed ?? pet?.breed ?? 'Unknown breed',
              date:
                date ??
                (req?.start_date && req?.end_date
                  ? `${new Date(req.start_date).toLocaleDateString()} - ${new Date(req.end_date).toLocaleDateString()}`
                  : ''),
              time: time ?? '',
              price: price ?? (req?.points_offered ? `${req.points_offered} pts` : ''),
              context,
              offerId: offerId ?? String(req?.id ?? '1'),
            },
          };
        }
        return {
          id: m.id,
          side,
          type: 'text',
          text: m.content ?? '',
          timeLabel: formatTime(m.created_at),
        };
      });

      setThread({
        userId: peer?.id ?? peerId,
        name: resolveDisplayName(peer) || 'User',
        subtitle: pet?.name ? `Caring for ${pet.name}` : '',
        avatarUri: peer?.avatar_url ?? null,
        messages: uiMessages,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load thread.');
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
      const { error } = await supabase.from('messages').insert({
        thread_id: _threadId,
        sender_id: user.id,
        content: body,
        type: 'text',
      });
      if (error) throw error;
      setInput('');
      await supabase
        .from('threads')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', _threadId);
      await loadThread();
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <DataState title={t('common.loading', 'Loading...')} mode="full" />
        ) : loadError ? (
          <DataState
            title={t("common.error", "Something went wrong")}
            message={loadError}
            actionLabel={t("common.retry", "Retry")}
            onAction={() => {
              void loadThread();
            }}
            mode="full"
          />
        ) : (
          <>
        {/* Header: back, avatar, name, subtitle, menu */}
        <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <ChevronLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          {thread.avatarUri ? (
            <AppImage
              source={{ uri: thread.avatarUri }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.headerAvatar, { backgroundColor: colors.surfaceContainer }]} />
          )}
          <View style={styles.headerText}>
            <AppText variant="body" numberOfLines={1} style={ChatTypography.threadHeaderName}>
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
            style={[styles.menuBtn, { backgroundColor: actionsOpen ? colors.surfaceContainer : 'transparent' }]}
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
                    pathname:
                      "/(private)/(tabs)/profile/users/[id]",
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
          title={t('messages.blockConfirmTitle')}
          description={t('messages.blockConfirmDescription')}
          primaryLabel={t('messages.block')}
          secondaryLabel={t('common.cancel')}
          destructive
          onPrimary={() => setShowBlockConfirm(false)}
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
              <MessageBubble
                key={msg.id}
                message={msg}
                colors={colors}
              />
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
        <View style={[styles.composerWrapper, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
          <TouchableOpacity
            style={[
              styles.attachBtn,
              { backgroundColor: colors.surfaceContainer },
            ]}
            hitSlop={8}
          >
            <Upload size={18} color={colors.onSurface} />
          </TouchableOpacity>
          <TextInput
            style={[
              styles.composerInput,
              { color: colors.onSurface },
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
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.secondaryContainer }]}
            hitSlop={8}
            onPress={() => {
              void sendMessage();
            }}
            disabled={sending || !input.trim()}
          >
            <Send size={24} color={colors.onSecondaryContainer} />
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    marginVertical: 16,
  },
  bubbleWrap: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  bubbleWrapLeft: {
    alignSelf: 'flex-start',
  },
  bubbleWrapRight: {
    alignSelf: 'flex-end',
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  requestLabelSpacing: {
    marginBottom: 10,
  },
  requestCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '100%',
    width: '100%',
  },
  requestInfo: {
    gap: 10,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  requestHeaderText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  petCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    rowGap: 8,
  },
  requestPrice: {
    marginTop: 4,
  },
  requestCta: {
    marginTop: 14,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  composerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    marginHorizontal: 12,
    marginBottom: 0,
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 4,
  },
  attachBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
    margin: 0,
    fontSize: 14,
    lineHeight: 17,
    letterSpacing: -0.25,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
