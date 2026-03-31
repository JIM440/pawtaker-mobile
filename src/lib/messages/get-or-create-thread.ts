import { supabase } from "@/src/lib/supabase/client";

type GetOrCreateThreadParams = {
  userA: string;
  userB: string;
  requestId?: string | null;
};

export async function getOrCreateThreadForUsers({
  userA,
  userB,
  requestId = null,
}: GetOrCreateThreadParams): Promise<string> {
  const participants = [userA, userB].sort();

  const { data: existingAny, error: existingAnyError } = await supabase
    .from("threads")
    .select("id,request_id")
    .contains("participant_ids", participants)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingAnyError) throw existingAnyError;

  if (existingAny?.id) {
    if (requestId && existingAny.request_id !== requestId) {
      await supabase
        .from("threads")
        .update({ request_id: requestId })
        .eq("id", existingAny.id);
    }
    return existingAny.id as string;
  }

  const { data: inserted, error: insertError } = await supabase
    .from("threads")
    .insert({
      participant_ids: participants,
      request_id: requestId,
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  if (!inserted?.id) throw new Error("Could not create chat thread.");
  return inserted.id as string;
}

