import { supabase } from "@/integrations/supabase/client";
import { TABLES, type Campaign } from "@/lib/db";

export async function listMyCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from(TABLES.campaigns)
    .select("*")
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCampaign(name: string, userId: string): Promise<Campaign> {
  const { data, error } = await supabase
    .from(TABLES.campaigns)
    .insert({ name, user_id: userId })
    .select()
    .single();
  if (error || !data) throw error ?? new Error("Failed to create group");
  return data;
}

export async function renameCampaign(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.campaigns)
    .update({ name })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Deletes a campaign; brands referencing it are un-assigned first so the
 * FK removal can't strand them in a "phantom group" state.
 */
export async function deleteCampaign(id: string): Promise<void> {
  const { error: clearErr } = await supabase
    .from(TABLES.brands)
    .update({ campaign_id: null })
    .eq("campaign_id", id);
  if (clearErr) throw clearErr;

  const { error } = await supabase.from(TABLES.campaigns).delete().eq("id", id);
  if (error) throw error;
}
