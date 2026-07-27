import { supabase } from "@/integrations/supabase/client";
import { TABLES, type Brand, type Campaign, type Profile, type UserCredits } from "@/lib/db";

/**
 * Admin-only queries. All of these depend on RLS policies that allow
 * `has_role(auth.uid(), 'admin')` — the client-side `useIsAdmin` gate is a
 * UX affordance, not a security boundary.
 */

export type AdminBrand = Brand;
export type AdminProfile = Profile;
export type AdminCampaign = Campaign;
export type AdminCredits = UserCredits;

export interface AdminGenerationSummary {
  id: string;
  user_id: string;
  brand_id: string;
  status: string;
  created_at: string;
}

export async function adminListProfiles(): Promise<AdminProfile[]> {
  const { data, error } = await supabase.from(TABLES.profiles).select("*");
  if (error) throw error;
  return data ?? [];
}

export async function adminListAllBrands(minimal = false): Promise<AdminBrand[]> {
  const columns = minimal ? "id, name, user_id" : "*";
  const { data, error } = await supabase
    .from(TABLES.brands)
    .select(columns)
    .order("name");
  if (error) throw error;
  return (data as unknown as AdminBrand[]) ?? [];
}

export async function adminListAllCampaigns(): Promise<AdminCampaign[]> {
  const { data, error } = await supabase
    .from(TABLES.campaigns)
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function adminListAllGenerations(): Promise<AdminGenerationSummary[]> {
  const { data, error } = await supabase
    .from(TABLES.generations)
    .select("id, user_id, brand_id, status, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as AdminGenerationSummary[]) ?? [];
}

export async function adminListAllCredits(): Promise<AdminCredits[]> {
  const { data, error } = await supabase.from(TABLES.user_credits).select("*");
  if (error) throw error;
  return data ?? [];
}

/**
 * Transfer a single brand + its assets + its generation history to another user.
 * Not atomic across tables — best used from an admin surface where partial
 * completion is recoverable manually. A future SECURITY DEFINER RPC would
 * make this transactional (mirrors `merge_brand`).
 */
export async function transferBrandToUser(brandId: string, targetUserId: string): Promise<void> {
  const { error } = await supabase
    .from(TABLES.brands)
    .update({ user_id: targetUserId })
    .eq("id", brandId);
  if (error) throw error;

  await supabase
    .from(TABLES.brand_assets)
    .update({ user_id: targetUserId })
    .eq("brand_id", brandId);
  await supabase
    .from(TABLES.generations)
    .update({ user_id: targetUserId })
    .eq("brand_id", brandId);
}

/**
 * Transfer an entire campaign (group) + all brands within + their assets + generations.
 * Same non-atomic caveat as `transferBrandToUser`.
 */
export async function transferCampaignToUser(
  campaignId: string,
  brandIds: string[],
  targetUserId: string,
): Promise<void> {
  const { error } = await supabase
    .from(TABLES.campaigns)
    .update({ user_id: targetUserId })
    .eq("id", campaignId);
  if (error) throw error;

  for (const brandId of brandIds) {
    await transferBrandToUser(brandId, targetUserId);
  }
}
