import { supabase } from "@/src/lib/supabase/client";

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
