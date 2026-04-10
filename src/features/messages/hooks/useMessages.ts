import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import type { Json } from "@/src/lib/supabase/types";
import { useCallback, useEffect, useState } from "react";

export type ChatMessageRow = {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  type: string;
  metadata: Json | null;
  read_at: string | null;
  created_at: string;
};

export function useMessages(threadId: string | null) {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [messages, setMessages] = useState<ChatMessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setMessages((data ?? []) as ChatMessageRow[]);
    }
    setLoading(false);
  }, [threadId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!threadId || !userId) return;

    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("thread_id", threadId)
      .neq("sender_id", userId)
      .is("read_at", null)
      .then(() => {});
  }, [threadId, userId]);

  const deleteMessage = useCallback(
    async (messageId: string) => {
      if (!userId || !threadId) {
        throw new Error("Not signed in or no thread.");
      }
      const { error: delError } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId)
        .eq("sender_id", userId);
      if (delError) throw delError;
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    },
    [userId, threadId],
  );

  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessageRow;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });

          if (userId && newMessage.sender_id !== userId) {
            void supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${threadId}`,
        },
        (payload) => {
          const oldRow = payload.old as { id?: string } | null;
          const removedId = oldRow?.id;
          if (!removedId) return;
          setMessages((prev) => prev.filter((m) => m.id !== removedId));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId, userId]);

  return { messages, loading, error, refetch: fetchMessages, deleteMessage };
}
