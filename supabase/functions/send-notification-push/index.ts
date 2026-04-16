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

// @ts-ignore - Deno/Supabase Edge resolves npm: specifiers at runtime.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

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
    const logStage = async (stage: string, detail: Record<string, unknown>) => {
      try {
        await admin.from("push_delivery_debug").insert({
          notification_id: record.id ?? null,
          user_id: record.user_id ?? null,
          stage,
          detail,
        });
      } catch (error) {
        console.error("push debug log failed", stage, error);
      }
    };

    await logStage("webhook_received", {
      type: record.type ?? "unknown",
      hasBody: Boolean(record.body),
    });

    if (!expoToken) {
      await logStage("missing_expo_token", {});
      console.error("send-notification-push: missing EXPO_ACCESS_TOKEN");
      return new Response(JSON.stringify({ ok: false, error: "missing_expo_token" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: tokenRows, error: tokErr } = await admin
      .from("push_tokens")
      .select("token")
      .eq("user_id", record.user_id);

    if (tokErr) {
      await logStage("token_query_failed", {
        message: tokErr.message,
      });
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
      await logStage("no_tokens_found", {});
      return new Response(JSON.stringify({ ok: true, sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await logStage("tokens_loaded", {
      tokenCount: tokens.length,
    });

    const extra =
      record.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : {};
    const dataPayload = {
      ...extra,
      type: record.type ?? "unknown",
      notificationId: record.id ?? "",
    };
    const imageCandidate =
      (typeof extra?.photo_url === "string" && extra.photo_url.trim().length > 0
        ? extra.photo_url.trim()
        : null) ||
      (typeof extra?.sender_avatar_url === "string" &&
      extra.sender_avatar_url.trim().length > 0
        ? extra.sender_avatar_url.trim()
        : null) ||
      null;

    const messages = tokens.map((to: string) => ({
      to,
      title: record.title,
      body: record.body ?? "",
      data: dataPayload,
      sound: "default" as const,
      priority: "high" as const,
      ...(imageCandidate
        ? { richContent: { image: imageCandidate } }
        : {}),
    }));

    await logStage("expo_request_prepared", {
      attempted: messages.length,
      hasRichContent: Boolean(imageCandidate),
    });

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

    const expoJson = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      await logStage("expo_http_error", {
        status: res.status,
        detail: expoJson,
      });
      console.error("expo push", res.status, expoJson);
      return new Response(
        JSON.stringify({ ok: false, error: "expo_push_failed", detail: expoJson }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // HTTP 200 but each message has a ticket: ok | error (see Expo push docs).
    const tickets = Array.isArray(expoJson.data) ? expoJson.data : [];
    const ticketErrors = tickets.filter(
      (t: unknown) =>
        t &&
        typeof t === "object" &&
        (t as { status?: string }).status === "error",
    );
    if (ticketErrors.length > 0) {
      console.error(
        "send-notification-push: some Expo tickets failed",
        ticketErrors,
      );
    }
    const okCount = tickets.filter(
      (t: unknown) =>
        t &&
        typeof t === "object" &&
        (t as { status?: string }).status === "ok",
    ).length;

    const allTicketsFailed =
      tickets.length > 0 && okCount === 0 && ticketErrors.length === tickets.length;

    await logStage("expo_response", {
      attempted: tokens.length,
      okCount,
      ticketErrors,
    });

    return new Response(
      JSON.stringify({
        ok: !allTicketsFailed,
        sent: okCount,
        attempted: tokens.length,
        ...(allTicketsFailed ? { error: "all_expo_tickets_failed" } : {}),
        expo: expoJson,
      }),
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
