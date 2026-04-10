import { supabase } from "@/src/lib/supabase/client";

export type AcceptCareRequestResult = {
  accepted: boolean;
  contractId: string | null;
  requestStatus: string | null;
  selectedTakerId: string | null;
};

export async function acceptCareRequest(opts: {
  requestId: string;
  ownerId: string;
  takerId: string;
}): Promise<AcceptCareRequestResult> {
  const { data, error } = await supabase.rpc("accept_care_request", {
    p_request_id: opts.requestId,
    p_owner_id: opts.ownerId,
    p_taker_id: opts.takerId,
  });

  if (error) throw error;

  const row = Array.isArray(data) ? data[0] : data;

  return {
    accepted: Boolean(row?.accepted),
    contractId:
      typeof row?.contract_id === "string" ? row.contract_id : null,
    requestStatus:
      typeof row?.request_status === "string" ? row.request_status : null,
    selectedTakerId:
      typeof row?.accepted_taker_id === "string" ? row.accepted_taker_id : null,
  };
}
