/**
 * Canonical care counts — computed from completed contracts where the
 * care_request's start_date had already passed at time of fetching.
 *
 * Rules:
 *  - contract.status must be "completed"
 *  - care_request.start_date must be <= today (the care actually began)
 *
 * Used by both the Profile header and the My Care stats section so both
 * screens always show the same numbers.
 */

import { supabase } from "@/src/lib/supabase/client";

export type CanonicalCareCounts = {
  careGiven: number;
  careReceived: number;
};

export async function countCanonicalCare(
  userId: string,
): Promise<CanonicalCareCounts> {
  const today = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  // Fetch completed contracts for both roles in parallel
  const [{ data: givenContracts }, { data: receivedContracts }] =
    await Promise.all([
      supabase
        .from("contracts")
        .select("request_id")
        .eq("taker_id", userId)
        .eq("status", "completed"),
      supabase
        .from("contracts")
        .select("request_id")
        .eq("owner_id", userId)
        .eq("status", "completed"),
    ]);

  const givenRequestIds = (givenContracts ?? [])
    .map((c) => c.request_id)
    .filter((id): id is string => Boolean(id));
  const receivedRequestIds = (receivedContracts ?? [])
    .map((c) => c.request_id)
    .filter((id): id is string => Boolean(id));

  const allRequestIds = [
    ...new Set([...givenRequestIds, ...receivedRequestIds]),
  ];

  if (allRequestIds.length === 0) {
    return { careGiven: 0, careReceived: 0 };
  }

  // Only keep requests whose start_date has already passed
  const { data: validRequests } = await supabase
    .from("care_requests")
    .select("id")
    .in("id", allRequestIds)
    .lte("start_date", today);

  const validIds = new Set((validRequests ?? []).map((r) => r.id));

  return {
    careGiven: givenRequestIds.filter((id) => validIds.has(id)).length,
    careReceived: receivedRequestIds.filter((id) => validIds.has(id)).length,
  };
}
