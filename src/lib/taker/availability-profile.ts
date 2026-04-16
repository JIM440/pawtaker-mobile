import { supabase } from "@/src/lib/supabase/client";

export async function hasAvailabilityProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("taker_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.user_id);
}
