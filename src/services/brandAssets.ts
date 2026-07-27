import { supabase } from "@/integrations/supabase/client";
import { TABLES } from "@/lib/db";

export type BrandAssetCounts = Record<string, { total: number; tagged: number }>;

/**
 * Aggregates per-brand asset counts. A label of "" or "Other:" is considered untagged.
 */
export async function listMyBrandAssetCounts(): Promise<BrandAssetCounts> {
  const { data, error } = await supabase
    .from(TABLES.brand_assets)
    .select("brand_id, label");
  if (error) throw error;

  const counts: BrandAssetCounts = {};
  for (const a of (data ?? []) as { brand_id: string; label: string | null }[]) {
    if (!counts[a.brand_id]) counts[a.brand_id] = { total: 0, tagged: 0 };
    counts[a.brand_id].total++;
    if (a.label && a.label !== "Other:") counts[a.brand_id].tagged++;
  }
  return counts;
}
