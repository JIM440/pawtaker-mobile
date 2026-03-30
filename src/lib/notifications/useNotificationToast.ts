import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import type { ToastNotification } from '@/src/shared/components/ui/NotificationToast';

export function useNotificationToast() {
  const [toast, setToast] = useState<ToastNotification | null>(null);

  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        setToast({
          title: title ?? 'New notification',
          body: body ?? '',
          data: data ?? {},
        });
      }
    );

    return () => subscription.remove();
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  return { toast, dismissToast };
}
