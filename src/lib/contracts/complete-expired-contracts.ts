import { supabase } from "@/src/lib/supabase/client";
import { isMissingColumnError } from "@/src/lib/supabase/errors";
import type { TablesRow } from "@/src/lib/supabase/types";

type ActiveContractRow = Pick<
  TablesRow<"contracts">,
  "id" | "request_id" | "owner_id" | "taker_id" | "status"
>;

type RequestTimingRow = Pick<
  TablesRow<"care_requests">,
  "id" | "end_date" | "end_time" | "status"
>;

function buildRequestEndAt(
  endDate?: string | null,
  endTime?: string | null,
): Date | null {
  if (!endDate) return null;

  const safeTime =
    typeof endTime === "string" && endTime.trim().length > 0
      ? endTime.trim().slice(0, 8)
      : "23:59:59";

  const normalizedTime = safeTime.length === 5 ? `${safeTime}:00` : safeTime;
  const endAt = new Date(`${endDate}T${normalizedTime}`);

  return Number.isNaN(endAt.getTime()) ? null : endAt;
}

export async function completeExpiredContractsForUser(userId: string): Promise<{
  completedContractIds: string[];
  completedRequestIds: string[];
}> {
  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("id,request_id,owner_id,taker_id,status")
    .or(`owner_id.eq.${userId},taker_id.eq.${userId}`)
    .eq("status", "active");

  if (contractsError) throw contractsError;

  const activeContracts = (contracts ?? []) as ActiveContractRow[];
  if (activeContracts.length === 0) {
    return { completedContractIds: [], completedRequestIds: [] };
  }

  const requestIds = Array.from(
    new Set(activeContracts.map((contract) => contract.request_id).filter(Boolean)),
  );

  const { data: requests, error: requestsError } = requestIds.length
    ? await supabase
        .from("care_requests")
        .select("id,end_date,end_time,status")
        .in("id", requestIds)
    : { data: [], error: null };

  if (requestsError) throw requestsError;

  const requestsById = new Map(
    ((requests ?? []) as RequestTimingRow[]).map((request) => [request.id, request]),
  );

  const now = new Date();
  const expiredContracts = activeContracts.filter((contract) => {
    const request = requestsById.get(contract.request_id);
    const endAt = buildRequestEndAt(request?.end_date, request?.end_time);
    return Boolean(endAt && endAt.getTime() <= now.getTime());
  });

  if (expiredContracts.length === 0) {
    return { completedContractIds: [], completedRequestIds: [] };
  }

  const completedContractIds = expiredContracts.map((contract) => contract.id);
  const completedRequestIds = Array.from(
    new Set(expiredContracts.map((contract) => contract.request_id).filter(Boolean)),
  );

  let { error: completeContractsError } = await supabase
    .from("contracts")
    .update({
      status: "completed",
      terminate_requested_by: null,
      terminate_requested_at: null,
    })
    .in("id", completedContractIds);
  if (completeContractsError && isMissingColumnError(completeContractsError)) {
    const fallback = await supabase
      .from("contracts")
      .update({ status: "completed" })
      .in("id", completedContractIds);
    completeContractsError = fallback.error;
  }

  if (completeContractsError) throw completeContractsError;

  if (completedRequestIds.length > 0) {
    const { error: completeRequestsError } = await supabase
      .from("care_requests")
      .update({ status: "completed" })
      .in("id", completedRequestIds);

    if (completeRequestsError) throw completeRequestsError;
  }

  return { completedContractIds, completedRequestIds };
}
