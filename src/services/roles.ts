import { supabase } from "@/integrations/supabase/client";

/**
 * Check whether a user holds a role. Backed by the `has_role` SECURITY DEFINER
 * function so it works without granting SELECT on `user_roles` to the caller.
 */
export async function hasRole(userId: string, role: "admin" | "user"): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: role,
  });
  if (error) return false;
  return !!data;
}
