import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Send, EllipsisVertical, Plus, Calendar, Clock } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';
import { FeedbackModal } from '@/src/shared/components/ui/FeedbackModal';
import { Input } from '@/src/shared/components/ui/Input';
import { Button } from '@/src/shared/components/ui/Button';

type BubbleSide = 'left' | 'right';
type MessageType = 'text' | 'image' | 'request';

const MOCK_THREAD = {
  userId: 't1',
  name: 'Bob Majors',
  subtitle: 'Caring for Emma',
  avatarUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
  messages: [
    { id: 'date-1', type: 'date' as any, text: 'Monday, March 14' },
    { id: '1', side: 'right' as BubbleSide, type: 'text' as MessageType, text: 'Hi Bob! Are you still available for the daytime care next week?' },
    { id: '2', side: 'left' as BubbleSide, type: 'text' as MessageType, text: 'Yes, i\'ll be available. I just saw your request!' },
    { 
      id: '3', 
      side: 'left' as BubbleSide, 
      type: 'request' as MessageType, 
      requestData: {
        petName: 'Emma',
        breed: 'Golden Retriever',
        date: 'Mar 14-18',
        time: '8am-4pm',
        price: '$25/hr'
      }
    },
    { id: 'date-2', type: 'date' as any, text: 'Today' },
    { id: '4', side: 'right' as BubbleSide, type: 'text' as MessageType, text: 'Great! I\'ll confirm the booking now.' },
  ],
};

function MessageBubble({
  message,
  colors,
}: {
  message: any;
  colors: any;
}) {
  const { t } = useTranslation();
  const isRight = message.side === 'right';
  
  if (message.type === 'date') {
    return (
      <View style={styles.dateLabel}>
        <AppText variant="caption" color={colors.onSurfaceVariant}>{message.text}</AppText>
      </View>
    );
  }

  if (message.type === 'request') {
    return (
      <View style={[styles.bubbleWrap, styles.bubbleWrapLeft]}>
        <View style={[styles.requestCard, { backgroundColor: colors.surfaceContainer, borderColor: colors.outlineVariant }]}>
          <AppText variant="label" style={{ marginBottom: 8 }}>{t("messages.serviceRequest")}</AppText>
          <View style={styles.requestInfo}>
            <View style={styles.requestHeader}>
              <View style={[styles.petCircle, { backgroundColor: colors.surfaceDim }]}>
                 <AppText variant="caption">E</AppText>
              </View>
              <View>
                <AppText variant="body" style={{ fontWeight: '600' }}>{message.requestData.petName}</AppText>
                <AppText variant="caption" color={colors.onSurfaceVariant}>{message.requestData.breed}</AppText>
              </View>
            </View>
            <View style={styles.requestMeta}>
               <View style={styles.metaItem}>
                  <Calendar size={14} color={colors.primary} />
                  <AppText variant="caption">{message.requestData.date}</AppText>
               </View>
               <View style={styles.metaItem}>
                  <Clock size={14} color={colors.primary} />
                  <AppText variant="caption">{message.requestData.time}</AppText>
               </View>
            </View>
          </View>
          <Button label={t("messages.viewRequest")} size="sm" style={{ marginTop: 12 }} />
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
          style={styles.bubbleText}
        >
          {message.text}
        </AppText>
      </View>
      <AppText variant="caption" color={colors.onSurfaceVariant} style={{ fontSize: 10, marginTop: 2, alignSelf: isRight ? 'flex-end' : 'flex-start' }}>
        10:45 AM
      </AppText>
    </View>
  );
}

export default function ThreadScreen() {
  const { threadId: _threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [input, setInput] = useState('');
  const [actionsOpen, setActionsOpen] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const thread = MOCK_THREAD;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
            <AppText variant="label" numberOfLines={1}>{thread.name}</AppText>
            <AppText variant="caption" color={colors.onSurfaceVariant} numberOfLines={1}>
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
          <Pressable style={styles.actionsOverlay} onPress={() => setActionsOpen(false)}>
            <View
              style={[styles.actionsCard, { backgroundColor: colors.surfaceBright, borderColor: colors.outlineVariant }]}
              onStartShouldSetResponder={() => true}
            >
              <Pressable
                style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setActionsOpen(false);
                  router.push({ pathname: '/(private)/(tabs)/profile/users/[id]', params: { id: thread.userId } });
                }}
              >
                <AppText variant="body" color={colors.onSurface}>{t('messages.viewProfile')}</AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionItem, pressed && { opacity: 0.7 }]}
                onPress={() => setActionsOpen(false)}
              >
                <AppText variant="body" color={colors.onSurface}>{t('messages.muteNotifications')}</AppText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.actionItem, styles.actionItemDanger, pressed && { opacity: 0.7 }]}
                onPress={() => {
                  setActionsOpen(false);
                  setShowBlockConfirm(true);
                }}
              >
                <AppText variant="body" color={colors.error}>{t('messages.block')}</AppText>
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
          {thread.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surfaceBright }]}>
          <TouchableOpacity
            style={[styles.attachBtn, { backgroundColor: colors.surfaceContainerHighest }]}
            hitSlop={8}
          >
            <Plus size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Input
            containerStyle={{ flex: 1, marginBottom: 0 }}
            inputStyle={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainer,
                borderColor: colors.surfaceContainer,
                borderRadius: 24,
              },
            ]}
            placeholder={t('messages.typeMessage')}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            hitSlop={8}
          >
            <Send size={20} color={colors.onPrimary} />
          </TouchableOpacity>
        </View>
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
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  requestCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    width: 280,
  },
  requestInfo: {
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'flex-end',
    paddingTop: 56,
    paddingRight: 12,
  },
  actionsCard: {
    minWidth: 180,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  actionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionItemDanger: {},
});
