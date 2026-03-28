/**
 * Database Webhook → `public.notifications` INSERT
 *
 * Supabase Dashboard → Database → Webhooks:
 * - Table: notifications, Events: INSERT
 * - URL: https://<PROJECT_REF>.supabase.co/functions/v1/send-notification-push
 * - HTTP Headers: Authorization: Bearer <SERVICE_ROLE_KEY>
 *
 * Secrets (Dashboard → Edge Functions → send-notification-push → Secrets):
 * - EXPO_ACCESS_TOKEN  (Expo account → Access tokens)
 * - SUPABASE_URL       (often auto-provided)
 * - SUPABASE_SERVICE_ROLE_KEY (often auto-provided)
 *
 * Deploy: supabase functions deploy send-notification-push --no-verify-jwt
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type NotificationRecord = {
  id?: string;
  user_id?: string;
  type?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown> | null;
};

function unwrapWebhookBody(body: unknown): NotificationRecord | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  let record: unknown = b.record;
  if (
    (record === null || record === undefined) &&
    b.payload &&
    typeof b.payload === "object"
  ) {
    record = (b.payload as Record<string, unknown>).record;
  }
  if (!record || typeof record !== "object") return null;
  return record as NotificationRecord;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const raw = await req.json();
    const record = unwrapWebhookBody(raw);
    if (!record?.user_id || !record.title) {
      return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expoToken = Deno.env.get("EXPO_ACCESS_TOKEN");
    if (!expoToken) {
      console.error("send-notification-push: missing EXPO_ACCESS_TOKEN");
      return new Response(JSON.stringify({ ok: false, error: "missing_expo_token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    if (!supabaseUrl || !serviceKey) {
      console.error("send-notification-push: missing Supabase env");
      return new Response(JSON.stringify({ ok: false, error: "missing_supabase_env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: tokenRows, error: tokErr } = await admin
      .from("push_tokens")
      .select("token")
      .eq("user_id", record.user_id);

    if (tokErr) {
      console.error("push_tokens", tokErr);
      return new Response(JSON.stringify({ ok: false, error: "token_query_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokens = (tokenRows ?? [])
      .map((r: { token: string }) => r.token)
      .filter((t: string) => typeof t === "string" && t.length > 0);

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extra =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : {};
    const dataPayload = {
      ...extra,
      type: record.type ?? "unknown",
      notificationId: record.id ?? "",
    };

    const messages = tokens.map((to: string) => ({
      to,
      title: record.title,
      body: record.body ?? "",
      data: dataPayload,
      sound: "default" as const,
      priority: "high" as const,
    }));

    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
        Authorization: `Bearer ${expoToken}`,
      },
      body: JSON.stringify(messages),
    });

    const expoJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("expo push", res.status, expoJson);
      return new Response(
        JSON.stringify({ ok: false, error: "expo_push_failed", detail: expoJson }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ ok: true, sent: tokens.length, expo: expoJson }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("send-notification-push", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
