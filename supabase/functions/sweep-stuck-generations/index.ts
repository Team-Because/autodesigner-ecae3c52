// Sweep-stuck-generations — cron-callable cleanup that marks any generation
// stuck in transient states for >15 minutes as `failed`. Prevents admin noise
// and lets History stop showing stale "processing" rows once they expire.
//
// Triggered by a pg_cron job (see migration). Idempotent — safe to call often.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions } from "../_shared/cors.ts";
import { jsonResponse } from "../_shared/http.ts";
import { serviceClient, verifyCronSecret } from "../_shared/auth.ts";

const STUCK_STATUSES = ["processing", "analyzing", "adapting", "generating"];
const STUCK_AFTER_MINUTES = 15;

serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const cronFail = verifyCronSecret(req);
    if (cronFail) return cronFail;

    const supabase = serviceClient();
    const cutoff = new Date(Date.now() - STUCK_AFTER_MINUTES * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("generations")
      .update({ status: "failed" })
      .in("status", STUCK_STATUSES)
      .lt("created_at", cutoff)
      .select("id");

    if (error) throw error;

    const swept = data?.length ?? 0;
    console.log(`Swept ${swept} stuck generation(s) older than ${STUCK_AFTER_MINUTES}min`);
    return jsonResponse({ ok: true, swept, cutoff });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("sweep-stuck-generations error:", msg);
    return jsonResponse({ ok: false, error: msg }, 500);
  }
});
