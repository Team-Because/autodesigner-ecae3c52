// recover-generation — finalize a generations row whose background worker
// died during Kie's long image-generation poll (4–6 min for GPT Image 2 @ 2K).
//
// Flow:
//   1. Read generations row by id, ensure user owns it (or is admin).
//   2. If row is already completed/failed, return current state.
//   3. Otherwise read kie_task_id and call Kie's recordInfo *once*.
//      - state=success → download image, upload to storage, mark completed,
//        deduct 1 credit (idempotent: only if not already deducted).
//      - state=fail    → mark failed.
//      - else          → return { status: "still_processing" }.
//
// Designed to be tiny and quick (< 30s) so it never hits the edge timeout.
// The Studio client calls this every ~15s as a fallback while the realtime
// channel + initial poll are still running.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const KIE_TASK_STATUS = "https://api.kie.ai/api/v1/jobs/recordInfo";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { generationId } = await req.json();
    if (!generationId) {
      return json({ error: "generationId is required" }, 400);
    }

    const apiKey = Deno.env.get("KIE_API_KEY");
    if (!apiKey) return json({ error: "KIE_API_KEY not configured" }, 500);

    // Use service-role to bypass RLS — we still verify ownership below.
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Auth: who is calling?
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    let callerId: string | null = null;
    if (token) {
      const { data: u } = await supabase.auth.getUser(token);
      callerId = u?.user?.id ?? null;
    }

    const { data: gen, error: genErr } = await supabase
      .from("generations")
      .select("id, user_id, status, kie_task_id, output_image_url, copywriting, requested_aspect_ratio, output_format")
      .eq("id", generationId)
      .maybeSingle();

    if (genErr || !gen) return json({ error: "Generation not found" }, 404);

    // Ownership check (admin can also recover)
    if (callerId && gen.user_id !== callerId) {
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
      if (!roleRow) return json({ error: "Forbidden" }, 403);
    }

    if (gen.status === "completed") {
      return json({ status: "completed", imageUrl: gen.output_image_url, copywriting: gen.copywriting });
    }
    if (gen.status === "failed") {
      return json({ status: "failed" });
    }
    if (!gen.kie_task_id) {
      return json({ status: "still_processing", reason: "no_task_id_yet" });
    }

    // Single status check — fast call, no looping.
    const statusRes = await fetch(`${KIE_TASK_STATUS}?taskId=${gen.kie_task_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) {
      const txt = await statusRes.text().catch(() => "");
      console.warn(`Kie status ${statusRes.status} for ${gen.kie_task_id}: ${txt}`);
      return json({ status: "still_processing", reason: "kie_status_unavailable" });
    }

    const statusData = await statusRes.json();
    const state = statusData?.data?.state;

    if (state === "fail") {
      const failMsg = statusData?.data?.failMsg || "Unknown failure";
      console.warn(`Kie task ${gen.kie_task_id} failed: ${failMsg}`);
      await supabase.from("generations").update({ status: "failed" }).eq("id", generationId);
      return json({ status: "failed", error: failMsg });
    }

    if (state !== "success") {
      return json({ status: "still_processing", state });
    }

    // Pull result URL
    const rj = statusData.data.resultJson;
    let urls: string[] = [];
    if (typeof rj === "string") {
      try { urls = JSON.parse(rj).resultUrls || []; } catch {}
    } else if (rj?.resultUrls) {
      urls = rj.resultUrls;
    }
    if (urls.length === 0) {
      return json({ status: "still_processing", reason: "success_no_urls_yet" });
    }

    // Download image bytes
    const imgRes = await fetch(urls[0], { signal: AbortSignal.timeout(45000) });
    if (!imgRes.ok) return json({ error: "Failed to download generated image" }, 500);
    const imageBytes = new Uint8Array(await imgRes.arrayBuffer());

    // Upload to storage (same path the main pipeline uses — upsert for idempotency)
    const outputPath = `generations/${generationId}.png`;
    const { error: upErr } = await supabase.storage
      .from("brand-assets")
      .upload(outputPath, imageBytes, { contentType: "image/png", upsert: true });
    if (upErr) return json({ error: `Upload failed: ${upErr.message}` }, 500);

    const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(outputPath);

    // Preserve any caption already produced by the Adapt step.
    const cw = (gen.copywriting && typeof gen.copywriting === "object")
      ? gen.copywriting as Record<string, unknown>
      : {};

    const { error: updErr } = await supabase
      .from("generations")
      .update({
        output_image_url: pub.publicUrl,
        copywriting: cw,
        status: "completed",
      })
      .eq("id", generationId);
    if (updErr) console.error("Final update failed:", updErr);

    // Deduct credit only if this row hadn't been completed already.
    // (status was processing when we started, so this is the canonical completion event.)
    try {
      await supabase.rpc("deduct_credit", { _user_id: gen.user_id });
    } catch (e) {
      console.warn("Credit deduction failed (non-blocking):", e);
    }

    console.log(`recover-generation: completed ${generationId} via task ${gen.kie_task_id}`);
    return json({ status: "completed", imageUrl: pub.publicUrl, copywriting: cw });
  } catch (e) {
    console.error("recover-generation error:", e);
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
