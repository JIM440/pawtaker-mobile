import {
  formatCompactTime,
  formatRequestDateRange,
  formatRequestTimeRange,
} from "@/src/lib/datetime/request-date-time-format";
import { formatCarePointsPts } from "@/src/lib/points/carePoints";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import type { Json } from "@/src/lib/supabase/types";
import { resolveDisplayName } from "@/src/lib/user/displayName";
import type { ChatMessageRow } from "./hooks/useMessages";

export type BubbleSide = "left" | "right";
export type UiMessageType =
  | "text"
  | "image"
  | "video"
  | "file"
  | "request"
  | "date";

export type UiMessage = {
  id: string;
  /** DB `messages.sender_id` — for delete-own checks (omit on synthetic rows e.g. date pills). */
  senderId?: string;
  side: BubbleSide;
  type: UiMessageType;
  text?: string;
  /** When `type === "image"` — Cloudinary or remote URL stored in `messages.content`. */
  imageUri?: string;
  /** When `type === "file"` — link + label from metadata. */
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSizeBytes?: number | null;
  videoUrl?: string;
  timeLabel: string;
  requestData?: {
    /** Pet card (owner seeking) vs taker availability (application). */
    visual: "pet" | "taker";
    petName: string;
    breed: string;
    petType?: string;
    yardType?: string;
    ageRange?: string;
    energyLevel?: string;
    imageUri?: string;
    description?: string;
    tags?: string[];
    careType?: string;
    date: string;
    time: string;
    price: string;
    context: "seeking" | "applying";
    offerId: string;
    /** Taker offer card (when `visual === "taker"`) — matches Figma owner view. */
    takerProfileUserId?: string;
    takerName?: string;
    takerAvatarUri?: string | null;
    takerRating?: number;
    takerHandshakes?: number;
    takerPaws?: number;
    takerCity?: string;
    takerAvailable?: boolean;
    takerBio?: string;
    /** `accepted_species` formatted with " • ". */
    takerPetTypesLine?: string;
    /** Care-type keys for the tonal pill (offer metadata or availability services). */
    takerCareTypeKeys?: string[];
    pointsOffered?: number | null;
  };
};

function readMetadataString(metadata: Json | null | undefined, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const v = (metadata as Record<string, Json>)[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function readMetadataStringArray(
  metadata: Json | null | undefined,
  key: string,
): string[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return [];
  const v = (metadata as Record<string, Json>)[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

function readMetadataNumber(
  metadata: Json | null | undefined,
  key: string,
): number | null {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const v = (metadata as Record<string, Json>)[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function parseAvailabilityJsonSummary(raw: Json | null | undefined): {
  available: boolean;
  petKinds: string[];
  services: string[];
  days: string[];
  timeLabel: string;
  yardType: string;
  note: string;
  petOwner: string;
} {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      available: false,
      petKinds: [],
      services: [],
      days: [],
      timeLabel: "",
      yardType: "",
      note: "",
      petOwner: "",
    };
  }
  const o = raw as Record<string, unknown>;
  const days = Array.isArray(o.days)
    ? o.days.filter((x): x is string => typeof x === "string")
    : [];
  const petKinds = Array.isArray(o.petKinds)
    ? o.petKinds.filter((x): x is string => typeof x === "string")
    : [];
  const services = Array.isArray(o.services)
    ? o.services.filter((x): x is string => typeof x === "string")
    : [];
  const start = typeof o.startTime === "string" ? o.startTime : "";
  const end = typeof o.endTime === "string" ? o.endTime : "";
  const timeLabel =
    start.trim() && end.trim() ? `${start.trim()} – ${end.trim()}` : "";
  return {
    available: o.available === true,
    petKinds,
    services,
    days,
    timeLabel,
    yardType: typeof o.yardType === "string" ? o.yardType : "",
    note: typeof o.note === "string" ? o.note : "",
    petOwner: typeof o.petOwner === "string" ? o.petOwner : "",
  };
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return formatCompactTime(new Date(iso));
}

export type ThreadTakerBundle = {
  profile: {
    accepted_species?: string[] | null;
    availability_json?: Json | null;
  } | null;
  user: {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
    city?: string | null;
    bio?: string | null;
    care_given_count?: number | null;
    care_received_count?: number | null;
  } | null;
};

export type ThreadMessageUiContext = {
  rows: Pick<
    ChatMessageRow,
    "id" | "sender_id" | "content" | "type" | "metadata" | "created_at"
  >[];
  userId: string;
  pet: any | null;
  req: any | null;
  /** Care request owner; used to tell owner- vs taker-sent proposals apart. */
  requestOwnerId: string | null | undefined;
  /** Non-owner participant (applicant) when the thread has a linked request. */
  takerParticipantId: string | null | undefined;
  /** Average review score for the applicant (0 when none). */
  takerReviewRatingAvg: number;
  /** Taker profile + user row for this thread (the non-owner participant). */
  takerBundle: ThreadTakerBundle | null;
  /** Fallback when `requestOwnerId` is unknown (no linked request). */
  context: "seeking" | "applying";
  paramPetName?: string;
  paramBreed?: string;
  paramDate?: string;
  paramTime?: string;
  paramPrice?: string;
  paramOfferId?: string;
};

export function mapThreadMessagesToUi(ctx: ThreadMessageUiContext): UiMessage[] {
  const {
    rows,
    userId,
    pet,
    req,
    requestOwnerId,
    takerParticipantId,
    takerReviewRatingAvg,
    takerBundle,
    context,
    paramPetName,
    paramBreed,
    paramDate,
    paramTime,
    paramPrice,
    paramOfferId,
  } = ctx;

  return rows.map((m) => {
    const side: BubbleSide = m.sender_id === userId ? "right" : "left";
    const contentTrim = typeof m.content === "string" ? m.content.trim() : "";
    const meta =
      m.metadata &&
      typeof m.metadata === "object" &&
      !Array.isArray(m.metadata)
        ? (m.metadata as Record<string, Json>)
        : null;

    if (meta?.kind === "file" && contentTrim.startsWith("http")) {
      return {
        id: m.id,
        senderId: m.sender_id,
        side,
        type: "file" as const,
        fileUrl: contentTrim,
        fileName:
          typeof meta.file_name === "string" && meta.file_name.trim()
            ? meta.file_name
            : "Attachment",
        fileMimeType:
          typeof meta.mime_type === "string" && meta.mime_type.trim()
            ? meta.mime_type
            : undefined,
        fileSizeBytes:
          typeof meta.size_bytes === "number" && Number.isFinite(meta.size_bytes)
            ? meta.size_bytes
            : typeof meta.size_bytes === "string" && meta.size_bytes.trim()
              ? Number(meta.size_bytes)
              : null,
        timeLabel: formatTime(m.created_at),
      };
    }

    if (meta?.kind === "video" && contentTrim.startsWith("http")) {
      return {
        id: m.id,
        senderId: m.sender_id,
        side,
        type: "video" as const,
        videoUrl: contentTrim,
        fileName:
          typeof meta.file_name === "string" && meta.file_name.trim()
            ? meta.file_name
            : "Video",
        fileMimeType:
          typeof meta.mime_type === "string" && meta.mime_type.trim()
            ? meta.mime_type
            : undefined,
        fileSizeBytes:
          typeof meta.size_bytes === "number" && Number.isFinite(meta.size_bytes)
            ? meta.size_bytes
            : typeof meta.size_bytes === "string" && meta.size_bytes.trim()
              ? Number(meta.size_bytes)
              : null,
        timeLabel: formatTime(m.created_at),
      };
    }

    if (m.type === "image" && contentTrim) {
      return {
        id: m.id,
        senderId: m.sender_id,
        side,
        type: "image" as const,
        imageUri: contentTrim,
        timeLabel: formatTime(m.created_at),
      };
    }

    const asRequest =
      (m.type === "proposal" || m.type === "agreement") &&
      (pet || paramPetName || paramBreed || req?.id);

    if (asRequest) {
      const metaRequestId = readMetadataString(m.metadata, "requestId");
      const offer =
        paramOfferId ??
        metaRequestId ??
        (typeof req?.id === "string" ? req.id : "");

      const ownerKey =
        typeof requestOwnerId === "string" && requestOwnerId.trim()
          ? requestOwnerId.trim()
          : null;
      const bubbleContext: "seeking" | "applying" =
        ownerKey != null
          ? m.sender_id === ownerKey
            ? "seeking"
            : "applying"
          : context;

      const petNotes = parsePetNotes(pet?.notes);
      const tags = [
        pet?.yard_type ?? petNotes.yardType,
        pet?.energy_level ?? petNotes.energyLevel,
        pet?.age_range ?? petNotes.ageRange,
      ].filter(
        (v: unknown): v is string =>
          typeof v === "string" && v.trim().length > 0,
      );

      const img = pet ? (petGalleryUrls(pet)[0] ?? "") : "";
      const displayPetName = paramPetName ?? pet?.name ?? "Pet";

      // Applicant's own proposal: show pet card. Owner viewing applicant: show taker card.
      if (
        bubbleContext === "applying" &&
        m.type === "proposal" &&
        m.sender_id !== userId
      ) {
        const av = parseAvailabilityJsonSummary(
          takerBundle?.profile?.availability_json ?? null,
        );
        const species = Array.isArray(takerBundle?.profile?.accepted_species)
          ? (takerBundle?.profile?.accepted_species as string[]).filter(
              (s) => typeof s === "string" && s.trim().length > 0,
            )
          : [];
        const offerCareKeys = readMetadataStringArray(m.metadata, "careTypes");
        const pointsOffered = readMetadataNumber(m.metadata, "pointsOffered");
        const proposalNote = contentTrim.length > 0 ? contentTrim : undefined;
        const takerUserRow = takerBundle?.user ?? null;
        const careKeysForPill =
          offerCareKeys.length > 0 ? offerCareKeys : av.services;
        const takerPid =
          typeof takerParticipantId === "string" && takerParticipantId.trim()
            ? takerParticipantId.trim()
            : typeof takerUserRow?.id === "string"
              ? takerUserRow.id
              : undefined;

        return {
          id: m.id,
          senderId: m.sender_id,
          side,
          type: "request",
          timeLabel: formatTime(m.created_at),
          requestData: {
            visual: "taker",
            petName: displayPetName,
            breed: paramBreed ?? pet?.breed ?? "",
            petType: pet?.species ?? "",
            yardType: undefined,
            ageRange: undefined,
            energyLevel: undefined,
            imageUri: undefined,
            description: proposalNote,
            tags: [],
            careType:
              typeof req?.care_type === "string" && req.care_type.trim()
                ? (req.care_type as string)
                : undefined,
            date:
              paramDate ??
              (req?.start_date && req?.end_date
                ? formatRequestDateRange(
                    req.start_date as string,
                    req.end_date as string,
                  )
                : ""),
            time:
              paramTime ??
              (typeof req?.start_time === "string" &&
              typeof req?.end_time === "string"
                ? formatRequestTimeRange(
                    req.start_time as string,
                    req.end_time as string,
                  )
                : ""),
            price:
              paramPrice ??
              (req?.start_date && req?.end_date
                ? formatCarePointsPts(
                    req.care_type as string,
                    req.start_date as string,
                    req.end_date as string,
                  )
                : ""),
            context: "applying",
            offerId: offer,
            takerProfileUserId: takerPid,
            takerName: resolveDisplayName(takerUserRow) || undefined,
            takerAvatarUri: takerUserRow?.avatar_url ?? null,
            takerRating: takerReviewRatingAvg,
            takerHandshakes: takerUserRow?.care_given_count ?? 0,
            takerPaws: takerUserRow?.care_received_count ?? 0,
            takerCity:
              typeof takerUserRow?.city === "string" && takerUserRow.city.trim()
                ? takerUserRow.city.trim()
                : undefined,
            takerBio:
              typeof takerUserRow?.bio === "string" && takerUserRow.bio.trim()
                ? takerUserRow.bio.trim()
                : undefined,
            takerAvailable: av.available,
            takerPetTypesLine:
              species.length > 0 ? species.join(" • ") : undefined,
            takerCareTypeKeys:
              careKeysForPill.length > 0 ? careKeysForPill : undefined,
            pointsOffered,
          },
        };
      }

      return {
        id: m.id,
        senderId: m.sender_id,
        side,
        type: "request",
        timeLabel: formatTime(m.created_at),
        requestData: {
          visual: "pet",
          petName: displayPetName,
          breed: paramBreed ?? pet?.breed ?? "Unknown breed",
          petType: pet?.species ?? "",
          yardType:
            typeof (pet?.yard_type ?? petNotes.yardType) === "string"
              ? (pet?.yard_type ?? petNotes.yardType)
              : undefined,
          ageRange:
            typeof (pet?.age_range ?? petNotes.ageRange) === "string"
              ? (pet?.age_range ?? petNotes.ageRange)
              : undefined,
          energyLevel:
            typeof (pet?.energy_level ?? petNotes.energyLevel) === "string"
              ? (pet?.energy_level ?? petNotes.energyLevel)
              : undefined,
          imageUri: img || undefined,
          description:
            (petNotes.bio || "").trim().length > 0
              ? (petNotes.bio || "").trim()
              : undefined,
          tags,
          careType:
            typeof req?.care_type === "string" && req.care_type.trim()
              ? (req.care_type as string)
              : undefined,
          date:
            paramDate ??
            (req?.start_date && req?.end_date
              ? formatRequestDateRange(
                  req.start_date as string,
                  req.end_date as string,
                )
              : ""),
          time:
            paramTime ??
            (typeof req?.start_time === "string" &&
            typeof req?.end_time === "string"
              ? formatRequestTimeRange(
                  req.start_time as string,
                  req.end_time as string,
                )
              : ""),
          price:
            paramPrice ??
            (req?.start_date && req?.end_date
              ? formatCarePointsPts(
                  req.care_type as string,
                  req.start_date as string,
                  req.end_date as string,
                )
              : ""),
          context: bubbleContext,
          offerId: offer,
        },
      };
    }

    return {
      id: m.id,
      senderId: m.sender_id,
      side,
      type: "text",
      text: m.content ?? "",
      timeLabel: formatTime(m.created_at),
    };
  });
}
