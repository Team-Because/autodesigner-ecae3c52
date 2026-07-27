import { supabase } from "@/integrations/supabase/client";
import { TABLES, type Generation } from "@/lib/db";

export type GenerationListItem = Pick<
  Generation,
  "id" | "brand_id" | "status" | "created_at"
>;

export async function listMyGenerationsMinimal(): Promise<GenerationListItem[]> {
  const { data, error } = await supabase
    .from(TABLES.generations)
    .select("id, brand_id, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
