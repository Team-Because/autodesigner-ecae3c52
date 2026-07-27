import { supabase } from "@/integrations/supabase/client";
import { TABLES, type UserCredits } from "@/lib/db";

export async function getMyCredits(userId: string): Promise<UserCredits | null> {
  const { data, error } = await supabase
    .from(TABLES.user_credits)
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}
