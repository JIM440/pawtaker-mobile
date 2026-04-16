🐾  PawTaker
Real-Time Messaging Implementation Guide
For the Junior Developer  •  v1.0  •  March 2026

Stack
React Native + Expo Router	Backend
Supabase Realtime	State
Zustand + React Query

0.  Purpose & Important Note
This document is the complete implementation guide for the PawTaker real-time messaging feature. It covers the thread list screen, the chat screen, Supabase Realtime subscriptions, message sending, read receipts, and creating new threads.

✅  NOTE  The Supabase database setup has already been completed by the lead developer. This includes: adding last_message_preview and last_sender_id columns to threads, enabling Realtime on messages and threads tables, setting REPLICA IDENTITY FULL on messages, adding all RLS policies, and creating the handle_new_message trigger. You do NOT need to run any SQL — jump straight to the code.

Item	Details
Thread list screen	app/(private)/(tabs)/messages/index.tsx — already exists, wire it up
Chat screen	app/(private)/(tabs)/messages/[threadId].tsx — already exists, wire it up
New hooks to create	src/features/messages/hooks/useThreads.ts
	src/features/messages/hooks/useMessages.ts
	src/features/messages/hooks/useSendMessage.ts
	src/features/messages/hooks/useOrCreateThread.ts
Realtime strategy	postgres_changes on messages + threads tables
Thread auto-update	DB trigger already fires on every new message — updates last_message_preview automatically


1.  Architecture Overview
Read this fully before writing any code. Understanding how the pieces connect prevents mistakes.

1.1  The Two Screens and What They Do
Screen	What it shows
Thread list  (messages/index.tsx)	List of all conversations the current user is part of. Shows the other person's avatar, name, and last message preview. Sorted by last_message_at descending (most recent first).
Chat screen  (messages/[threadId].tsx)	All messages in one conversation. Shows messages in chronological order (oldest at top, newest at bottom). Has a text input at the bottom to send new messages. Updates in real time as new messages arrive.

1.2  Full Data Flow
USER OPENS THREAD LIST
        ↓
useThreads() fetches threads WHERE participant_ids contains me
JOIN users to get other participant name + avatar
Realtime subscription on threads table → list updates live
        ↓
USER TAPS A THREAD
        ↓
Navigate to /messages/[threadId]
        ↓
useMessages(threadId) fetches all messages for this thread
Realtime subscription on messages WHERE thread_id = threadId
        ↓
NEW MESSAGE ARRIVES (from the other person)
        ↓
Realtime fires INSERT event → message appended to list → scroll to bottom
        ↓
USER TYPES AND SENDS A MESSAGE
        ↓
useSendMessage() inserts into messages table
DB trigger fires → threads.last_message_preview updated automatically
Realtime fires → BOTH users see the message instantly
        ↓
USER OPENS A NEW CONVERSATION (from a profile or care request)
        ↓
useOrCreateThread() checks if thread exists between the two users
If yes → navigate to existing thread
If no  → create new thread → navigate to it

1.3  The Data Model You Are Working With
Understand these two tables before touching any code:

threads table
Column	Type
id	string
participant_ids	string[]
request_id	string | null
last_message_at	string | null
last_message_preview	string | null
last_sender_id	string | null
created_at	string

messages table
Column	Type
id	string
thread_id	string
sender_id	string
content	string
type	string
metadata	Json | null
read_at	string | null
created_at	string


2.  The Four Hooks
Create all four hooks inside src/features/messages/hooks/. These are the core of the entire messaging feature. The screens just call these hooks and render the data.

Hook 1	useThreads.ts  —  src/features/messages/hooks/useThreads.ts

This hook fetches all threads for the current user and keeps them updated in real time. It also joins the other participant's name and avatar so the thread list can display them.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../lib/store/auth.store';

export type ThreadWithParticipant = {
  id:                   string;
  participant_ids:       string[];
  request_id:           string | null;
  last_message_at:      string | null;
  last_message_preview: string | null;
  last_sender_id:       string | null;
  created_at:           string;
  // Joined from users — the OTHER person in the conversation
  other_user: {
    id:         string;
    full_name:  string | null;
    avatar_url: string | null;
  } | null;
};

export function useThreads() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [threads, setThreads]   = useState<ThreadWithParticipant[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState<string | null>(null);

  // ── Helper: get the other participant's ID from a thread ──
  const getOtherUserId = (participantIds: string[]) =>
    participantIds.find((id) => id !== userId) ?? null;

  // ── Fetch threads + join other user details ──────────────
  const fetchThreads = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    // Fetch threads where current user is a participant
    const { data: rawThreads, error: threadError } = await supabase
      .from('threads')
      .select('*')
      .contains('participant_ids', [userId])   // array contains userId
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (threadError) {
      setError(threadError.message);
      setLoading(false);
      return;
    }

    if (!rawThreads?.length) {
      setThreads([]);
      setLoading(false);
      return;
    }

    // Collect all the other user IDs we need to fetch
    const otherUserIds = rawThreads
      .map((t) => getOtherUserId(t.participant_ids))
      .filter(Boolean) as string[];

    // Fetch those users in one query
    const { data: otherUsers } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', [...new Set(otherUserIds)]);

    // Build a map for fast lookup
    const userMap = new Map(
      (otherUsers ?? []).map((u) => [u.id, u])
    );

    // Combine threads with their other participant
    const enriched: ThreadWithParticipant[] = rawThreads.map((t) => ({
      ...t,
      other_user: userMap.get(getOtherUserId(t.participant_ids)!) ?? null,
    }));

    setThreads(enriched);
    setLoading(false);
  }, [userId]);

  // ── Initial fetch ─────────────────────────────────────────
  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // ── Supabase Realtime — listen for thread updates ─────────
  // Fires when last_message_preview, last_message_at change
  // (i.e. when a new message is sent in any of this user's threads)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`threads-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'threads' },
        () => {
          // Re-fetch on any change to keep data fresh
          // Simple and reliable — thread list is not high frequency
          fetchThreads();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchThreads]);

  return { threads, loading, error, refetch: fetchThreads };
}

Hook 2	useMessages.ts  —  src/features/messages/hooks/useMessages.ts

This hook fetches all messages for a single thread and listens for new messages in real time. It also marks messages as read when the screen is opened.

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../lib/store/auth.store';

export type Message = {
  id:         string;
  thread_id:  string;
  sender_id:  string;
  content:    string;
  type:       string;
  metadata:   any | null;
  read_at:    string | null;
  created_at: string;
};

export function useMessages(threadId: string | null) {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Fetch existing messages ───────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!threadId) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true });  // oldest first

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMessages(data ?? []);
    }
    setLoading(false);
  }, [threadId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // ── Mark unread messages as read ──────────────────────────
  // Runs when the chat screen is opened
  useEffect(() => {
    if (!threadId || !userId) return;

    // Mark all messages in this thread as read
    // where sender is NOT the current user and read_at is null
    supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_id', userId)
      .is('read_at', null)
      .then(() => {});  // fire and forget
  }, [threadId, userId]);

  // ── Realtime subscription ─────────────────────────────────
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `thread_id=eq.${threadId}`,  // only THIS thread
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Append new message to the list
          setMessages((prev) => {
            // Avoid duplicates (can happen on slow networks)
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          // If the new message is from the other person, mark it read
          if (newMessage.sender_id !== userId) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMessage.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId, userId]);

  return { messages, loading, error };
}

Hook 3	useSendMessage.ts  —  src/features/messages/hooks/useSendMessage.ts

This hook handles sending a message. It inserts into the messages table. The DB trigger automatically updates the thread's last_message_preview — you do not need to do that manually.

import { useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../lib/store/auth.store';

export function useSendMessage() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const sendMessage = async (
    threadId: string,
    content:  string,
    type:     string = 'text',
    metadata: any    = null
  ): Promise<boolean> => {
    if (!userId || !content.trim()) return false;

    setSending(true);
    setError(null);

    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        thread_id:  threadId,
        sender_id:  userId,
        content:    content.trim(),
        type,
        metadata,
      });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return false;
    }

    // Note: DO NOT manually update the thread here.
    // The DB trigger (handle_new_message) does this automatically.
    return true;
  };

  return { sendMessage, sending, error };
}

Hook 4	useOrCreateThread.ts  —  src/features/messages/hooks/useOrCreateThread.ts

This hook is called when a user wants to start a conversation with someone — for example from another user's profile page or from a care request. It checks if a thread already exists between the two users. If yes it returns the existing thread ID. If no it creates a new one.

import { useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useAuthStore } from '../../../lib/store/auth.store';
import { useRouter } from 'expo-router';

export function useOrCreateThread() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  /**
   * Opens or creates a thread with another user.
   * Navigates to the chat screen automatically.
   *
   * @param otherUserId  The UUID of the person to chat with
   * @param requestId    Optional care_request ID to link to the thread
   */
  const openThread = async (
    otherUserId: string,
    requestId?: string
  ) => {
    if (!userId || userId === otherUserId) return;

    setLoading(true);
    setError(null);

    // Check if a thread already exists between these two users
    // Both participant_ids arrays contain both user IDs
    const { data: existing } = await supabase
      .from('threads')
      .select('id')
      .contains('participant_ids', [userId, otherUserId])
      .maybeSingle();

    if (existing) {
      // Thread exists — navigate to it
      setLoading(false);
      router.push(`/(private)/(tabs)/messages/${existing.id}`);
      return;
    }

    // No thread yet — create one
    const { data: newThread, error: createError } = await supabase
      .from('threads')
      .insert({
        participant_ids: [userId, otherUserId],
        request_id:      requestId ?? null,
      })
      .select('id')
      .single();

    setLoading(false);

    if (createError || !newThread) {
      setError(createError?.message ?? 'Failed to create thread.');
      return;
    }

    // Navigate to the new thread
    router.push(`/(private)/(tabs)/messages/${newThread.id}`);
  };

  return { openThread, loading, error };
}


3.  Thread List Screen
File: app/(private)/(tabs)/messages/index.tsx
This screen already exists. Wire it up using the useThreads hook. Here is the complete implementation with all the logic:

3.1	Thread List Screen Implementation

import { useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../../src/lib/store/auth.store';
import { useThreads, ThreadWithParticipant }
  from '../../../../src/features/messages/hooks/useThreads';

export default function MessagesScreen() {
  const router  = useRouter();
  const { session } = useAuthStore();
  const userId  = session?.user?.id;

  const { threads, loading, error, refetch } = useThreads();

  // ── Format timestamp for display ──────────────────────────
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now  = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    }
  };

  // ── Render a single thread row ────────────────────────────
  const renderThread = ({ item }: { item: ThreadWithParticipant }) => {
    const other = item.other_user;
    const name  = other?.full_name ?? 'Unknown User';
    const avatar = other?.avatar_url;

    // Show 'You: ' prefix if current user sent the last message
    const isMine = item.last_sender_id === userId;
    const preview = item.last_message_preview
      ? (isMine ? 'You: ' : '') + item.last_message_preview
      : 'No messages yet';

    return (
      <TouchableOpacity
        onPress={() =>
          router.push(`/(private)/(tabs)/messages/${item.id}`)
        }
        style={{
          flexDirection:  'row',
          alignItems:     'center',
          padding:        16,
          borderBottomWidth: 1,
          borderBottomColor: '#F3F4F6',
          backgroundColor: '#FFFFFF',
        }}
      >
        {/* Avatar */}
        {avatar ? (
          <Image
            source={{ uri: avatar }}
            style={{ width: 52, height: 52, borderRadius: 26, marginRight: 12 }}
          />
        ) : (
          <View style={{
            width: 52, height: 52, borderRadius: 26,
            backgroundColor: '#EFF6FF', marginRight: 12,
            justifyContent: 'center', alignItems: 'center',
          }}>
            <Text style={{ fontSize: 20, color: '#1A56DB', fontWeight: '700' }}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        {/* Name + Preview */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '600', fontSize: 16, color: '#111827' }}>
            {name}
          </Text>
          <Text
            numberOfLines={1}
            style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}
          >
            {preview}
          </Text>
        </View>

        {/* Timestamp */}
        <Text style={{ fontSize: 12, color: '#9CA3AF', marginLeft: 8 }}>
          {formatTime(item.last_message_at)}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {threads.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 16 }}>
            No conversations yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={threads}
          keyExtractor={(item) => item.id}
          renderItem={renderThread}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} />
          }
        />
      )}
    </View>
  );
}


4.  Chat Screen
File: app/(private)/(tabs)/messages/[threadId].tsx
This is the core screen — it shows the conversation and the message input. It uses useMessages and useSendMessage together.

4.1	Chat Screen Implementation

import { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
  Image,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAuthStore } from '../../../../src/lib/store/auth.store';
import { useMessages, Message }
  from '../../../../src/features/messages/hooks/useMessages';
import { useSendMessage }
  from '../../../../src/features/messages/hooks/useSendMessage';

export default function ChatScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const { session }  = useAuthStore();
  const userId       = session?.user?.id;
  const navigation   = useNavigation();
  const flatListRef  = useRef<FlatList>(null);

  const [inputText, setInputText] = useState('');

  const { messages, loading } = useMessages(threadId ?? null);
  const { sendMessage, sending } = useSendMessage();

  // ── Scroll to bottom when new messages arrive ─────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // ── Handle send ───────────────────────────────────────────
  const handleSend = async () => {
    if (!threadId || !inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');  // clear input immediately for good UX
    await sendMessage(threadId, text);
  };

  // ── Render a single message bubble ────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === userId;

    return (
      <View
        style={{
          flexDirection:  'row',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          marginHorizontal: 12,
          marginVertical:   4,
        }}
      >
        <View
          style={{
            maxWidth:      '75%',
            paddingHorizontal: 14,
            paddingVertical:   10,
            borderRadius:  18,
            // My messages: blue. Their messages: light grey.
            backgroundColor: isMe ? '#1A56DB' : '#F3F4F6',
            // Round the corner that points to the sender
            borderBottomRightRadius: isMe ? 4  : 18,
            borderBottomLeftRadius:  isMe ? 18 : 4,
          }}
        >
          <Text style={{ color: isMe ? '#FFFFFF' : '#111827', fontSize: 15 }}>
            {item.content}
          </Text>
          {/* Timestamp + read receipt */}
          <Text style={{
            fontSize:  10,
            marginTop:  4,
            color: isMe ? '#BFDBFE' : '#9CA3AF',
            textAlign: 'right',
          }}>
            {new Date(item.created_at).toLocaleTimeString(
              [], { hour: '2-digit', minute: '2-digit' }
            )}
            {isMe && item.read_at ? '  ✓✓' : isMe ? '  ✓' : ''}
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1A56DB" />
      </View>
    );
  }

  return (
    // KeyboardAvoidingView pushes the input above the keyboard
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ paddingVertical: 12 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      {/* Message input bar */}
      <View style={{
        flexDirection:    'row',
        alignItems:       'flex-end',
        paddingHorizontal: 12,
        paddingVertical:   8,
        borderTopWidth:    1,
        borderTopColor:   '#E5E7EB',
        backgroundColor:  '#FFFFFF',
      }}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          multiline
          style={{
            flex:             1,
            minHeight:        40,
            maxHeight:        120,
            backgroundColor:  '#F9FAFB',
            borderRadius:     20,
            paddingHorizontal: 16,
            paddingVertical:   10,
            fontSize:         15,
            color:            '#111827',
            marginRight:       8,
          }}
          returnKeyType="default"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !inputText.trim()}
          style={{
            width:           44,
            height:          44,
            borderRadius:    22,
            backgroundColor: inputText.trim() ? '#1A56DB' : '#E5E7EB',
            justifyContent:  'center',
            alignItems:      'center',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

✅  NOTE  Replace the inline styles with your existing design system (NativeWind, StyleSheet, or your shared components) once the logic is working correctly. Get it working first, then style.


5.  Starting a New Conversation
Users start new conversations from other user's profile pages or from care requests. Use the useOrCreateThread hook for this. Here is how to wire it up on a user profile screen:

5.1	Add Message Button to User Profile Screen

File: app/(private)/(tabs)/profile/users/[id].tsx
import { useOrCreateThread }
  from '../../../../src/features/messages/hooks/useOrCreateThread';

export default function UserProfileScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
  const { openThread, loading } = useOrCreateThread();

  return (
    <View>
      {/* ... existing profile UI ... */}

      {/* Message button — add this wherever fits in the profile layout */}
      <TouchableOpacity
        onPress={() => openThread(otherUserId)}
        disabled={loading}
        style={{
          backgroundColor: '#1A56DB',
          borderRadius:    12,
          paddingVertical:  12,
          alignItems:      'center',
          marginHorizontal: 16,
          marginTop:        16,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 16 }}>
            Message
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}


6.  Implementation Checklist
The database is already set up. Complete every code item in order.

Files to Create
1.	Create src/features/messages/hooks/useThreads.ts (Section 2, Hook 1)
2.	Create src/features/messages/hooks/useMessages.ts (Section 2, Hook 2)
3.	Create src/features/messages/hooks/useSendMessage.ts (Section 2, Hook 3)
4.	Create src/features/messages/hooks/useOrCreateThread.ts (Section 2, Hook 4)

Files to Modify
5.	Wire app/(private)/(tabs)/messages/index.tsx — thread list (Section 3)
6.	Wire app/(private)/(tabs)/messages/[threadId].tsx — chat screen (Section 4)
7.	Add Message button to app/(private)/(tabs)/profile/users/[id].tsx (Section 5)

Testing — Do These in Order
8.	Open the messages tab — confirm empty state shows 'No conversations yet'
9.	Go to another user's profile → tap Message → confirm navigation to chat screen
10.	Send a message — confirm it appears immediately in the chat
11.	Open a second device/account — confirm the message arrives in real time without refreshing
12.	Reply from the second device — confirm message arrives on first device in real time
13.	Go back to thread list — confirm last_message_preview shows the latest message
14.	Confirm thread list sorts by most recent message at the top
15.	Confirm read receipt tick (✓) appears on sent messages
16.	Confirm double tick (✓✓) appears when the recipient opens the message


7.  Common Errors & How to Fix Them

Error	Fix
Thread list is empty even though threads exist in DB	The RLS policy on threads uses .contains() on participant_ids. If auth.uid() is not correctly set up as UUID, the contains check fails. Confirm the user is authenticated before calling useThreads.
Realtime not firing for new messages	Check that ALTER PUBLICATION supabase_realtime ADD TABLE public.messages was run (already done by lead dev). If still not firing, confirm the Supabase client is using the correct anon key.
Duplicate messages appearing in chat	The Realtime event fires at the same time as the insert response. The duplicate guard in useMessages (prev.some(m => m.id === newMessage.id)) handles this — make sure you copied that check.
Keyboard covers the message input on iOS	KeyboardAvoidingView behavior must be 'padding' on iOS and 'height' on Android. Confirm the Platform.OS check is in place.
last_message_preview not updating in thread list	The DB trigger handle_new_message was not run or failed. Confirm it exists in Supabase Dashboard → Database → Functions.
openThread creates a duplicate thread	The .contains() check on participant_ids must contain BOTH user IDs. If either ID is undefined the check passes incorrectly. Add a guard: if (!userId || !otherUserId) return.
Messages load but chat screen is blank	The FlatList data prop is correct but the renderItem might be returning null. Add a console.log inside renderMessage to confirm messages array is populated.
Cannot send messages — RLS error	The messages_insert_own policy requires sender_id to equal auth.uid(). Confirm you are passing session.user.id as sender_id, not any other value.


End of Document  •  PawTaker Messaging Implementation Guide  •  v1.0  •  March 2026
