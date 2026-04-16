import type { Router } from "expo-router";

import { getRequestEligibility } from "@/src/lib/contracts/request-eligibility";
import { supabase } from "@/src/lib/supabase/client";

export type NotificationNavPayload = {
  type: string;
  data: Record<string, unknown> | null | undefined;
};

/**
 * Proposal / offer deep-links: owner → accept-offer screen when open; participants
 * with a contract → contract; otherwise → application request details.
 */
export async function navigateProposalOfferDetails(
  router: Router,
  requestId: string,
  currentUserId?: string | null,
): Promise<void> {
  const uid = currentUserId?.trim() ?? null;

  try {
    const eligibility = await getRequestEligibility(requestId);
    const { data: reqRow } = await supabase
      .from("care_requests")
      .select("owner_id,taker_id,status")
      .eq("id", requestId)
      .maybeSingle();

    const ownerId =
      typeof reqRow?.owner_id === "string" ? reqRow.owner_id : "";
    const takerId =
      typeof reqRow?.taker_id === "string" ? reqRow.taker_id : "";

    if (!eligibility.eligible && eligibility.contractId && uid) {
      if (uid === ownerId || uid === takerId) {
        router.push({
          pathname: "/(private)/contract/[id]",
          params: { id: eligibility.contractId },
        });
        return;
      }
    }

    // Pet owner: review / accept application (owner-only screen).
    if (
      uid &&
      ownerId &&
      uid === ownerId &&
      eligibility.reason !== "request_expired" &&
      reqRow?.status === "open" &&
      !eligibility.contractId
    ) {
      router.push(
        `/(private)/post-availability/${requestId}` as Parameters<
          typeof router.push
        >[0],
      );
      return;
    }
  } catch {
    /* fall through */
  }

  router.push(`/(private)/post-requests/${requestId}` as Parameters<
    typeof router.push
  >[0]);
}

/**
 * Resolves auth-dependent routes (e.g. proposal → offer detail). Falls back to
 * {@link navigateForNotificationPayload} when async routing is not needed.
 */
export async function navigateForNotificationPayloadAsync(
  router: Router,
  payload: NotificationNavPayload,
  options?: { currentUserId?: string | null },
): Promise<void> {
  const d = payload.data ?? {};
  if (payload.type === "chat" && d.messageType === "proposal") {
    const requestId =
      typeof d.requestId === "string" ? d.requestId.trim() : "";
    if (requestId) {
      await navigateProposalOfferDetails(
        router,
        requestId,
        options?.currentUserId ?? null,
      );
      return;
    }
  }

  navigateForNotificationPayload(router, payload);
}

/**
 * Single place for notification deep-links (in-app list + cold-start push tap).
 */
export function navigateForNotificationPayload(
  router: Router,
  { type, data }: NotificationNavPayload,
): void {
  const d = data ?? {};

  switch (type) {
    case "pet_added": {
      const petId = typeof d.pet_id === "string" ? d.pet_id : null;
      if (petId) {
        router.push({
          pathname: "/(private)/pets/[id]",
          params: { id: petId },
        });
      } else {
        router.push({
          pathname: "/(private)/(tabs)/profile",
          params: { tab: "pets", refreshPets: "true" },
        });
      }
      break;
    }
    case "availability_posted": {
      const takerId = typeof d.taker_id === "string" ? d.taker_id : null;
      if (takerId) {
        router.push({
          pathname: "/(private)/(tabs)/(home)/users/[id]",
          params: { id: takerId },
        });
      } else {
        router.push({
          pathname: "/(private)/(tabs)/profile",
          params: { tab: "availability", refreshAvailability: "true" },
        });
      }
      break;
    }
    case "availability_saved":
      router.push({
        pathname: "/(private)/(tabs)/profile",
        params: { tab: "availability", refreshAvailability: "true" },
      });
      break;
    case "care_request_posted": {
      const requestId =
        typeof d.request_id === "string" ? d.request_id : null;
      if (requestId) {
        router.push({
          pathname: "/(private)/post-requests/[id]",
          params: { id: requestId },
        });
      } else {
        router.push("/(private)/(tabs)/(home)" as any);
      }
      break;
    }
    case "review_received":
    case "review_submitted": {
      const contractId =
        typeof d.contract_id === "string" ? d.contract_id : null;
      if (contractId) {
        router.push({
          pathname: "/(private)/contract/[id]",
          params: { id: contractId },
        });
      } else {
        router.push({
          pathname: "/(private)/(tabs)/profile",
          params: { tab: "reviews", refreshReviews: "true" },
        });
      }
      break;
    }
    case "contract_completed": {
      const contractId =
        typeof d.contract_id === "string" ? d.contract_id : null;
      if (contractId) {
        router.push({
          pathname: "/(private)/contract/[id]",
          params: { id: contractId },
        });
      } else {
        router.push("/(private)/(tabs)/my-care" as any);
      }
      break;
    }
    case "contract_accepted":
    case "agreement_accepted":
    case "offer_accepted":
    case "contract_terminated":
    case "agreement_terminated":
    case "offer_terminated":
    case "termination_requested":
    case "termination_reactivated":
    case "termination_accepted":
    case "termination_confirmed": {
      const contractId =
        typeof d.contract_id === "string" ? d.contract_id : null;
      const requestId = typeof d.request_id === "string" ? d.request_id : null;
      if (contractId) {
        router.push({
          pathname: "/(private)/contract/[id]",
          params: { id: contractId },
        });
      } else if (requestId) {
        router.push({
          pathname: "/(private)/contract/[id]",
          params: { id: requestId },
        });
      } else {
        router.push("/(private)/(tabs)/my-care" as any);
      }
      break;
    }
    case "chat": {
      const threadId = d.threadId;
      if (typeof threadId === "string" && threadId) {
        router.push(`/(private)/chat/${threadId}` as any);
      } else {
        router.push("/(private)/(tabs)/messages");
      }
      break;
    }
    case "applied":
    case "care_given":
    case "paws_given":
    case "verification_complete":
      router.push("/(private)/(tabs)/profile");
      break;
    case "kyc_approved":
    case "kyc_rejected":
      router.push("/(private)/kyc" as Parameters<typeof router.push>[0]);
      break;
    default:
      router.push("/(private)/(tabs)/profile");
      break;
  }
}
