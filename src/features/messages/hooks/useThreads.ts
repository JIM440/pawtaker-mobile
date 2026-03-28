import { supabase } from "@/src/lib/supabase/client";
import type { Database } from "@/src/lib/supabase/types";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useCallback, useEffect, useState } from "react";

type ThreadRow = Database["public"]["Tables"]["threads"]["Row"];

export type ThreadWithParticipant = {
  id: string;
  participant_ids: string[];
  request_id: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  created_at: string;
  other_user: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  unreadCount: number;
};

export function useThreads() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [threads, setThreads] = useState<ThreadWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getOtherUserId = (participantIds: string[]) =>
    participantIds.find((id) => id !== userId) ?? null;

  const fetchThreads = useCallback(async (opts?: { silent?: boolean }) => {
    if (!userId) {
      setThreads([]);
      setLoading(false);
      return;
    }
    if (!opts?.silent) {
      setLoading(true);
    }
    setError(null);

    const { data: rawThreads, error: threadError } = await supabase
      .from("threads")
      .select("*")
      .contains("participant_ids", [userId])
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (threadError) {
      setError(threadError.message);
      setLoading(false);
      return;
    }

    const rows = (rawThreads ?? []) as ThreadRow[];

    if (!rows.length) {
      setThreads([]);
      setLoading(false);
      return;
    }

    const threadIds = rows.map((t) => t.id);
    const otherUserIds = rows
      .map((t) => getOtherUserId(t.participant_ids))
      .filter(Boolean) as string[];

    const [{ data: otherUsers }, { data: unreadRows }] = await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, avatar_url")
        .in("id", [...new Set(otherUserIds)]),
      supabase
        .from("messages")
        .select("thread_id")
        .in("thread_id", threadIds)
        .neq("sender_id", userId)
        .is("read_at", null),
    ]);

    const userMap = new Map((otherUsers ?? []).map((u) => [u.id, u]));

    const unreadByThread: Record<string, number> = {};
    for (const row of unreadRows ?? []) {
      const tid = row.thread_id;
      unreadByThread[tid] = (unreadByThread[tid] ?? 0) + 1;
    }

    const enriched: ThreadWithParticipant[] = rows.map((t) => {
      const oid = getOtherUserId(t.participant_ids);
      return {
        ...t,
        last_message_preview: t.last_message_preview ?? null,
        last_sender_id: t.last_sender_id ?? null,
        other_user: oid ? (userMap.get(oid) ?? null) : null,
        unreadCount: unreadByThread[t.id] ?? 0,
      };
    });

    setThreads(enriched);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`threads-list-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "threads" },
        () => {
          void fetchThreads({ silent: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchThreads]);

  return { threads, loading, error, refetch: fetchThreads };
}
