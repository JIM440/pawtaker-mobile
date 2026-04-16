const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function loadEnvFile(envPath) {
  const result = {};
  if (!fs.existsSync(envPath)) return result;

  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key) result[key] = value;
  }

  return result;
}

async function main() {
  const root = path.resolve(__dirname, "..");
  const env = loadEnvFile(path.join(root, ".env"));

  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;
  const recipientName = process.env.TEST_RECIPIENT_NAME;
  const messageText =
    process.env.TEST_MESSAGE_TEXT || `Push debug test ${new Date().toISOString()}`;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
  if (!email || !password) {
    throw new Error("Missing TEST_EMAIL or TEST_PASSWORD.");
  }
  if (!recipientName) {
    throw new Error("Missing TEST_RECIPIENT_NAME.");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError) {
    throw new Error(`Sign-in failed: ${signInError.message}`);
  }

  const senderId = signInData.user?.id;
  if (!senderId) {
    throw new Error("No sender user id returned after sign-in.");
  }

  const { data: recipientRows, error: recipientError } = await supabase
    .from("users")
    .select("id, full_name")
    .ilike("full_name", `%${recipientName}%`)
    .limit(5);

  if (recipientError) {
    throw new Error(`Recipient lookup failed: ${recipientError.message}`);
  }
  if (!recipientRows || recipientRows.length === 0) {
    throw new Error(`No user found matching full_name ilike "${recipientName}".`);
  }
  if (recipientRows.length > 1) {
    const names = recipientRows
      .map((row) => `${row.full_name ?? "<no name>"} (${row.id})`)
      .join(", ");
    throw new Error(
      `Recipient lookup returned multiple users. Narrow TEST_RECIPIENT_NAME. Matches: ${names}`,
    );
  }

  const recipient = recipientRows[0];
  if (!recipient?.id) {
    throw new Error("Recipient row is missing an id.");
  }

  const participants = [senderId, recipient.id].sort();
  const { data: threadRow, error: threadError } = await supabase
    .from("threads")
    .select("id, participant_ids, request_id, last_message_at")
    .contains("participant_ids", participants)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (threadError) {
    throw new Error(`Thread lookup failed: ${threadError.message}`);
  }
  if (!threadRow?.id) {
    throw new Error(
      `No existing thread found between sender ${senderId} and recipient ${recipient.id}.`,
    );
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("messages")
    .insert({
      thread_id: threadRow.id,
      sender_id: senderId,
      content: messageText.trim(),
      type: "text",
      metadata: null,
    })
    .select("id, thread_id, sender_id, content, type, created_at");

  if (insertError) {
    throw new Error(`Message insert failed: ${insertError.message}`);
  }

  const inserted = insertedRows?.[0];
  console.log(
    JSON.stringify(
      {
        ok: true,
        senderId,
        recipientId: recipient.id,
        recipientName: recipient.full_name,
        threadId: threadRow.id,
        requestId: threadRow.request_id ?? null,
        message: inserted ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
