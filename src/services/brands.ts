import { supabase } from "@/integrations/supabase/client";
import { TABLES, type Brand } from "@/lib/db";

export async function listMyBrands(opts: { activeOnly?: boolean } = {}): Promise<Brand[]> {
  let query = supabase.from(TABLES.brands).select("*").order("created_at", { ascending: false });
  if (opts.activeOnly) query = query.eq("archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listMyActiveBrandsMinimal(): Promise<
  Pick<Brand, "id" | "name">[]
> {
  const { data, error } = await supabase
    .from(TABLES.brands)
    .select("id, name")
    .eq("archived", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function archiveBrand(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.brands)
    .update({ archived: true })
    .eq("id", id);
  if (error) throw error;
}

export async function unarchiveBrand(id: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.brands)
    .update({ archived: false })
    .eq("id", id);
  if (error) throw error;
}

export async function setBrandCampaign(brandId: string, campaignId: string | null): Promise<void> {
  const { error } = await supabase
    .from(TABLES.brands)
    .update({ campaign_id: campaignId })
    .eq("id", brandId);
  if (error) throw error;
}
