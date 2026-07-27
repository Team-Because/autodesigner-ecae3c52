import { supabase } from "@/integrations/supabase/client";
import { TABLES, type Brand, type BrandInsert } from "@/lib/db";

export async function listMyBrands(opts: { activeOnly?: boolean } = {}): Promise<Brand[]> {
  let query = supabase.from(TABLES.brands).select("*").order("created_at", { ascending: false });
  if (opts.activeOnly) query = query.eq("archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listMyActiveBrandsMinimal(): Promise<Pick<Brand, "id" | "name">[]> {
  const { data, error } = await supabase
    .from(TABLES.brands)
    .select("id, name")
    .eq("archived", false)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getBrand(id: string): Promise<Brand> {
  const { data, error } = await supabase
    .from(TABLES.brands)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
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

/**
 * Atomically merges creatives from source into destination and archives source.
 * Runs entirely inside a SECURITY DEFINER RPC to prevent partial-state races.
 */
export async function mergeBrand(
  sourceBrandId: string,
  destinationBrandId: string,
): Promise<{ creatives_transferred: number }> {
  const { data, error } = await supabase.rpc("merge_brand", {
    _source_brand_id: sourceBrandId,
    _destination_brand_id: destinationBrandId,
  });
  if (error) throw error;
  const transferred = (data as { creatives_transferred?: number } | null)?.creatives_transferred ?? 0;
  return { creatives_transferred: transferred };
}

/**
 * Duplicates a brand and its assets. Returns the newly created brand row.
 * Requires the caller's user id — kept explicit so the service is unit-testable.
 */
export async function duplicateBrand(brandId: string, userId: string): Promise<Brand> {
  const { data: original, error: fetchErr } = await supabase
    .from(TABLES.brands)
    .select("*")
    .eq("id", brandId)
    .single();
  if (fetchErr || !original) throw new Error("Failed to fetch brand");

  const insertPayload: BrandInsert = {
    name: `${original.name} (Copy)`,
    user_id: userId,
    logo_url: original.logo_url,
    primary_color: original.primary_color,
    secondary_color: original.secondary_color,
    extra_colors: original.extra_colors,
    brand_voice_rules: original.brand_voice_rules,
    negative_prompts: original.negative_prompts,
    brand_brief: original.brand_brief,
    campaign_id: original.campaign_id,
  };

  const { data: newBrand, error: insertErr } = await supabase
    .from(TABLES.brands)
    .insert(insertPayload)
    .select()
    .single();
  if (insertErr || !newBrand) throw new Error("Failed to duplicate brand");

  const { data: originalAssets } = await supabase
    .from(TABLES.brand_assets)
    .select("image_url, label")
    .eq("brand_id", brandId);

  if (originalAssets && originalAssets.length > 0) {
    const assetCopies = originalAssets.map((a) => ({
      brand_id: newBrand.id,
      user_id: userId,
      image_url: a.image_url,
      label: a.label ?? "",
    }));
    await supabase.from(TABLES.brand_assets).insert(assetCopies);
  }

  return newBrand;
}

export async function countBrandGenerations(brandId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLES.generations)
    .select("id", { count: "exact", head: true })
    .eq("brand_id", brandId);
  if (error) throw error;
  return count ?? 0;
}
