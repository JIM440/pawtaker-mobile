import { supabase } from "@/src/lib/supabase/client";

export type RequestEligibilityResult = {
  eligible: boolean;
  reason:
    | "missing_request"
    | "request_not_open"
    | "contract_exists"
    | "ok";
  requestStatus?: string | null;
  contractId?: string | null;
};

/**
 * A request can receive new applications only while it is open and has no contract.
 */
export async function getRequestEligibility(
  requestId: string,
): Promise<RequestEligibilityResult> {
  if (!requestId) {
    return { eligible: false, reason: "missing_request" };
  }

  const [{ data: req, error: reqErr }, { data: contract, error: contractErr }] =
    await Promise.all([
      supabase
        .from("care_requests")
        .select("id,status")
        .eq("id", requestId)
        .maybeSingle(),
      supabase
        .from("contracts")
        .select("id,status")
        .eq("request_id", requestId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (reqErr) throw reqErr;
  if (contractErr) throw contractErr;
  if (!req?.id) return { eligible: false, reason: "missing_request" };

  const status = (req.status as string | null | undefined) ?? null;
  if (status !== "open") {
    return { eligible: false, reason: "request_not_open", requestStatus: status };
  }
  if (contract?.id) {
    return {
      eligible: false,
      reason: "contract_exists",
      requestStatus: status,
      contractId: contract.id as string,
    };
  }

  return { eligible: true, reason: "ok", requestStatus: status };
}

