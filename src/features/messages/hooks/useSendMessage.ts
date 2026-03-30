import { hasUserBlockRelation } from "@/src/lib/blocks/user-blocks";
import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import type { Json } from "@/src/lib/supabase/types";
import { useState } from "react";

export function useSendMessage() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (
    threadId: string,
    content: string,
    type: string = "text",
    metadata: Json | null = null,
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!userId || !content.trim())
      return { ok: false, message: "Not signed in or empty message." };

    setSending(true);
    setError(null);

    const { data: threadRow, error: threadError } = await supabase
      .from("threads")
      .select("participant_ids")
      .eq("id", threadId)
      .maybeSingle();
    if (threadError) {
      setSending(false);
      setError(threadError.message);
      return { ok: false, message: threadError.message };
    }
    const participants = ((threadRow as any)?.participant_ids ?? []) as string[];
    const otherUserId = participants.find((p) => p && p !== userId);
    if (otherUserId) {
      const blocked = await hasUserBlockRelation(userId, otherUserId);
      if (blocked) {
        const msg =
          "You cannot message this user because one of you has blocked the other.";
        setSending(false);
        setError(msg);
        return { ok: false, message: msg };
      }
    }

    const { error: insertError } = await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: userId,
      content: content.trim(),
      type,
      metadata,
    });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return { ok: false, message: insertError.message };
    }

    return { ok: true };
  };

  return { sendMessage, sending, error };
}
