import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { errorResponse } from "./http.ts";

/**
 * Build a Supabase client that acts as the CALLER (RLS-enforced). Uses the
 * anon key + the caller's bearer token, so `auth.getUser()` returns the real
 * user and any DB reads are subject to RLS.
 */
export function callerClient(req: Request): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const authHeader = req.headers.get("Authorization") || "";
  return createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
}

/**
 * Build a Supabase client with the service-role key. Bypasses RLS.
 * ONLY use after a caller has been authenticated + authorized.
 */
export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

export interface AuthedCaller {
  userId: string;
  client: SupabaseClient;
}

/**
 * Verify the caller's JWT. Returns { userId, client } on success or a ready-to-send
 * 401 Response on failure. The client is the caller-scoped one so subsequent
 * calls run under RLS.
 */
export async function verifyUser(req: Request): Promise<AuthedCaller | Response> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return errorResponse("Unauthorized", 401);
  }
  const client = callerClient(req);
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return errorResponse("Unauthorized", 401);
  return { userId: data.user.id, client };
}

/**
 * Verify the caller AND require them to hold the `admin` role.
 * Returns a 403 Response if they don't.
 */
export async function requireAdmin(req: Request): Promise<AuthedCaller | Response> {
  const authed = await verifyUser(req);
  if (authed instanceof Response) return authed;
  const { data: hasAdmin } = await authed.client.rpc("has_role", {
    _user_id: authed.userId,
    _role: "admin",
  });
  if (!hasAdmin) return errorResponse("Forbidden: admin role required", 403);
  return authed;
}

/**
 * Verify a shared cron secret from the `x-cron-secret` header. Used by
 * pg_cron-triggered functions where there is no JWT.
 */
export function verifyCronSecret(req: Request): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return errorResponse("CRON_SECRET not configured", 500);
  const provided = req.headers.get("x-cron-secret") || "";
  if (provided !== expected) return errorResponse("Unauthorized", 401);
  return null;
}
