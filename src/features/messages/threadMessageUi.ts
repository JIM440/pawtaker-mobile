import { formatCarePointsPts } from "@/src/lib/points/carePoints";
import { parsePetNotes } from "@/src/lib/pets/parsePetNotes";
import { petGalleryUrls } from "@/src/lib/pets/petGalleryUrls";
import type { Json } from "@/src/lib/supabase/types";
import type { ChatMessageRow } from "./hooks/useMessages";

export type BubbleSide = "left" | "right";
export type UiMessageType = "text" | "image" | "file" | "request" | "date";

export type UiMessage = {
  id: string;
  side: BubbleSide;
  type: UiMessageType;
  text?: string;
  /** When `type === "image"` — Cloudinary or remote URL stored in `messages.content`. */
  imageUri?: string;
  /** When `type === "file"` — link + label from metadata. */
  fileUrl?: string;
  fileName?: string;
  timeLabel: string;
  requestData?: {
    petName: string;
    breed: string;
    petType?: string;
    imageUri?: string;
    description?: string;
    tags?: string[];
    careType?: string;
    date: string;
    time: string;
    price: string;
    context: "seeking" | "applying";
    offerId: string;
  };
};

function readMetadataString(metadata: Json | null | undefined, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return null;
  const v = (metadata as Record<string, Json>)[key];
  return typeof v === "string" && v.trim() ? v : null;
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

export type ThreadMessageUiContext = {
  rows: Pick<
    ChatMessageRow,
    "id" | "sender_id" | "content" | "type" | "metadata" | "created_at"
  >[];
  userId: string;
  pet: any | null;
  req: any | null;
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
        side,
        type: "file" as const,
        fileUrl: contentTrim,
        fileName:
          typeof meta.file_name === "string" && meta.file_name.trim()
            ? meta.file_name
            : "Attachment",
        timeLabel: formatTime(m.created_at),
      };
    }

    if (m.type === "image" && contentTrim) {
      return {
        id: m.id,
        side,
        type: "image" as const,
        imageUri: contentTrim,
        timeLabel: formatTime(m.created_at),
      };
    }

    const asRequest =
      (m.type === "proposal" || m.type === "agreement") &&
      (pet || paramPetName || paramBreed);

    if (asRequest) {
      const metaRequestId = readMetadataString(m.metadata, "requestId");
      const offer =
        paramOfferId ??
        metaRequestId ??
        (typeof req?.id === "string" ? req.id : "");

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

      return {
        id: m.id,
        side,
        type: "request",
        timeLabel: formatTime(m.created_at),
        requestData: {
          petName: paramPetName ?? pet?.name ?? "Pet",
          breed: paramBreed ?? pet?.breed ?? "Unknown breed",
          petType: pet?.species ?? "",
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
              ? `${new Date(req.start_date as string).toLocaleDateString()} - ${new Date(req.end_date as string).toLocaleDateString()}`
              : ""),
          time:
            paramTime ??
            (typeof req?.start_time === "string" &&
            typeof req?.end_time === "string"
              ? `${(req.start_time as string).slice(0, 5)} - ${(req.end_time as string).slice(0, 5)}`
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
          context,
          offerId: offer,
        },
      };
    }

    return {
      id: m.id,
      side,
      type: "text",
      text: m.content ?? "",
      timeLabel: formatTime(m.created_at),
    };
  });
}
