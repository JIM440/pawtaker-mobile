import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Send, EllipsisVertical } from 'lucide-react-native';
import { useThemeStore } from '@/src/lib/store/theme.store';
import { Colors } from '@/src/constants/colors';
import { PageContainer } from '@/src/shared/components/layout';
import { AppText } from '@/src/shared/components/ui/AppText';
import { AppImage } from '@/src/shared/components/ui/AppImage';

type BubbleSide = 'left' | 'right';

const MOCK_THREAD = {
  name: 'Bob Majors',
  subtitle: 'Caring for Emm...',
  avatarUri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
  messages: [
    { id: '1', side: 'right' as BubbleSide, text: 'How are you?' },
    { id: '2', side: 'left' as BubbleSide, text: 'hello 🔥' },
    { id: '3', side: 'left' as BubbleSide, text: 'I am well, and you?' },
    { id: '4', side: 'right' as BubbleSide, text: 'well' },
  ],
};

function MessageBubble({
  text,
  side,
  colors,
}: {
  text: string;
  side: BubbleSide;
  colors: typeof Colors.light;
}) {
  const isRight = side === 'right';
  return (
    <View style={[styles.bubbleWrap, isRight ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
      <View
        style={[
          styles.bubble,
          isRight
            ? { backgroundColor: colors.primary }
            : { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <AppText
          variant="body"
          color={isRight ? colors.onPrimary : colors.onSurface}
          style={styles.bubbleText}
        >
          {text}
        </AppText>
      </View>
    </View>
  );
}

export default function ThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const { resolvedTheme } = useThemeStore();
  const colors = Colors[resolvedTheme];
  const [input, setInput] = useState('');
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
          <TouchableOpacity style={styles.menuBtn} hitSlop={12}>
            <EllipsisVertical size={24} color={colors.onSurface} />
          </TouchableOpacity>
        </View>

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
              text={msg.text}
              side={msg.side}
              colors={colors}
            />
          ))}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputRow, { borderTopColor: colors.outlineVariant }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surfaceContainer,
                color: colors.onSurface,
              },
            ]}
            placeholder="Type a message"
            placeholderTextColor={colors.onSurfaceVariant}
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
  bubbleWrap: {
    marginBottom: 8,
    maxWidth: '80%',
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
    borderRadius: 16,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
