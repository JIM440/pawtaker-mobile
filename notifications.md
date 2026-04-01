🐾  PawTaker
In-App Notifications — Mobile Implementation Guide
Badge Count + Foreground Toast + Realtime  •  v1.0  •  March 2026

Supabase Side
Already done by lead dev	Missing Pieces
Badge + Toast + Realtime + Delete fix	Files to touch
4 files to create, 2 to modify

0.  Purpose & What Is Already Done
This document covers the remaining mobile app code needed to complete the PawTaker in-app notification system. The Supabase side has already been fully set up by the lead developer.

✅  NOTE  The Supabase edge function (send-notification-push) is deployed, the EXPO_ACCESS_TOKEN secret is set, and the database webhook on notifications INSERT is configured. Do NOT touch any of that. Your job is purely the mobile app code described in this document.

What is already done	What you are building
expo-notifications installed and configured	Badge count on the bell icon (top right of home screen)
Push token registration on login	Realtime listener — reacts when new notification row is inserted
Deep linking from notification tap	Foreground toast — shows when push arrives while app is open
Notifications screen UI fully built	addNotificationReceivedListener handler
Supabase edge function deployed	Fix: persist deletes to Supabase (currently only removes from local state)
Database webhook on notifications INSERT	


1.  Architecture Overview
Understand this flow before writing any code:

SOMETHING HAPPENS IN THE APP (new care request, KYC approved, message etc.)
        ↓
A row is inserted into public.notifications for the user
        ↓
        ┌─────────────────────────────────────────────────────────┐
        │  Supabase Webhook fires → edge function called          │
        │  Edge function reads push_tokens for the user           │
        │  Edge function calls Expo Push API                      │
        │  Expo delivers OS push notification to device           │
        └─────────────────────────────────────────────────────────┘
        ↓
        ┌─────────────────────────────────────────────────────────┐
        │  APP IS OPEN (foreground)                               │
        │  Supabase Realtime fires → badge count increments       │
        │  addNotificationReceivedListener fires → toast appears  │
        └─────────────────────────────────────────────────────────┘
        ↓
        ┌─────────────────────────────────────────────────────────┐
        │  APP IS CLOSED / BACKGROUND                             │
        │  OS push notification appears on device screen          │
        │  User taps it → app opens → deep link navigates         │
        └─────────────────────────────────────────────────────────┘

Piece	Your responsibility in this document
Badge count on bell icon	useUnreadNotificationCount hook + wire to bell icon component
Realtime listener	Supabase postgres_changes subscription inside the hook
Foreground toast	NotificationToast component + useNotificationToast hook
Foreground handler	addNotificationReceivedListener in app/(private)/_layout.tsx
Fix persist delete	One line in notifications screen handleDelete function


2.  Hook — useUnreadNotificationCount
File to create: src/lib/notifications/useUnreadNotificationCount.ts
This hook does two things: it fetches the current unread notification count from Supabase, and it subscribes to Realtime so the count updates live whenever a new notification row is inserted for the current user. This is what powers the badge number on the bell icon.

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/auth.store';

export function useUnreadNotificationCount() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [count, setCount] = useState(0);

  // ── Fetch current unread count from Supabase ─────────────
  const fetchCount = useCallback(async () => {
    if (!userId) return;

    const { count: unreadCount, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })  // head:true = count only, no rows
      .eq('user_id', userId)
      .eq('read', false);

    if (!error && unreadCount !== null) {
      setCount(unreadCount);
    }
  }, [userId]);

  // ── Initial fetch on mount ────────────────────────────────
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // ── Realtime subscription ─────────────────────────────────
  // Listens for new rows inserted into notifications for this user
  // When a new notification arrives → increment count immediately
  // When a notification is marked read → re-fetch to get accurate count
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-count-${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // New notification inserted → increment badge
          setCount((prev) => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'UPDATE',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Notification was marked as read → re-fetch accurate count
          fetchCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event:  'DELETE',
          schema: 'public',
          table:  'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Notification deleted → re-fetch accurate count
          fetchCount();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, fetchCount]);

  // ── markAllRead: call this when user opens notifications screen ──
  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    setCount(0);
  }, [userId]);

  return { count, markAllRead, refetch: fetchCount };
}


3.  Wire Badge Count to the Bell Icon
The bell icon with the badge is located somewhere in the home screen area — either in the header of app/(private)/(tabs)/(home)/index.tsx, in app/(private)/(tabs)/(home)/_layout.tsx, or in a shared header component. Search the codebase for the bell icon by looking for the navigation to the notifications screen.

⚠️  NOTE  To find the bell icon quickly: search the codebase for 'notifications' or 'BellIcon' or the route href '/(private)/(tabs)/(home)/notifications'. The file that contains the navigation to the notifications screen is where the bell icon lives.

3.1	Find and Update the Bell Icon Component

Once you find the file containing the bell icon, add the useUnreadNotificationCount hook and wire the count to the badge. Here is the pattern to follow:

// Add this import at the top of whichever file has the bell icon
import { useUnreadNotificationCount }
  from '../../../../src/lib/notifications/useUnreadNotificationCount';
// Note: adjust the import path based on where the bell icon file is located

// Inside the component that renders the bell icon:
const { count, markAllRead } = useUnreadNotificationCount();

// The bell icon likely looks something like this already:
// <TouchableOpacity onPress={() => router.push('...notifications')}>
//   <BellIcon />
// </TouchableOpacity>

// Update it to show the badge like this:
<TouchableOpacity
  onPress={() => {
    markAllRead();  // mark all as read when bell is tapped
    router.push('/(private)/(tabs)/(home)/notifications');
  }}
  style={{ position: 'relative' }}
>
  {/* Your existing bell icon component or icon here */}
  <BellIcon />

  {/* Badge — only show if count > 0 */}
  {count > 0 && (
    <View style={{
      position:        'absolute',
      top:             -4,
      right:           -4,
      backgroundColor: '#DC2626',  // red badge
      borderRadius:    10,
      minWidth:        18,
      height:          18,
      justifyContent:  'center',
      alignItems:      'center',
      paddingHorizontal: 4,
    }}>
      <Text style={{
        color:      '#FFFFFF',
        fontSize:   11,
        fontWeight: '700',
      }}>
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  )}
</TouchableOpacity>

✅  NOTE  If the bell icon already has a badge built into it (from the existing UI design), just pass the count value to whatever prop controls the badge number instead of building a new View badge.


4.  Foreground Toast Notification
When a push notification arrives while the app is open and in the foreground, the OS does not always show the system banner. We show our own in-app toast instead. It appears at the top of the screen, shows the notification title and body, auto-dismisses after 4 seconds, and navigates when tapped.

4.1	Create the Toast Component  —  src/components/NotificationToast.tsx

'use client';
import { useEffect, useRef } from 'react';
import {
  Animated, TouchableOpacity, Text, View,
  StyleSheet, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ToastNotification = {
  title:  string;
  body:   string;
  data?:  any;
};

type Props = {
  notification: ToastNotification | null;
  onDismiss:    () => void;
  onPress:      (data: any) => void;
};

export function NotificationToast({ notification, onDismiss, onPress }: Props) {
  const insets    = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!notification) return;

    // Slide in from top
    Animated.parallel([
      Animated.spring(translateY, {
        toValue:         0,
        useNativeDriver: true,
        damping:         15,
      }),
      Animated.timing(opacity, {
        toValue:         1,
        duration:        200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => dismiss(), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue:         -120,
        duration:        250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue:         0,
        duration:        250,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top:       insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => {
          dismiss();
          onPress(notification.data);
        }}
        activeOpacity={0.9}
        style={styles.inner}
      >
        {/* Bell icon or app icon on the left */}
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
        </View>

        {/* Title and body */}
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {notification.body}
          </Text>
        </View>

        {/* Dismiss button */}
        <TouchableOpacity onPress={dismiss} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position:     'absolute',
    left:          16,
    right:         16,
    zIndex:        9999,
    shadowColor:  '#000',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius:  12,
    elevation:     8,
  },
  inner: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: '#FFFFFF',
    borderRadius:    16,
    padding:         14,
    borderWidth:     1,
    borderColor:     '#E5E7EB',
  },
  iconContainer: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#EFF6FF',
    justifyContent:  'center',
    alignItems:      'center',
    marginRight:     12,
  },
  textContainer: {
    flex:        1,
    marginRight: 8,
  },
  title: {
    fontWeight:  '700',
    fontSize:    15,
    color:       '#111827',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color:    '#6B7280',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 14,
    color:    '#9CA3AF',
  },
});

4.2	Create the Toast State Hook  —  src/lib/notifications/useNotificationToast.ts

This hook manages the toast state and listens for incoming push notifications while the app is in the foreground using addNotificationReceivedListener.

import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { ToastNotification } from '../../components/NotificationToast';

export function useNotificationToast() {
  const [toast, setToast] = useState<ToastNotification | null>(null);

  useEffect(() => {
    // addNotificationReceivedListener fires when a push notification
    // arrives while the app is in the FOREGROUND
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;

        setToast({
          title:  title  ?? 'New notification',
          body:   body   ?? '',
          data:   data   ?? {},
        });
      }
    );

    return () => subscription.remove();
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, dismissToast };
}


5.  Wire Everything into the Private Layout
File: app/(private)/_layout.tsx
This is the authenticated shell layout. It already handles push token registration. Add the toast hook and toast component here so notifications work across ALL screens in the app, not just the home screen.

// Add these imports to app/(private)/_layout.tsx
import { useNotificationToast }
  from '../../src/lib/notifications/useNotificationToast';
import { NotificationToast }
  from '../../src/components/NotificationToast';
import { navigateForNotificationPayload }
  from '../../src/lib/notifications/push';
// Note: navigateForNotificationPayload already exists in push.ts
// It handles deep linking — reuse it here for toast taps

// Inside the layout component, add this:
const { toast, dismissToast } = useNotificationToast();

// In the return JSX, wrap everything with a View and add the toast:
return (
  <>
    {/* Your existing Stack / layout content */}
    <Stack>
      {/* ... existing screens ... */}
    </Stack>

    {/* Toast sits on top of everything — rendered last so it appears above */}
    <NotificationToast
      notification={toast}
      onDismiss={dismissToast}
      onPress={(data) => {
        dismissToast();
        // Reuse the existing deep link navigation function
        if (data) navigateForNotificationPayload(data);
      }}
    />
  </>
);

⚠️  NOTE  The toast must be rendered OUTSIDE the Stack navigator but INSIDE the SafeAreaView so it appears above all screens. The position: absolute styling in the component handles the visual placement.


6.  Fix — Persist Deletes to Supabase
File: app/(private)/(tabs)/(home)/notifications.tsx
Currently when the user deletes a notification via the overflow menu, it only removes the item from local React state. The row stays in the Supabase database. This is a small but important fix — one line of code.

// Find the handleDelete function in notifications.tsx
// It currently looks something like this:

const handleDelete = (id: string) => {
  // Only removes from local state — does NOT persist to DB
  setNotifications((prev) => prev.filter((n) => n.id !== id));
};

// Update it to also delete from Supabase:

const handleDelete = async (id: string) => {
  // 1. Remove from local state immediately for instant UI feedback
  setNotifications((prev) => prev.filter((n) => n.id !== id));

  // 2. Also delete from Supabase so it does not come back on next load
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', id);

  if (error) {
    // If delete fails, log it but do not restore the item
    // The user has already seen it disappear — silent failure is fine here
    console.error('[Notifications] Delete failed:', error.message);
  }
};


7.  Enable Realtime on Notifications Table
The useUnreadNotificationCount hook uses Supabase Realtime to listen for changes on the notifications table. For this to work, the table must be added to the Supabase Realtime publication.

⚠️  NOTE  Ask the lead developer to run this in the Supabase SQL Editor if it has not been done already. This is a one-time SQL command.

-- Run this in Supabase SQL Editor (one time only)
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Also ensure RLS allows users to read their own notifications
-- (may already be set up -- check before running)
CREATE POLICY IF NOT EXISTS "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


8.  Implementation Checklist
Complete every item in order.

Ask Lead Developer (one SQL command)
1.	Confirm ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications has been run (Section 7)

Files to Create
2.	Create src/lib/notifications/useUnreadNotificationCount.ts (Section 2)
3.	Create src/components/NotificationToast.tsx (Section 4.1)
4.	Create src/lib/notifications/useNotificationToast.ts (Section 4.2)

Files to Modify
5.	Find the bell icon file (search codebase for notifications route) — wire useUnreadNotificationCount badge (Section 3)
6.	Update app/(private)/_layout.tsx — add toast hook and NotificationToast component (Section 5)
7.	Update handleDelete in app/(private)/(tabs)/(home)/notifications.tsx — add Supabase delete call (Section 6)

Testing — Do In Order
8.	Open the app on a physical device — navigate to home screen
9.	Run this SQL in Supabase SQL Editor with your own user UUID to test:

INSERT INTO public.notifications (user_id, type, title, body, data, read)
VALUES (
  'your-user-uuid-here',
  'test',
  'Test Notification',
  'This is a test from the lead developer',
  '{}',
  false
);

10.	Confirm badge count appears on bell icon immediately without refreshing
11.	Confirm toast slides in from the top showing the title and body
12.	Tap the toast — confirm it dismisses and navigates correctly
13.	Tap the bell icon — confirm badge disappears (markAllRead called)
14.	Background the app — run the SQL insert again — confirm OS push notification appears
15.	Delete a notification from the list — confirm it is gone from Supabase Table Editor too


9.  Common Errors & How to Fix Them

Error	Fix
Badge count always shows 0 even after insert	Realtime is not enabled on the notifications table. Ask lead dev to run the SQL in Section 7.
Toast never appears when app is in foreground	useNotificationToast is not mounted. Confirm it is called inside app/(private)/_layout.tsx and that the NotificationToast component is rendered in the return JSX.
Toast appears but tapping does not navigate	navigateForNotificationPayload is not being called in the onPress handler. Check the import path and that the data object from the notification contains the correct type field.
Badge count does not update in real time	Check the Supabase Realtime channel name — it must be unique per user: unread-count-${userId}. If userId is undefined the subscription never connects.
Delete fix causes the item to come back on refresh	The Supabase delete is failing silently. Check the console for the error log. Most likely cause: RLS does not allow users to delete their own notifications. Add a DELETE policy if missing.
addNotificationReceivedListener not firing	The notification handler must be configured with shouldShowBanner: false or the system handles it and the listener fires. Confirm configureNotificationHandler is called before the listener is set up.


End of Document  •  PawTaker In-App Notifications  •  v1.0  •  March 2026
