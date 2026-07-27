/**
 * Shared CORS headers for every edge function.
 *
 * NOTE: This is a hand-written copy of the standard shape (not the npm import
 * from `@supabase/supabase-js/cors`) because our functions want the same
 * header list — including the extended `x-supabase-client-*` headers we've
 * seen in the wild — regardless of SDK version.
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version, " +
    "x-cron-secret",
} as const;

export function handleOptions(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}
