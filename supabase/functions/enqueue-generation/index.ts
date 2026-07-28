// enqueue-generation
// -----------------------------------------------------------------------------
// Accepts an *external* image URL from the browser extension (or any client),
// downloads it, stores it in the `brand-assets` bucket, creates a `generations`
// row, and fires `generate-creative` in the background. Returns the new
// generationId immediately so the caller can close their tab / popup without
// interrupting the job.
// -----------------------------------------------------------------------------
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { jsonResponse, errorResponse } from "../_shared/http.ts";
import { verifyUser, serviceClient } from "../_shared/auth.ts";
import { isSafePublicHttpsUrl } from "../_shared/ssrf.ts";

const FORMAT_SPECS: Record<string, { width: number; height: number; aspectRatio: string }> = {
  landscape: { width: 1920, height: 1080, aspectRatio: "16:9" },
  square:    { width: 1080, height: 1080, aspectRatio: "1:1" },
  story:     { width: 1080, height: 1920, aspectRatio: "9:16" },
  portrait:  { width: 1080, height: 1350, aspectRatio: "4:5" },
};

const ALLOWED_MIME = new Set([
  "image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif",
]);
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB
const DOWNLOAD_TIMEOUT_MS = 20_000;

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":  return "png";
    case "image/webp": return "webp";
    case "image/gif":  return "gif";
    default:           return "jpg";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST")    return errorResponse("Method not allowed", 405);

  try {
    const authed = await verifyUser(req);
    if (authed instanceof Response) return authed;
    const { userId } = authed;

    const body = await req.json().catch(() => ({} as any));
    const brandId = String(body?.brandId || "").trim();
    const imageUrl = String(body?.referenceImageUrl || body?.imageUrl || "").trim();
    const outputFormat = String(body?.outputFormat || "square").trim().toLowerCase();

    if (!brandId || !/^[0-9a-f-]{36}$/i.test(brandId)) {
      return errorResponse("brandId is required", 400);
    }
    if (!imageUrl) return errorResponse("referenceImageUrl is required", 400);
    if (!FORMAT_SPECS[outputFormat]) return errorResponse("Invalid outputFormat", 400);
    if (!isSafePublicHttpsUrl(imageUrl)) {
      return errorResponse("referenceImageUrl must be a public https URL", 400);
    }

    const spec = FORMAT_SPECS[outputFormat];
    const svc = serviceClient();

    // Confirm brand ownership (or admin).
    const { data: brand, error: brandErr } = await svc
      .from("brands").select("id, user_id").eq("id", brandId).maybeSingle();
    if (brandErr || !brand) return errorResponse("Brand not found", 404);
    if (brand.user_id !== userId) {
      const { data: adminRow } = await svc
        .from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (!adminRow) return errorResponse("Forbidden", 403);
    }

    // Download the external image.
    let bytes: Uint8Array;
    let mime: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
      const dl = await fetch(imageUrl, {
        signal: controller.signal,
        headers: { "User-Agent": "BDesign-Extension/1.2 (+https://autodesigner.lovable.app)" },
        redirect: "follow",
      }).finally(() => clearTimeout(timer));
      if (!dl.ok) return errorResponse(`Could not fetch image (${dl.status})`, 400);
      mime = (dl.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
      if (!ALLOWED_MIME.has(mime)) {
        // Try to infer from URL extension as a fallback.
        const urlExt = imageUrl.split("?")[0].split(".").pop()?.toLowerCase();
        if (urlExt && ["png","jpg","jpeg","webp","gif"].includes(urlExt)) {
          mime = urlExt === "jpg" ? "image/jpeg" : `image/${urlExt}`;
        } else {
          return errorResponse("Unsupported image type (png/jpeg/webp/gif only)", 415);
        }
      }
      const buf = await dl.arrayBuffer();
      if (buf.byteLength > MAX_IMAGE_BYTES) {
        return errorResponse("Image too large (max 25MB)", 413);
      }
      bytes = new Uint8Array(buf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return errorResponse(`Failed to fetch image: ${msg}`, 400);
    }

    // Upload to brand-assets/<user_id>/ref-<uuid>.<ext>
    const refPath = `${userId}/ref-${crypto.randomUUID()}.${extFromMime(mime)}`;
    const { error: upErr } = await svc.storage.from("brand-assets").upload(refPath, bytes, {
      contentType: mime,
      upsert: false,
    });
    if (upErr) {
      console.error("upload failed:", upErr);
      return errorResponse("Failed to store reference image", 500);
    }
    const { data: pub } = svc.storage.from("brand-assets").getPublicUrl(refPath);
    const storageUrl = pub.publicUrl;

    // Insert the generations row (status="processing" — same convention Studio uses).
    const { data: gen, error: insErr } = await svc
      .from("generations")
      .insert({
        user_id: userId,
        brand_id: brandId,
        reference_image_url: storageUrl,
        status: "processing",
        output_format: outputFormat,
        requested_aspect_ratio: spec.aspectRatio,
        requested_width: spec.width,
        requested_height: spec.height,
      } as any)
      .select("id")
      .single();
    if (insErr || !gen) {
      console.error("generation insert failed:", insErr);
      return errorResponse("Failed to create generation record", 500);
    }
    const generationId = gen.id as string;

    // Fire-and-forget invoke of generate-creative. It runs the pipeline in its
    // own EdgeRuntime.waitUntil, so it survives the caller closing their tab.
    // We forward the caller's Authorization header so generate-creative's auth
    // check + ownership check pass.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const authHeader  = req.headers.get("Authorization") || "";
    const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

    const kickoff = fetch(`${supabaseUrl}/functions/v1/generate-creative`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
        apikey: anonKey,
      },
      body: JSON.stringify({
        brandId,
        referenceImageUrl: storageUrl,
        generationId,
        outputFormat,
      }),
    }).then(async (r) => {
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        console.error(`[enqueue] generate-creative kickoff non-2xx ${r.status}: ${txt}`);
      }
    }).catch((e) => {
      console.error("[enqueue] generate-creative kickoff error:", e);
    });

    // @ts-ignore — EdgeRuntime provided by Supabase edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(kickoff);
    }

    return jsonResponse({ status: "queued", generationId }, 202);
  } catch (e) {
    console.error("enqueue-generation OUTER error:", e);
    return errorResponse(e instanceof Error ? e.message : "Unknown error", 500);
  }
});
