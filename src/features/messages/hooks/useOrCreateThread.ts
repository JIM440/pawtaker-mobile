import { hasUserBlockRelation } from "@/src/lib/blocks/user-blocks";
import { supabase } from "@/src/lib/supabase/client";
import { useAuthStore } from "@/src/lib/store/auth.store";
import { useRouter } from "expo-router";
import { useState } from "react";

export function useOrCreateThread() {
  const { session } = useAuthStore();
  const userId = session?.user?.id;
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openThread = async (
    otherUserId: string,
    requestId?: string,
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    if (!userId) {
      const msg = "You must be signed in to start a chat.";
      setError(msg);
      return { ok: false, message: msg };
    }
    if (userId === otherUserId) {
      const msg = "You cannot open a chat with yourself.";
      setError(msg);
      return { ok: false, message: msg };
    }
    const blocked = await hasUserBlockRelation(userId, otherUserId);
    if (blocked) {
      const msg =
        "You cannot message this user because one of you has blocked the other.";
      setError(msg);
      return { ok: false, message: msg };
    }

    setLoading(true);
    setError(null);

    const { data: existing } = await supabase
      .from("threads")
      .select("id")
      .contains("participant_ids", [userId, otherUserId])
      .maybeSingle();

    if (existing?.id) {
      setLoading(false);
      router.push(`/(private)/(tabs)/messages/${existing.id}` as any);
      return { ok: true };
    }

    const { data: newThread, error: createError } = await supabase
      .from("threads")
      .insert({
        participant_ids: [userId, otherUserId],
        request_id: requestId ?? null,
      })
      .select("id")
      .single();

    setLoading(false);

    if (createError || !newThread) {
      const msg = createError?.message ?? "Failed to create thread.";
      setError(msg);
      return { ok: false, message: msg };
    }

    router.push(`/(private)/(tabs)/messages/${newThread.id}` as any);
    return { ok: true };
  };

  return { openThread, loading, error };
}
