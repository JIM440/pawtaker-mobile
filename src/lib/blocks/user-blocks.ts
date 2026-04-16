import { supabase } from "@/src/lib/supabase/client";

export type BlockDirection = "none" | "i_blocked" | "they_blocked";

export async function hasUserBlockRelation(
  currentUserId: string,
  otherUserId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id,blocked_id")
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`,
    )
    .limit(1);

  if (error) throw error;
  return Boolean(data && data.length > 0);
}

export function getBlockMessageForDirection(
  direction: BlockDirection,
): string | null {
  if (direction === "i_blocked") {
    return "You blocked this user, so you can't message them.";
  }
  if (direction === "they_blocked") {
    return "This user blocked you, so you can't message them.";
  }
  return null;
}

/**
 * Returns the direction of the block relationship between two users.
 * "i_blocked" — current user blocked the other.
 * "they_blocked" — other user blocked the current user.
 * "none" — no block.
 */
export async function getBlockDirection(
  currentUserId: string,
  otherUserId: string,
): Promise<BlockDirection> {
  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id,blocked_id")
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUserId})`,
    )
    .limit(2);

  if (error) throw error;
  if (!data || data.length === 0) return "none";
  const row = data[0] as { blocker_id: string; blocked_id: string };
  return row.blocker_id === currentUserId ? "i_blocked" : "they_blocked";
}

export async function blockUser(
  currentUserId: string,
  otherUserId: string,
): Promise<void> {
  const { error } = await supabase.from("user_blocks").upsert(
    {
      blocker_id: currentUserId,
      blocked_id: otherUserId,
    },
    { onConflict: "blocker_id,blocked_id" },
  );

  if (error) throw error;
}

export async function unblockUser(
  currentUserId: string,
  otherUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from("user_blocks")
    .delete()
    .eq("blocker_id", currentUserId)
    .eq("blocked_id", otherUserId);

  if (error) throw error;
}

export async function filterOutBlockedUsers(
  currentUserId: string,
  candidateUserIds: string[],
): Promise<Set<string>> {
  if (candidateUserIds.length === 0) return new Set();
  const ids = Array.from(new Set(candidateUserIds.filter(Boolean)));
  if (ids.length === 0) return new Set();

  const { data, error } = await supabase
    .from("user_blocks")
    .select("blocker_id,blocked_id")
    .or(
      `and(blocker_id.eq.${currentUserId},blocked_id.in.(${ids.join(",")})),and(blocked_id.eq.${currentUserId},blocker_id.in.(${ids.join(",")}))`,
    );

  if (error) throw error;

  const blocked = new Set<string>();
  for (const row of data ?? []) {
    const blockerId = (row as any).blocker_id as string;
    const blockedId = (row as any).blocked_id as string;
    const other = blockerId === currentUserId ? blockedId : blockerId;
    if (other) blocked.add(other);
  }
  return blocked;
}
