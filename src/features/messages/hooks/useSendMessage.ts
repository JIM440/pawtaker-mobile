import {
  getBlockDirection,
  getBlockMessageForDirection,
} from "@/src/lib/blocks/user-blocks";
import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { errorMessageFromUnknown } from "@/src/lib/supabase/errors";
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
      const readable = errorMessageFromUnknown(
        threadError,
        "Couldn't open this chat right now.",
      );
      setError(readable);
      return { ok: false, message: readable };
    }
    const participants = ((threadRow as any)?.participant_ids ?? []) as string[];
    const otherUserId = participants.find((p) => p && p !== userId);
    if (otherUserId) {
      const blockDirection = await getBlockDirection(userId, otherUserId);
      if (blockDirection !== "none") {
        const msg =
          getBlockMessageForDirection(blockDirection) ??
          "You can't message this user right now.";
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
      const readable = errorMessageFromUnknown(
        insertError,
        "Couldn't send your message right now.",
      );
      setError(readable);
      return { ok: false, message: readable };
    }

    return { ok: true };
  };

  return { sendMessage, sending, error };
}
