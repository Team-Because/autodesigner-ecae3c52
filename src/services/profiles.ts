import { supabase } from "@/integrations/supabase/client";
import { TABLES, type Profile } from "@/lib/db";

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getMyProfileFields<K extends keyof Profile>(
  userId: string,
  fields: K[],
): Promise<Pick<Profile, K> | null> {
  const { data, error } = await supabase
    .from(TABLES.profiles)
    .select(fields.join(","))
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as unknown as Pick<Profile, K> | null;
}
