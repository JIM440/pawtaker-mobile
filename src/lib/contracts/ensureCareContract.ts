import { supabase } from "@/src/lib/supabase/client";

export async function ensureCareContractForRequest(opts: {
  requestId: string;
  ownerId: string;
  takerId: string;
}) {
  const { requestId, ownerId, takerId } = opts;

  const { data: existing, error: existingError } = await supabase
    .from("contracts")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.id) return existing.id as string;

  const { data: inserted, error: insertError } = await supabase
    .from("contracts")
    .insert({
      request_id: requestId,
      owner_id: ownerId,
      taker_id: takerId,
      signed_owner: false,
      signed_taker: false,
      status: "draft",
    })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return inserted.id as string;
}
