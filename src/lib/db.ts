/**
 * Central place for backend identifiers and shared row types.
 * Prefer these over hardcoded table/bucket strings and hand-rolled shapes.
 */
import type { Database } from "@/integrations/supabase/types";

export const TABLES = {
  brands: "brands",
  brand_assets: "brand_assets",
  campaigns: "campaigns",
  generations: "generations",
  profiles: "profiles",
  user_credits: "user_credits",
  user_roles: "user_roles",
  activity_logs: "activity_logs",
  app_integrations: "app_integrations",
} as const;

export const BUCKETS = {
  brandAssets: "brand-assets",
} as const;

export const EDGE_FUNCTIONS = {
  generateCreative: "generate-creative",
  recoverGeneration: "recover-generation",
  brandAutofill: "brand-autofill",
  adminCreateUser: "admin-create-user",
  adminResetPassword: "admin-reset-password",
} as const;

type Tables = Database["public"]["Tables"];

export type Brand = Tables["brands"]["Row"];
export type BrandInsert = Tables["brands"]["Insert"];
export type BrandUpdate = Tables["brands"]["Update"];

export type BrandAsset = Tables["brand_assets"]["Row"];
export type BrandAssetInsert = Tables["brand_assets"]["Insert"];

export type Campaign = Tables["campaigns"]["Row"];
export type CampaignInsert = Tables["campaigns"]["Insert"];

export type Generation = Tables["generations"]["Row"];
export type GenerationInsert = Tables["generations"]["Insert"];
export type GenerationUpdate = Tables["generations"]["Update"];

export type Profile = Tables["profiles"]["Row"];
export type UserCredits = Tables["user_credits"]["Row"];
