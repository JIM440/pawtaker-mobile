import { supabase } from "@/src/lib/supabase/client";

export type RequestEligibilityResult = {
  eligible: boolean;
  reason:
    | "missing_request"
    | "request_not_open"
    | "request_expired"
    | "contract_exists"
    | "ok";
  requestStatus?: string | null;
  contractId?: string | null;
  selectedTakerId?: string | null;
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
        .select("id,status,taker_id,end_date,end_time")
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
  const endDate = typeof req.end_date === "string" ? req.end_date : "";
  const endTime = typeof req.end_time === "string" ? req.end_time.slice(0, 5) : "";
  if (endDate) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const nowTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const isExpired =
      endDate < today || (endDate === today && endTime.length > 0 && endTime < nowTime);
    if (isExpired) {
      return {
        eligible: false,
        reason: "request_expired",
        requestStatus: status,
        contractId: (contract?.id as string | null | undefined) ?? null,
        selectedTakerId: (req.taker_id as string | null | undefined) ?? null,
      };
    }
  }
  if (status !== "open") {
    return {
      eligible: false,
      reason: "request_not_open",
      requestStatus: status,
      contractId: (contract?.id as string | null | undefined) ?? null,
      selectedTakerId: (req.taker_id as string | null | undefined) ?? null,
    };
  }
  if (contract?.id) {
    return {
      eligible: false,
      reason: "contract_exists",
      requestStatus: status,
      contractId: contract.id as string,
      selectedTakerId: (req.taker_id as string | null | undefined) ?? null,
    };
  }

  return {
    eligible: true,
    reason: "ok",
    requestStatus: status,
    selectedTakerId: (req.taker_id as string | null | undefined) ?? null,
  };
}
