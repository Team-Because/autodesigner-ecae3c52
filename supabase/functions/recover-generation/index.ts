// recover-generation — finalize a generations row whose background worker
// died during Kie's long image-generation poll (4–6 min for GPT Image 2 @ 2K).
//
// Flow:
//   1. Verify caller JWT.
//   2. Read generations row by id, ensure caller owns it (or is admin).
//   3. If row is already completed/failed, return current state.
//   4. Otherwise read kie_task_id and call Kie's recordInfo *once*.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";
import { verifyUser, serviceClient } from "../_shared/auth.ts";

const KIE_TASK_STATUS = "https://api.kie.ai/api/v1/jobs/recordInfo";

serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  try {
    const { generationId } = await req.json();
    if (!generationId) return errorResponse("generationId is required", 400);

    const apiKey = Deno.env.get("KIE_API_KEY");
    if (!apiKey) return errorResponse("KIE_API_KEY not configured", 500);

    // REQUIRE a bearer token. Without this, anonymous callers could
    // recover/complete any generation they know the ID of and deduct credits.
    const authed = await verifyUser(req);
    if (authed instanceof Response) return authed;
    const callerId = authed.userId;

    // Use service-role for the actual work — we already verified ownership below.
    const supabase = serviceClient();

    const { data: gen, error: genErr } = await supabase
      .from("generations")
      .select("id, user_id, status, kie_task_id, output_image_url, copywriting, requested_aspect_ratio, output_format")
      .eq("id", generationId)
      .maybeSingle();

    if (genErr || !gen) return errorResponse("Generation not found", 404);

    // Ownership check (admin can also recover)
    if (gen.user_id !== callerId) {
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
      if (!roleRow) return errorResponse("Forbidden", 403);
    }

    if (gen.status === "completed") {
      return jsonResponse({ status: "completed", imageUrl: gen.output_image_url, copywriting: gen.copywriting });
    }
    if (gen.status === "failed") {
      return jsonResponse({ status: "failed" });
    }
    if (!gen.kie_task_id) {
      return jsonResponse({ status: "still_processing", reason: "no_task_id_yet" });
    }

    // Single status check — fast call, no looping.
    const statusRes = await fetch(`${KIE_TASK_STATUS}?taskId=${gen.kie_task_id}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) {
      const txt = await statusRes.text().catch(() => "");
      console.warn(`Kie status ${statusRes.status} for ${gen.kie_task_id}: ${txt}`);
      return jsonResponse({ status: "still_processing", reason: "kie_status_unavailable" });
    }

    const statusData = await statusRes.json();
    const state = statusData?.data?.state;

    if (state === "fail") {
      const failMsg = statusData?.data?.failMsg || "Unknown failure";
      console.warn(`Kie task ${gen.kie_task_id} failed: ${failMsg}`);
      await supabase.from("generations").update({ status: "failed" }).eq("id", generationId);
      return jsonResponse({ status: "failed", error: failMsg });
    }

    if (state !== "success") {
      return jsonResponse({ status: "still_processing", state });
    }

    const rj = statusData.data.resultJson;
    let urls: string[] = [];
    if (typeof rj === "string") {
      try { urls = JSON.parse(rj).resultUrls || []; } catch { /* not JSON */ }
    } else if (rj?.resultUrls) {
      urls = rj.resultUrls;
    }
    if (urls.length === 0) {
      return jsonResponse({ status: "still_processing", reason: "success_no_urls_yet" });
    }

    const imgRes = await fetch(urls[0], { signal: AbortSignal.timeout(45000) });
    if (!imgRes.ok) return errorResponse("Failed to download generated image", 500);
    const imageBytes = new Uint8Array(await imgRes.arrayBuffer());

    const outputPath = `generations/${generationId}.png`;
    const { error: upErr } = await supabase.storage
      .from("brand-assets")
      .upload(outputPath, imageBytes, { contentType: "image/png", upsert: true });
    if (upErr) return errorResponse(`Upload failed: ${upErr.message}`, 500);

    const { data: pub } = supabase.storage.from("brand-assets").getPublicUrl(outputPath);

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

    try {
      await supabase.rpc("deduct_credit", { _user_id: gen.user_id });
    } catch (e) {
      console.warn("Credit deduction failed (non-blocking):", e);
    }

    console.log(`recover-generation: completed ${generationId} via task ${gen.kie_task_id}`);
    return jsonResponse({ status: "completed", imageUrl: pub.publicUrl, copywriting: cw });
  } catch (e) {
    console.error("recover-generation error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return errorResponse(msg, 500);
  }
});
