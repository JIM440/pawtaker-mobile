import type { Json } from "@/src/lib/supabase/types";
import { supabase } from "@/src/lib/supabase/client";

type CreateInAppNotificationInput = {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
};

export async function createInAppNotification({
  userId,
  type,
  title,
  body,
  data = null,
}: CreateInAppNotificationInput): Promise<void> {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    body,
    data: (data ?? null) as Json,
  });
}

