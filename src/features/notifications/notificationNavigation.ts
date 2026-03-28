import type { Router } from "expo-router";

export type NotificationNavPayload = {
  type: string;
  data: Record<string, unknown> | null | undefined;
};

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
          pathname: "/(private)/(tabs)/profile/users/[id]",
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
          pathname: "/(private)/(tabs)/my-care/contract/[id]",
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
          pathname: "/(private)/(tabs)/my-care/contract/[id]",
          params: { id: contractId },
        });
      } else {
        router.push("/(private)/(tabs)/my-care" as any);
      }
      break;
    }
    case "chat": {
      const threadId = d.threadId;
      if (typeof threadId === "string" && threadId) {
        router.push(`/(private)/(tabs)/messages/${threadId}` as any);
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
    case "kyc_rejected":
      router.push("/(private)/kyc" as Parameters<typeof router.push>[0]);
      break;
    default:
      router.push("/(private)/(tabs)/profile");
      break;
  }
}
