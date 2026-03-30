import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../supabase/client';
import { useAuthStore } from '../store/auth.store';

export function useUnreadNotificationCount() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    if (!userId) return;

    const { count: unreadCount, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (!error && unreadCount !== null) {
      setCount(unreadCount);
    }
  }, [userId]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-count-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { setCount((prev) => prev + 1); }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { fetchCount(); }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        () => { fetchCount(); }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [userId, fetchCount]);

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
