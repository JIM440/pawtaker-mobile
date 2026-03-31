import { hasUserBlockRelation } from "@/src/lib/blocks/user-blocks";
import { getOrCreateThreadForUsers } from "@/src/lib/messages/get-or-create-thread";
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

    try {
      const threadId = await getOrCreateThreadForUsers({
        userA: userId,
        userB: otherUserId,
        requestId: requestId ?? null,
      });
      setLoading(false);
      router.push(`/(private)/(tabs)/messages/${threadId}` as any);
      return { ok: true };
    } catch (createError: any) {
      setLoading(false);
      const msg = createError?.message ?? "Failed to create thread.";
      setError(msg);
      return { ok: false, message: msg };
    }
  };

  return { openThread, loading, error };
}
