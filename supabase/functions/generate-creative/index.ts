import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FORMAT_SPECS: Record<string, { width: number; height: number; label: string; aspectRatio: string }> = {
  landscape: { width: 1920, height: 1080, label: "landscape (1920×1080)", aspectRatio: "16:9" },
  square: { width: 1080, height: 1080, label: "square (1080×1080)", aspectRatio: "1:1" },
  story: { width: 1080, height: 1920, label: "portrait/story (1080×1920)", aspectRatio: "9:16" },
  portrait: { width: 1080, height: 1350, label: "portrait (1080×1350, 4:5)", aspectRatio: "4:5" },
};

// ─── kie.ai API configuration ───
const KIE_API_BASE = "https://api.kie.ai";
const KIE_CHAT_BASE = `${KIE_API_BASE}/gemini-3-flash/v1/chat/completions`;
// Thinking model — secondary framework fallback if stable flash cannot parse the reference
const KIE_THINKING_CHAT_BASE = `${KIE_API_BASE}/gemini-3-pro/v1/chat/completions`;
// GPT 5.5 Responses API — used for the Adapt Directive reasoning stage
const KIE_RESPONSES_BASE = `${KIE_API_BASE}/codex/v1/responses`;
const KIE_CREATE_TASK = `${KIE_API_BASE}/api/v1/jobs/createTask`;
const KIE_TASK_STATUS = `${KIE_API_BASE}/api/v1/jobs/recordInfo`;

// Reasoning stages must stay short so the background worker reaches image-render
// before the edge runtime kills the job. Kie remains primary, but slow chat
// calls now fail fast into Lovable AI instead of consuming 4–6 minutes in retries.
const KIE_REASONING_TIMEOUT_MS = 45000;
const LOVABLE_REASONING_TIMEOUT_MS = 60000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function throwIfKieApiError(payload: any) {
  const code = Number(payload?.code);
  const message = String(payload?.msg || payload?.message || "");
  if (code === 402 || /credit|balance|top up|insufficient/i.test(message)) {
    throw new Error("CREDITS_EXHAUSTED");
  }
  if (code === 429 || /rate limit|too many/i.test(message)) {
    throw new Error("KIE_RATE_LIMITED");
  }
  if (payload && payload.code !== undefined && code !== 200 && code !== 0) {
    throw new Error(message || `kie.ai API error (${payload.code})`);
  }
}

// Extract width/height from PNG header bytes (first 24 bytes contain IHDR)
function extractPngDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  if (bytes[0] !== 137 || bytes[1] !== 80 || bytes[2] !== 78 || bytes[3] !== 71) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(16, false);
  const height = view.getUint32(20, false);
  return { width, height };
}

// Also support JPEG dimension extraction
function extractJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xFF || bytes[1] !== 0xD8) return null;
  let offset = 2;
  while (offset < bytes.length - 1) {
    if (bytes[offset] !== 0xFF) break;
    const marker = bytes[offset + 1];
    if (marker === 0xC0 || marker === 0xC2) {
      if (offset + 9 < bytes.length) {
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const height = view.getUint16(offset + 5, false);
        const width = view.getUint16(offset + 7, false);
        return { width, height };
      }
      break;
    }
    if (offset + 3 >= bytes.length) break;
    const segLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 2 + segLen;
  }
  return null;
}

function extractImageDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  return extractPngDimensions(bytes) || extractJpegDimensions(bytes);
}

function isAspectRatioMatch(
  actual: { width: number; height: number },
  requested: { width: number; height: number },
  tolerance = 0.05
): boolean {
  const expectedRatio = requested.width / requested.height;
  const actualRatio = actual.width / actual.height;
  return Math.abs(actualRatio - expectedRatio) / expectedRatio <= tolerance;
}

// ─── Fixed vocabulary for zone normalization ───
const NORM_ZONE_MAP: Record<string, string> = {
  logo: "brand_mark", brand_logo: "brand_mark", secondary_logo: "brand_mark",
  partner_logo: "brand_mark", logo_zone: "brand_mark", brand_mark: "brand_mark",
  headline: "headline", title: "headline", main_headline: "headline",
  headline_text: "headline", primary_text: "headline",
  subtext: "subcopy", subcopy: "subcopy", body_text: "subcopy", body: "subcopy",
  description: "subcopy", supporting_text: "subcopy", sub_headline: "subcopy",
  hero_image: "hero_visual", hero: "hero_visual", main_image: "hero_visual",
  product_image: "hero_visual", hero_visual: "hero_visual", primary_visual: "hero_visual",
  architecture: "hero_visual", render: "hero_visual", "3d_render": "hero_visual",
  supporting_image: "supporting_visual", secondary_image: "supporting_visual",
  supporting_visual: "supporting_visual", lifestyle_image: "supporting_visual",
  info_strip: "info_strip", details: "info_strip", information: "info_strip",
  event_details: "info_strip", event_details_card: "info_strip", info_grid: "info_strip",
  contact_info: "info_strip", details_card: "info_strip",
  cta: "cta", cta_button: "cta", button: "cta", call_to_action: "cta",
  footer: "footer", footer_bar: "footer", disclaimer: "footer", legal: "footer",
  background: "background", bg: "background", overlay: "background",
  accent: "accent", accent_strip: "accent", divider: "accent", separator: "accent",
  tagline: "accent", tag: "accent",
};

function normalizeZoneName(name: string): string {
  const key = name.toLowerCase().replace(/[\s-]+/g, "_").replace(/[^a-z0-9_]/g, "");
  return NORM_ZONE_MAP[key] || "accent";
}

function isValidFramework(fw: unknown): fw is Record<string, unknown> {
  if (!fw || typeof fw !== "object" || Array.isArray(fw)) return false;
  const f = fw as Record<string, any>;
  const hasLayout =
    f.layout && typeof f.layout === "object" && Array.isArray(f.layout.zones) && f.layout.zones.length > 0;
  const hasText = Array.isArray(f.text_elements);
  const hasNotes = typeof f.composition_notes === "string";
  const hasStyle = f.style && typeof f.style === "object";
  return Boolean(hasLayout && hasText && hasNotes && hasStyle);
}

function parseStoredFramework(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return isValidFramework(parsed) ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return isValidFramework(value) ? (value as Record<string, unknown>) : null;
}

function ensureFrameworkShape(fw: unknown): Record<string, unknown> {
  const base: Record<string, any> =
    fw && typeof fw === "object" && !Array.isArray(fw) ? { ...(fw as Record<string, any>) } : {};
  if (!base.layout || typeof base.layout !== "object" || Array.isArray(base.layout)) {
    base.layout = { orientation: "portrait", zones: [] };
  } else {
    base.layout = { ...base.layout };
    if (!Array.isArray(base.layout.zones)) base.layout.zones = [];
    if (typeof base.layout.orientation !== "string") base.layout.orientation = "portrait";
  }
  if (!base.style || typeof base.style !== "object" || Array.isArray(base.style)) {
    base.style = {
      background_type: "solid",
      photography_style: "none",
      overlay: "none",
      mood: "neutral",
      color_scheme: "brand palette",
    };
  }
  if (!Array.isArray(base.text_elements)) base.text_elements = [];
  if (typeof base.composition_notes !== "string") base.composition_notes = "";
  return base;
}

function sanitizeFramework(fw: Record<string, unknown> | null | undefined): Record<string, unknown> {
  // Defensive: never throw, even if the caller passes null/undefined/partial data.
  if (!fw || typeof fw !== "object" || Array.isArray(fw)) {
    console.warn("[sanitizeFramework] received invalid framework — using empty shell");
    fw = {} as Record<string, unknown>;
  }
  const safe = ensureFrameworkShape(fw);
  const clean = JSON.parse(JSON.stringify(safe));

  if (clean.layout?.zones && Array.isArray(clean.layout.zones)) {
    for (const zone of clean.layout.zones) {
      if (!zone || typeof zone !== "object") continue;
      if (zone.name) zone.name = normalizeZoneName(zone.name);
      if (zone.description) {
        const norm = zone.name || "accent";
        const descMap: Record<string, string> = {
          brand_mark: "brand logo placement zone",
          headline: "primary headline text zone",
          subcopy: "supporting text zone",
          hero_visual: "primary visual / imagery zone",
          supporting_visual: "secondary visual element zone",
          info_strip: "information strip with key details",
          cta: "call-to-action button or strip",
          footer: "footer / legal zone",
          background: "background zone",
          accent: "design accent element",
        };
        zone.description = descMap[norm] || "design element zone";
      }
    }
  }

  if (clean.text_elements && Array.isArray(clean.text_elements)) {
    for (const te of clean.text_elements) {
      if (!te || typeof te !== "object") continue;
      delete te.content_description;
      if (te.type) {
        const t = String(te.type).toLowerCase();
        if (/headline|title/.test(t)) te.type = "headline";
        else if (/sub/.test(t)) te.type = "subcopy";
        else if (/cta|button/.test(t)) te.type = "cta";
        else if (/tag/.test(t)) te.type = "tagline";
        else if (/price|offer/.test(t)) te.type = "detail";
        else if (/disclaim|legal/.test(t)) te.type = "footer";
      }
    }
  }

  if (typeof clean.composition_notes === "string") {
    clean.composition_notes = clean.composition_notes
      .replace(/"[^"]*"/g, '"[text]"')
      .replace(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g, "[brand]")
      .replace(/\b[A-Z]{3,}\b/g, "[brand]")
      .replace(/\b[A-Z]{3}\s*[\d,.]+[MKBmkb]?\b/g, "[price]")
      .replace(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:sq\.?\s*(?:ft|yds?|m)|acres?)\b/gi, "[size]")
      .replace(/\b\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi, "[date]")
      .replace(/\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/gi, "[day]")
      .replace(/\+?\d[\d\s-]{7,}\d/g, "[phone]")
      .replace(/https?:\/\/\S+/g, "[url]")
      .replace(/www\.\S+/g, "[url]");
  }

  return clean;
}

function extractStoredCaption(copywriting: unknown): string {
  if (typeof copywriting === "string") return copywriting.trim();
  if (!copywriting || typeof copywriting !== "object") return "";
  const caption = (copywriting as Record<string, unknown>).caption;
  return typeof caption === "string" ? caption.trim() : "";
}

function toCompactText(value: unknown, maxChars: number): string {
  if (typeof value !== "string") return "";
  // Preserve newlines so list items / multi-line sections (e.g. EXAMPLE COPY)
  // remain visually distinct to the LLM. Only collapse horizontal whitespace
  // and limit runs of blank lines.
  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return normalized.slice(0, maxChars);
}

// Extract the "## EXAMPLE COPY" section from a brand brief blob.
// Returns the raw inner text (preserving line breaks between distinct entries).
function extractExampleCopy(brief: string | null | undefined): string {
  if (!brief || !brief.trim()) return "";
  const m = brief.match(/##\s*EXAMPLE COPY\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  return m ? m[1].trim() : "";
}

// ─── kie.ai Chat API helper (OpenAI-compatible) ───
async function kieChat(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs = 60000,
  endpoint: string = KIE_CHAT_BASE,
): Promise<any> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`kie.ai chat error ${response.status} (${endpoint}):`, errText);
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (response.status === 429) throw new Error("KIE_RATE_LIMITED");
    throw new Error(`kie.ai chat failed (${response.status})`);
  }

  const data = await response.json();
  throwIfKieApiError(data);
  return data;
}

// ─── kie.ai Responses API helper (OpenAI Responses schema, e.g. GPT-5.5) ───
async function kieResponses(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs = 120000,
): Promise<any> {
  const response = await fetch(KIE_RESPONSES_BASE, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stream: false, ...body }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`kie.ai responses error ${response.status}:`, errText);
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (response.status === 429) throw new Error("KIE_RATE_LIMITED");
    throw new Error(`kie.ai responses failed (${response.status})`);
  }

  const data = await response.json();
  throwIfKieApiError(data);
  return data;
}

// ─── Lovable AI Gateway fallback (same OpenAI-compatible schema) ───
// Used ONLY when kie.ai chat endpoint fails / times out. Keeps kie primary
// for cost; Lovable AI is the resilience net so the reasoning stages never
// silently degrade to a generic hardcoded template.
const LOVABLE_CHAT_BASE = "https://ai.gateway.lovable.dev/v1/chat/completions";
async function lovableChat(
  body: Record<string, unknown>,
  timeoutMs = 90000,
  model = "google/gemini-2.5-pro"
): Promise<any> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableKey) throw new Error("LOVABLE_API_KEY not configured");
  const payload = { model, ...body };
  const response = await fetch(LOVABLE_CHAT_BASE, {
    method: "POST",
    headers: {
      "Lovable-API-Key": lovableKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    console.error(`Lovable AI fallback error ${response.status}:`, errText);
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (response.status === 429) throw new Error("LOVABLE_RATE_LIMITED");
    throw new Error(`Lovable AI fallback failed (${response.status})`);
  }
  return await response.json();
}


// ─── kie.ai Image Generation (async task API) ───
// Per kie.ai docs (verified 2026-04):
//   - nano-banana-2     → model="nano-banana-2",          input.image_input (≤14), input.aspect_ratio, input.resolution
//   - nano-banana-pro   → model="nano-banana-pro",        input.image_input (≤8),  input.aspect_ratio, input.resolution
//   - nano-banana-edit  → model="google/nano-banana-edit", input.image_urls (≤10), input.image_size (NO aspect_ratio/resolution)
async function kieGenerateImage(
  apiKey: string,
  prompt: string,
  imageInputs: string[],
  aspectRatio: string,
  model = "nano-banana-2",
  resolution = "1K",
  onTaskCreated?: (taskId: string) => Promise<void> | void,
): Promise<string> {
  // Build per-model body shape
  const isEdit = model === "nano-banana-edit" || model === "google/nano-banana-edit";
  const isGptImage2 = model === "gpt-image-2-image-to-image";
  const apiModel = isEdit ? "google/nano-banana-edit" : model;
  const input: Record<string, unknown> = { prompt };

  if (isEdit) {
    // Edit endpoint uses different field names
    input.image_urls = imageInputs;
    input.image_size = aspectRatio; // enum: 1:1, 9:16, 16:9, 3:4, 4:3, etc.
  } else if (isGptImage2) {
    // GPT Image 2 image-to-image uses input_urls + aspect_ratio + resolution
    input.input_urls = imageInputs;
    input.aspect_ratio = aspectRatio;
    input.resolution = resolution;
  } else {
    input.image_input = imageInputs;
    input.aspect_ratio = aspectRatio;
    input.resolution = resolution;
    (input as any).output_format = "png";
  }

  // Submit task
  const createRes = await fetch(KIE_CREATE_TASK, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: apiModel, input }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text().catch(() => "");
    console.error(`kie.ai createTask error ${createRes.status}:`, errText);
    if (createRes.status === 402) throw new Error("CREDITS_EXHAUSTED");
    if (createRes.status === 429) throw new Error("KIE_RATE_LIMITED");
    throw new Error(`kie.ai task creation failed (${createRes.status})`);
  }

  const createData = await createRes.json();
  throwIfKieApiError(createData);
  const taskId = createData?.data?.taskId || createData?.taskId;
  if (!taskId) {
    console.error("No taskId in kie.ai response:", JSON.stringify(createData));
    throw new Error("No taskId returned from kie.ai");
  }

  console.log(`kie.ai task created: ${taskId} (model: ${model})`);

  // Persist taskId so a recovery endpoint can finalize this generation later
  // if the edge worker dies during the long Kie poll (4–6 min for GPT Image 2).
  if (onTaskCreated) {
    try { await onTaskCreated(taskId); } catch (e) { console.warn("onTaskCreated failed:", e); }
  }

  // Poll for completion. GPT Image 2 (esp. 2K) can take 4–6 min; other models
  // usually <2 min. Generous ceiling avoids premature fallback to a weaker model.
  const maxWaitMs = isGptImage2 ? 480000 : 240000;
  const startTime = Date.now();
  let pollInterval = 3000; // Start at 3s
  const maxPollInterval = 10000;

  while (Date.now() - startTime < maxWaitMs) {
    await sleep(pollInterval);

    const statusRes = await fetch(`${KIE_TASK_STATUS}?taskId=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!statusRes.ok) {
      console.warn(`kie.ai poll error ${statusRes.status}, retrying...`);
      pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
      continue;
    }

    const statusData = await statusRes.json();
    const state = statusData?.data?.state;
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (state === "success") {
      const resultJson = statusData.data.resultJson;
      let resultUrls: string[] = [];
      if (typeof resultJson === "string") {
        try {
          const parsed = JSON.parse(resultJson);
          resultUrls = parsed.resultUrls || [];
        } catch {
          console.error("Failed to parse resultJson:", resultJson);
        }
      } else if (resultJson?.resultUrls) {
        resultUrls = resultJson.resultUrls;
      }

      if (resultUrls.length === 0) {
        throw new Error("kie.ai task succeeded but no result URLs");
      }

      console.log(`kie.ai task ${taskId} completed in ${elapsed}s, got ${resultUrls.length} URLs`);
      return resultUrls[0];
    }

    if (state === "fail") {
      const failMsg = statusData.data?.failMsg || "Unknown failure";
      console.error(`kie.ai task ${taskId} failed after ${elapsed}s:`, failMsg);
      throw new Error(`kie.ai generation failed: ${failMsg}`);
    }

    // Still processing (waiting, queuing, generating)
    if (elapsed % 15 === 0) {
      console.log(`kie.ai task ${taskId} state: ${state}, elapsed: ${elapsed}s`);
    }
    pollInterval = Math.min(pollInterval * 1.2, maxPollInterval);
  }

  throw new Error(`kie.ai task ${taskId} timed out after ${maxWaitMs / 1000}s`);
}

// ─── Download image from URL and convert to base64 ───
async function downloadImageAsBase64(url: string): Promise<{ base64: string; bytes: Uint8Array }> {
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const bytes = new Uint8Array(await res.arrayBuffer());
  
  // Detect content type
  let mimeType = "image/png";
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) mimeType = "image/jpeg";
  else if (bytes[0] === 0x89 && bytes[1] === 0x50) mimeType = "image/png";
  else if (bytes[0] === 0x52 && bytes[1] === 0x49) mimeType = "image/webp";
  
  // Convert to base64
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = `data:${mimeType};base64,${btoa(binary)}`;
  return { base64, bytes };
}

const LOVABLE_MAX_IMAGE_BYTES = 28 * 1024 * 1024;

function toLovableSafeImageUrl(url: string): string {
  if (url.startsWith("data:")) return url;
  try {
    const parsed = new URL(url);
    const publicMarker = "/storage/v1/object/public/";
    const markerIndex = parsed.pathname.indexOf(publicMarker);
    if (markerIndex >= 0) {
      const objectPath = parsed.pathname.slice(markerIndex + publicMarker.length);
      parsed.pathname = `/storage/v1/render/image/public/${objectPath}`;
      parsed.searchParams.set("width", "1536");
      parsed.searchParams.set("quality", "78");
      parsed.searchParams.set("resize", "contain");
      return parsed.toString();
    }
  } catch {
    return url;
  }
  return url;
}

async function buildLovableImagePart(url: string, label: string): Promise<any | null> {
  const safeUrl = toLovableSafeImageUrl(url);
  if (safeUrl.startsWith("data:")) {
    const approxBytes = Math.ceil((safeUrl.length - safeUrl.indexOf(",") - 1) * 0.75);
    if (approxBytes > LOVABLE_MAX_IMAGE_BYTES) {
      console.warn(`[Lovable fallback] Skipping ${label}: data URL is ${(approxBytes / 1024 / 1024).toFixed(1)}MB`);
      return null;
    }
    return { type: "image_url", image_url: { url: safeUrl } };
  }

  try {
    const head = await fetch(safeUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) });
    const length = Number(head.headers.get("content-length") || "0");
    if (length > LOVABLE_MAX_IMAGE_BYTES) {
      console.warn(`[Lovable fallback] Skipping ${label}: image is ${(length / 1024 / 1024).toFixed(1)}MB after transform`);
      return null;
    }
  } catch (err) {
    console.warn(`[Lovable fallback] Could not preflight ${label}; sending URL anyway`, err);
  }

  return { type: "image_url", image_url: { url: safeUrl } };
}

// ─── Creative direction moods for copy variation ───
// Each mood is tagged with traits so we can filter by brand tone.
type MoodEntry = {
  label: string;
  description: string;
  traits: string[]; // signals that make this mood appropriate
  forbiddenFor: string[]; // signals that disqualify this mood
};

const CREATIVE_MOODS: MoodEntry[] = [
  {
    label: "Bold & Confident",
    description: "Bold & Confident — use strong, declarative language with authority",
    traits: ["bold", "confident", "authoritative", "strong", "powerful", "assertive", "decisive"],
    forbiddenFor: ["restrained", "understated", "humble"],
  },
  {
    label: "Aspirational & Dreamy",
    description: "Aspirational & Dreamy — paint a vision of the ideal lifestyle",
    traits: ["aspirational", "dreamy", "lifestyle", "visionary", "luxury", "premium", "elevated", "refined"],
    forbiddenFor: ["practical", "utilitarian", "industrial"],
  },
  {
    label: "Minimal & Elegant",
    description: "Minimal & Elegant — fewer words, more impact, refined tone",
    traits: ["minimal", "elegant", "refined", "clean", "understated", "sophisticated", "premium", "luxury"],
    forbiddenFor: ["playful", "energetic", "loud", "maximalist"],
  },
  {
    label: "Energetic & Dynamic",
    description: "Energetic & Dynamic — action-oriented, momentum-driven language",
    traits: ["energetic", "dynamic", "youth", "young", "vibrant", "active", "fun", "playful", "bold"],
    forbiddenFor: ["restrained", "understated", "luxury", "premium", "institutional", "solemn"],
  },
  {
    label: "Warm & Inviting",
    description: "Warm & Inviting — conversational, welcoming, personal tone",
    traits: ["warm", "inviting", "friendly", "welcoming", "personal", "human", "intimate", "conversational", "family"],
    forbiddenFor: ["cold", "industrial", "corporate"],
  },
  {
    label: "Sophisticated & Premium",
    description: "Sophisticated & Premium — luxury vocabulary, understated elegance",
    traits: ["sophisticated", "premium", "luxury", "elegant", "refined", "high-end", "elevated", "exclusive"],
    forbiddenFor: ["playful", "casual", "youth", "budget", "value"],
  },
  {
    label: "Direct & Practical",
    description: "Direct & Practical — focus on tangible benefits and facts",
    traits: ["practical", "direct", "honest", "transparent", "clear", "informative", "value", "trusted"],
    forbiddenFor: ["poetic", "abstract", "dreamy"],
  },
  {
    label: "Poetic & Evocative",
    description: "Poetic & Evocative — rhythmic, image-rich, emotionally resonant",
    traits: ["poetic", "evocative", "emotional", "lyrical", "soulful", "intimate", "aspirational", "luxury"],
    forbiddenFor: ["practical", "technical", "industrial", "utilitarian"],
  },
  {
    label: "Playful & Witty",
    description: "Playful & Witty — clever wordplay, humor, lighthearted energy",
    traits: ["playful", "witty", "fun", "humorous", "casual", "youth", "quirky", "desi", "cheeky"],
    forbiddenFor: ["restrained", "institutional", "luxury", "premium", "solemn", "serious"],
  },
  {
    label: "Grounded & Authentic",
    description: "Grounded & Authentic — rooted, sincere, no-nonsense tone with cultural truth",
    traits: ["grounded", "authentic", "honest", "rooted", "cultural", "traditional", "heritage", "family", "trusted"],
    forbiddenFor: ["futuristic", "abstract", "edgy"],
  },
];

// Split a stored negative_prompts blob into visual / content / general parts.
// The form may store "## VISUAL NEVERS … ## CONTENT NEVERS …"; older rows
// remain plain text and are treated as "general" (used in both pipelines).
function splitNevers(raw: string | null | undefined): { visual: string; content: string; general: string } {
  if (!raw || !raw.trim()) return { visual: "", content: "", general: "" };
  const text = raw.trim();
  const visualMatch = text.match(/##\s*VISUAL NEVERS\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  const contentMatch = text.match(/##\s*CONTENT NEVERS\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  const generalMatch = text.match(/##\s*GENERAL NEVERS\s*\n([\s\S]*?)(?=\n##\s|$)/i);
  if (visualMatch || contentMatch || generalMatch) {
    return {
      visual: (visualMatch?.[1] || "").trim(),
      content: (contentMatch?.[1] || "").trim(),
      general: (generalMatch?.[1] || "").trim(),
    };
  }
  return { visual: "", content: "", general: text };
}

// Derive 3-5 brand-appropriate moods from the brand's brief, voice rules, and negative prompts.
// Returns the descriptions to inject into the prompt.
function deriveBrandMoods(
  brief: string,
  voiceRules: string,
  negativePrompts: string,
): { allowed: MoodEntry[]; reason: string } {
  const corpus = `${brief}\n${voiceRules}`.toLowerCase();
  const negativeCorpus = negativePrompts.toLowerCase();

  // Find Tone & Voice section explicitly if present (gets a 2x weight boost)
  const toneSectionMatch = corpus.match(
    /(?:tone|voice|personality|brand voice|tone & voice|tone and voice)[\s\S]{0,1500}?(?:\n##|\n\*\*[A-Z]|$)/i,
  );
  const toneSection = toneSectionMatch ? toneSectionMatch[0] : "";

  const scored = CREATIVE_MOODS.map((mood) => {
    let score = 0;
    let disqualified = false;

    // Hard disqualifiers from negative prompts
    for (const forbidden of mood.forbiddenFor) {
      if (negativeCorpus.includes(forbidden)) {
        disqualified = true;
        break;
      }
    }
    if (disqualified) return { mood, score: -999 };

    // Soft disqualifiers from brief (if brief explicitly says "never playful", drop it)
    for (const forbidden of mood.forbiddenFor) {
      const neverPattern = new RegExp(`(?:never|avoid|not|no)\\s+\\w{0,20}\\s*${forbidden}`, "i");
      if (neverPattern.test(corpus)) {
        disqualified = true;
        break;
      }
    }
    if (disqualified) return { mood, score: -999 };

    // Score by trait matches in corpus (1pt each)
    for (const trait of mood.traits) {
      if (corpus.includes(trait)) score += 1;
      // Tone section matches count double
      if (toneSection && toneSection.includes(trait)) score += 1;
    }

    return { mood, score };
  });

  const eligible = scored.filter((s) => s.score > -999);

  // If brief has signal, take top-scoring moods (tied at top all included, then top 3-5)
  const withSignal = eligible.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);

  let allowed: MoodEntry[];
  let reason: string;

  if (withSignal.length >= 3) {
    // Take top 3-5 based on score distribution
    allowed = withSignal.slice(0, Math.min(5, withSignal.length)).map((s) => s.mood);
    reason = `derived from brand tone signals (${allowed.length} moods)`;
  } else if (withSignal.length > 0) {
    // Some signal — use those plus pad to 3 from neutral remainder
    const used = new Set(withSignal.map((s) => s.mood.label));
    const padding = eligible
      .filter((s) => !used.has(s.mood.label) && s.score === 0)
      .slice(0, 3 - withSignal.length)
      .map((s) => s.mood);
    allowed = [...withSignal.map((s) => s.mood), ...padding];
    reason = `partial brand signal + ${padding.length} neutral moods`;
  } else {
    // No tone signal at all — fall back to all eligible moods (filtered only by forbidden traits)
    allowed = eligible.map((s) => s.mood);
    reason = `no tone signal; all ${allowed.length} brand-safe moods`;
  }

  return { allowed, reason };
}

function pickMoodFromAllowed(allowed: MoodEntry[]): string {
  if (allowed.length === 0) {
    // Last-resort safety: shouldn't happen but fall back to all moods
    return CREATIVE_MOODS[Math.floor(Math.random() * CREATIVE_MOODS.length)].description;
  }
  return allowed[Math.floor(Math.random() * allowed.length)].description;
}

// ─────────────────────────────────────────────────────
// Step 1 — Analyze reference image design framework
// ─────────────────────────────────────────────────────

// Try to extract framework from a plain text/JSON response (fallback when tool_calls missing)
function extractFrameworkFromContent(content: string): Record<string, unknown> | null {
  if (!content) return null;
  
  // Try to find JSON block in the content
  const jsonPatterns = [
    /```json\s*([\s\S]*?)```/,
    /```\s*([\s\S]*?)```/,
    /\{[\s\S]*"layout"[\s\S]*"zones"[\s\S]*\}/,
  ];
  
  for (const pattern of jsonPatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const parsed = JSON.parse(match[1] || match[0]);
        if (parsed && typeof parsed === "object" && (parsed.layout || parsed.style)) {
          console.log("Extracted framework from content text (fallback)");
          return parsed;
        }
      } catch { /* continue */ }
    }
  }
  
  // Try parsing entire content as JSON
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object" && (parsed.layout || parsed.style)) {
      return parsed;
    }
  } catch { /* not JSON */ }
  
  return null;
}

// Walk a string starting from `start`, return the index just AFTER the matching
// closing brace (quote- and escape-aware). Returns -1 if unbalanced.
function findBalancedBraceEnd(s: string, start: number): number {
  let depth = 0;
  let inStr = false;
  let strCh = "";
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === strCh) { inStr = false; }
      continue;
    }
    if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

// Yield candidate JSON object substrings from `content`, in priority order:
//   1. fenced ```json blocks (balanced inside the fence)
//   2. balanced top-level { … } objects scanned from each `{`
function* candidateJsonBlocks(content: string): Generator<string> {
  // 1. Fenced blocks
  const fenceRe = /```(?:json)?\s*([\s\S]*?)```/gi;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(content)) !== null) {
    const inner = m[1];
    const start = inner.indexOf("{");
    if (start !== -1) {
      const end = findBalancedBraceEnd(inner, start);
      if (end !== -1) yield inner.slice(start, end);
      else yield inner; // last-resort: try the whole fence body
    }
  }

  // 2. Every "{" in the raw content — try balanced extraction.
  for (let i = 0; i < content.length; i++) {
    if (content[i] !== "{") continue;
    const end = findBalancedBraceEnd(content, i);
    if (end !== -1) {
      yield content.slice(i, end);
      // skip past this object so we don't scan its inner braces redundantly
      i = end - 1;
    }
  }
}

// Extract a creative directive from plain-text/JSON content (Adapt step fallback).
// Resilient to trailing markdown / prose after the JSON object — uses a
// quote-aware balanced-brace scanner instead of a greedy regex.
function extractDirectiveFromContent(content: string): CreativeDirective | null {
  if (!content) return null;

  const normalize = (parsed: any): CreativeDirective | null => {
    if (!parsed || typeof parsed !== "object" || !parsed.headline) return null;
    return {
      headline: parsed.headline || "",
      subcopy: parsed.subcopy || parsed.sub_copy || parsed.subheadline || "",
      cta_text: parsed.cta_text || parsed.cta || "Learn More",
      selected_assets: parsed.selected_assets || [],
      color_usage: parsed.color_usage || {
        background: "#FFFFFF",
        headline_color: "#000000",
        subcopy_color: "#333333",
        cta_background: "#000000",
        cta_text: "#FFFFFF",
      },
      concept_adaptation: parsed.concept_adaptation || "",
      logo_treatment: parsed.logo_treatment || "",
      compliance_notes: parsed.compliance_notes || "",
    } as CreativeDirective;
  };

  for (const candidate of candidateJsonBlocks(content)) {
    try {
      const parsed = JSON.parse(candidate);
      const d = normalize(parsed);
      if (d) {
        console.log("Extracted directive via balanced-brace scan");
        return d;
      }
    } catch { /* keep scanning */ }
  }

  // Last resort: try parsing the entire content
  try {
    const d = normalize(JSON.parse(content));
    if (d) return d;
  } catch { /* not JSON */ }

  return null;
}

function buildLocalDirectiveFallback(
  brand: any,
  brandAssets: any[],
  creativeMood: string,
): CreativeDirective {
  const exampleCopy = extractExampleCopy(brand.brand_brief);
  const firstCopyLine = exampleCopy
    .split(/\n+/)
    .map((line) => line.replace(/^[-•\d.)\s]+/, "").trim())
    .find(Boolean);
  const name = String(brand.name || "Brand").trim();
  const words = (firstCopyLine || name).split(/\s+/).filter(Boolean);
  const headline = words.slice(0, 8).join(" ") || name;
  const brief = toCompactText(brand.brand_voice_rules || brand.brand_brief || "", 260);
  const sentence = brief.split(/[.!?\n]/).map((s) => s.trim()).find((s) => s.length > 10);
  const subcopy = (sentence || `${name} brings a clear, memorable brand message to this creative.`)
    .split(/\s+/)
    .slice(0, 20)
    .join(" ");

  const logoIndex = brandAssets.findIndex((a: any) => /\b(logo|logomark|brand\s*mark|brand\s*logo|symbol|monogram|emblem)\b/i.test(a.label || ""));
  const visualIndices = brandAssets
    .map((asset: any, index: number) => ({ asset, index }))
    .filter(({ index, asset }) => index !== logoIndex && !/\b(logo|logomark|brand\s*mark|brand\s*logo|symbol|monogram|emblem)\b/i.test(asset.label || ""))
    .slice(0, 3);

  const selected_assets: CreativeDirective["selected_assets"] = [];
  if (logoIndex >= 0) {
    selected_assets.push({
      index: logoIndex,
      role: "logo",
      placement: "brand mark zone with strong contrast backing if needed",
      reason: "Required brand logo inclusion",
    });
  }
  for (const { index, asset } of visualIndices) {
    selected_assets.push({
      index,
      role: "hero_visual",
      placement: "primary visual zone adapted from the reference layout",
      reason: `Best available brand-owned visual asset: ${asset.label || "unlabeled asset"}`,
    });
  }

  return {
    headline,
    subcopy,
    cta_text: "Enquire Now",
    selected_assets,
    color_usage: {
      background: brand.primary_color || "#FFFFFF",
      headline_color: brand.secondary_color || "#111111",
      subcopy_color: "#222222",
      cta_background: brand.secondary_color || brand.primary_color || "#111111",
      cta_text: "#FFFFFF",
    },
    concept_adaptation: `Local fallback directive using the extracted framework, brand-owned assets, and mood: ${creativeMood.split(" — ")[0]}.`,
    logo_treatment: "Use exact uploaded logo with contrast-safe backing if the background is busy.",
    compliance_notes: "Use only brand-provided claims and avoid copying reference-image content.",
  };
}

// Build a minimal fallback framework from the format spec
function buildMinimalFramework(aspectRatio: string): Record<string, unknown> {
  const orientation = aspectRatio === "1:1" ? "square" 
    : aspectRatio === "9:16" || aspectRatio === "4:5" ? "portrait" 
    : "landscape";
  
  return {
    layout: {
      orientation,
      zones: [
        { name: "background", position: "full", size: "full", description: "background zone" },
        { name: "brand_mark", position: "top-left", size: "small", description: "brand logo placement zone" },
        { name: "headline", position: "center", size: "large", description: "primary headline text zone" },
        { name: "subcopy", position: "center-bottom", size: "medium", description: "supporting text zone" },
        { name: "hero_visual", position: "center", size: "large", description: "primary visual / imagery zone" },
        { name: "cta", position: "bottom-center", size: "small", description: "call-to-action button or strip" },
      ],
    },
    style: {
      background_type: "gradient",
      photography_style: "lifestyle",
      overlay: "dark-gradient",
      mood: "professional",
      color_scheme: "dominant brand primary with neutral accents",
    },
    text_elements: [
      { type: "headline", position: "center", font_style: "bold uppercase sans-serif", approximate_size: "large" },
      { type: "subcopy", position: "below-headline", font_style: "light sans-serif", approximate_size: "medium" },
      { type: "cta", position: "bottom-center", font_style: "bold uppercase", approximate_size: "small" },
    ],
    composition_notes: "Standard brand layout with clear visual hierarchy, logo prominence, and balanced text placement.",
  };
}

function buildLocalFrameworkFallback(
  aspectRatio: string,
  brand?: Record<string, any> | null,
  reason = "AI framework providers unavailable",
): Record<string, unknown> {
  const orientation = aspectRatio === "1:1" ? "square"
    : aspectRatio === "9:16" || aspectRatio === "4:5" ? "portrait"
    : "landscape";
  const primary = brand?.primary_color || "brand primary";
  const secondary = brand?.secondary_color || "brand accent";
  const heroPosition = orientation === "landscape" ? "right-half" : "upper-half";
  const textPosition = orientation === "landscape" ? "left-third" : "lower-third";

  return {
    layout: {
      orientation,
      zones: [
        { name: "background", position: "full", size: "full", description: "background zone" },
        { name: "hero_visual", position: heroPosition, size: "large", description: "primary visual / imagery zone" },
        { name: "brand_mark", position: "top-left", size: "small", description: "brand logo placement zone" },
        { name: "headline", position: textPosition, size: "large", description: "primary headline text zone" },
        { name: "subcopy", position: textPosition, size: "medium", description: "supporting text zone" },
        { name: "cta", position: "bottom-left", size: "small", description: "call-to-action button or strip" },
      ],
    },
    style: {
      background_type: "solid/panel split with safe text zones",
      photography_style: "brand-owned hero visual",
      overlay: "contrast-safe text panel only",
      mood: "professional, brand-led",
      color_scheme: `Use ${primary} as dominant brand field with ${secondary} accents and neutral readable text`,
    },
    text_elements: [
      { type: "headline", position: textPosition, font_style: "bold clean sans-serif", approximate_size: "large" },
      { type: "subcopy", position: textPosition, font_style: "regular clean sans-serif", approximate_size: "medium" },
      { type: "cta", position: "bottom-left", font_style: "bold compact sans-serif", approximate_size: "small" },
    ],
    composition_notes: `Local fallback framework because ${reason}. Keep strict hierarchy: logo visible, text separated from imagery, hero asset preserved, and all copy on solid readable zones.`,
  };
}

async function analyzeFramework(
  referenceImageUrl: string,
  apiKey: string,
  aspectRatio = "16:9",
  brand?: Record<string, any> | null,
): Promise<Record<string, unknown>> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  // Framework tool schema — shared between GPT-5.5 Responses (primary) and
  // Gemini 3 Pro chat (fallback). Content-agnostic template extraction.
  const frameworkToolParameters = {
    type: "object",
    properties: {
      layout: {
        type: "object",
        properties: {
          orientation: { type: "string", description: "landscape, portrait, or square" },
          zones: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  enum: [
                    "background", "brand_mark", "headline", "subcopy",
                    "hero_visual", "supporting_visual", "info_strip",
                    "cta", "footer", "accent",
                  ],
                  description: "Abstract zone type from the fixed vocabulary",
                },
                position: { type: "string", description: "Precise position: top-left, center, bottom-right, etc." },
                size: { type: "string", description: "Relative size: tiny, small, medium, large, half, full" },
                description: { type: "string", description: "DESIGN ROLE description only — NEVER mention specific content." },
              },
              required: ["name", "position", "size", "description"],
              additionalProperties: false,
            },
          },
        },
        required: ["orientation", "zones"],
        additionalProperties: false,
      },
      style: {
        type: "object",
        properties: {
          background_type: { type: "string" },
          photography_style: { type: "string" },
          overlay: { type: "string" },
          mood: { type: "string" },
          color_scheme: { type: "string" },
        },
        required: ["background_type", "photography_style", "overlay", "mood", "color_scheme"],
        additionalProperties: false,
      },
      text_elements: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["headline", "subcopy", "cta", "tagline", "detail", "footer"] },
            position: { type: "string" },
            font_style: { type: "string" },
            approximate_size: { type: "string" },
          },
          required: ["type", "position", "font_style", "approximate_size"],
          additionalProperties: false,
        },
      },
      composition_notes: { type: "string" },
    },
    required: ["layout", "style", "text_elements", "composition_notes"],
    additionalProperties: false,
  } as const;

  const frameworkSystemPrompt = `You are an expert visual design analyst specializing in ABSTRACT DESIGN PRINCIPLES.

CRITICAL RULES:
1. Describe layout zones by their DESIGN ROLE — NOT by their content.
2. NEVER mention brand names, company names, product names, locations, dates, prices, phone numbers, or any specific text visible in the image.
3. Use ONLY these zone_type categories: background, brand_mark, headline, subcopy, hero_visual, supporting_visual, info_strip, cta, footer, accent
4. Describe SPATIAL RELATIONSHIPS, visual weight, and compositional principles — not what specific content fills each zone.
5. For text_elements, describe the TYPOGRAPHIC STYLE (weight, case, size, contrast) — never the actual words.
6. Think of yourself as extracting a REUSABLE TEMPLATE, not describing this specific ad.`;

  const frameworkUserText = "Extract the ABSTRACT DESIGN FRAMEWORK from this advertisement. Focus on spatial layout, visual hierarchy, typographic style, and compositional principles. Do NOT describe any specific content — only design structure.";

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Primary (attempt 1): GPT-5.5 via kie.ai Responses API (reasoning: high).
      // Fallback (attempt 2): Gemini 3 Pro thinking via kie.ai chat.
      const usePrimaryGpt55 = attempt === 1;
      const frameworkLabel = usePrimaryGpt55 ? "gpt-5-5" : "gemini-3-pro";
      console.log(`[model] framework attempt ${attempt}/${maxRetries} via kie/${frameworkLabel}`);

      if (usePrimaryGpt55) {
        // GPT-5.5 Responses API path — accepts image via input_image block.
        // For the primary, attempt base64 conversion once to sidestep transient URL fetch issues.
        let imageUrlForResponses = referenceImageUrl;
        if (!referenceImageUrl.startsWith("data:")) {
          try {
            const { base64 } = await downloadImageAsBase64(referenceImageUrl);
            imageUrlForResponses = base64;
          } catch (dlErr) {
            console.warn("[framework gpt-5-5] base64 conversion failed, using URL:", (dlErr as Error).message);
          }
        }

        const data = await kieResponses(apiKey, {
          model: "gpt-5-5",
          input: [
            { role: "developer", content: [{ type: "input_text", text: frameworkSystemPrompt }] },
            {
              role: "user",
              content: [
                { type: "input_text", text: frameworkUserText },
                { type: "input_image", image_url: imageUrlForResponses },
              ],
            },
          ],
          tools: [{
            type: "function",
            name: "extract_design_framework",
            description: "Extract a reusable, content-agnostic design framework from the reference image.",
            parameters: frameworkToolParameters,
            strict: true,
          }],
          tool_choice: "auto",
          reasoning: { effort: "high" },
        }, KIE_REASONING_TIMEOUT_MS);

        // Walk output for a function_call named extract_design_framework.
        const allObjects: any[] = [];
        const walk = (v: any) => {
          if (!v || typeof v !== "object") return;
          if (Array.isArray(v)) { for (const it of v) walk(it); return; }
          allObjects.push(v);
          for (const nested of Object.values(v)) walk(nested);
        };
        walk(data);
        const fnCall = allObjects.find(
          (o: any) =>
            (o?.type === "function_call" || o?.type === "tool_call" || o?.type === "function") &&
            (o?.name === "extract_design_framework" || o?.function?.name === "extract_design_framework") &&
            (o?.arguments || o?.function?.arguments),
        );
        const args = fnCall?.arguments || fnCall?.function?.arguments;
        if (args) {
          const framework = typeof args === "string" ? JSON.parse(args) : args;
          console.log(`✅ Framework extracted via kie.ai gpt-5-5 (Responses)`);
          return framework;
        }
        // Content fallback
        const textParts: string[] = [];
        if (typeof data?.output_text === "string") textParts.push(data.output_text);
        for (const o of allObjects) {
          if ((o?.type === "output_text" || o?.type === "text") && typeof o?.text === "string") textParts.push(o.text);
        }
        const text = textParts.join("\n").trim();
        if (text) {
          const extracted = extractFrameworkFromContent(text);
          if (extracted) {
            console.log("✅ Framework extracted via kie.ai gpt-5-5 (content fallback)");
            return extracted;
          }
        }
        console.error(`Attempt ${attempt} (gpt-5-5): no framework in Responses payload; keys=${JSON.stringify(Object.keys(data || {}))}`);
        lastError = new Error("No framework extracted from GPT-5.5 response");
      } else {
        // Fallback attempt: Gemini 3 Pro thinking via chat completions.
        let imageContent: any;
        if (!referenceImageUrl.startsWith("data:")) {
          try {
            const { base64 } = await downloadImageAsBase64(referenceImageUrl);
            imageContent = { type: "image_url", image_url: { url: base64 } };
          } catch (dlErr) {
            console.warn("Base64 conversion failed, using URL:", (dlErr as Error).message);
            imageContent = { type: "image_url", image_url: { url: referenceImageUrl } };
          }
        } else {
          imageContent = { type: "image_url", image_url: { url: referenceImageUrl } };
        }

        const data = await kieChat(apiKey, {
          model: "gemini-3-pro",
          reasoning_effort: "high",
          include_thoughts: false,
          messages: [
            { role: "system", content: frameworkSystemPrompt },
            {
              role: "user",
              content: [
                { type: "text", text: frameworkUserText },
                imageContent,
              ],
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "extract_design_framework",
              description: "Extract a reusable, content-agnostic design framework from the reference image.",
              parameters: frameworkToolParameters,
            },
          }],
          tool_choice: { type: "function", function: { name: "extract_design_framework" } },
        }, KIE_REASONING_TIMEOUT_MS, KIE_THINKING_CHAT_BASE);

        const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          const framework = JSON.parse(toolCall.function.arguments);
          console.log("✅ Framework extracted via kie.ai gemini-3-pro tool_calls");
          return framework;
        }
        const messageContent = data.choices?.[0]?.message?.content;
        if (messageContent) {
          const extracted = extractFrameworkFromContent(
            typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent),
          );
          if (extracted) return extracted;
        }
        console.error(`Attempt ${attempt} (gemini-3-pro): No framework in response.`);
        lastError = new Error("No framework extracted from reference image");
      }
    } catch (err: any) {
      lastError = err;
      console.error(`Framework analysis attempt ${attempt} error:`, err.message);

      if (err.message === "CREDITS_EXHAUSTED" || err.message === "KIE_RATE_LIMITED") {
        console.warn(`kie.ai framework unavailable (${err.message}); moving to fallback provider.`);
        break;
      }

      if (attempt < maxRetries) {
        const waitMs = 2000;
        console.log(`Waiting ${waitMs}ms before retry...`);
        await sleep(waitMs);
      }
    }
  }

  // kie.ai chat endpoint failed all retries — try Lovable AI Gateway with the
  // SAME prompt + tool schema before giving up. This is the resilience net so
  // we never silently fall back to a hardcoded generic template.
  console.warn("⚠️ All kie.ai framework attempts failed. Trying Lovable AI Gateway fallback...");
  try {
    const imageContent = await buildLovableImagePart(referenceImageUrl, "framework reference image");
    if (!imageContent) {
      throw new Error("Reference image is too large for Lovable AI fallback");
    }
    const data = await lovableChat({
      messages: [
        {
          role: "system",
          content: `You are an expert visual design analyst specializing in ABSTRACT DESIGN PRINCIPLES.

CRITICAL RULES:
1. Describe layout zones by their DESIGN ROLE — NOT by their content.
2. NEVER mention brand names, company names, product names, locations, dates, prices, phone numbers, or any specific text visible in the image.
3. Use ONLY these zone_type categories: background, brand_mark, headline, subcopy, hero_visual, supporting_visual, info_strip, cta, footer, accent
4. Describe SPATIAL RELATIONSHIPS, visual weight, and compositional principles — not what specific content fills each zone.
5. For text_elements, describe the TYPOGRAPHIC STYLE (weight, case, size, contrast) — never the actual words.
6. Think of yourself as extracting a REUSABLE TEMPLATE, not describing this specific ad.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the ABSTRACT DESIGN FRAMEWORK from this advertisement. Focus on spatial layout, visual hierarchy, typographic style, and compositional principles. Do NOT describe any specific content — only design structure." },
            imageContent,
          ],
        },
      ],
      tools: [{
        type: "function",
        function: {
          name: "extract_design_framework",
          description: "Extract a reusable, content-agnostic design framework from the reference image.",
          parameters: {
            type: "object",
            properties: {
              layout: {
                type: "object",
                properties: {
                  orientation: { type: "string" },
                  zones: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", enum: ["background","brand_mark","headline","subcopy","hero_visual","supporting_visual","info_strip","cta","footer","accent"] },
                        position: { type: "string" },
                        size: { type: "string" },
                        description: { type: "string" },
                      },
                      required: ["name","position","size","description"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["orientation","zones"],
                additionalProperties: false,
              },
              style: {
                type: "object",
                properties: {
                  background_type: { type: "string" },
                  photography_style: { type: "string" },
                  overlay: { type: "string" },
                  mood: { type: "string" },
                  color_scheme: { type: "string" },
                },
                required: ["background_type","photography_style","overlay","mood","color_scheme"],
                additionalProperties: false,
              },
              text_elements: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string", enum: ["headline","subcopy","cta","tagline","detail","footer"] },
                    position: { type: "string" },
                    font_style: { type: "string" },
                    approximate_size: { type: "string" },
                  },
                  required: ["type","position","font_style","approximate_size"],
                  additionalProperties: false,
                },
              },
              composition_notes: { type: "string" },
            },
            required: ["layout","style","text_elements","composition_notes"],
            additionalProperties: false,
          },
        },
      }],
      tool_choice: { type: "function", function: { name: "extract_design_framework" } },
    }, LOVABLE_REASONING_TIMEOUT_MS);

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const framework = JSON.parse(toolCall.function.arguments);
      console.log("✅ Framework extracted via Lovable AI fallback");
      return framework;
    }
    const messageContent = data.choices?.[0]?.message?.content;
    if (messageContent) {
      const extracted = extractFrameworkFromContent(
        typeof messageContent === "string" ? messageContent : JSON.stringify(messageContent)
      );
      if (extracted) {
        console.log("✅ Framework extracted via Lovable AI fallback (content)");
        return extracted;
      }
    }
    throw new Error("Lovable AI fallback returned no framework");
  } catch (fallbackErr: any) {
    console.error("Lovable AI framework fallback also failed:", fallbackErr.message);
    console.warn("⚠️ Using local framework fallback so generation can continue to render.");
    return buildLocalFrameworkFallback(
      aspectRatio,
      brand,
      lastError?.message || fallbackErr.message || "framework analysis failed",
    );
  }
}


// ─────────────────────────────────────────────────────
// Step 2 — Adapt: Map reference concept to brand
// ─────────────────────────────────────────────────────
interface CreativeDirective {
  headline: string;
  subcopy: string;
  cta_text: string;
  selected_assets: Array<{
    index: number;
    role: string;
    placement: string;
    reason: string;
  }>;
  color_usage: {
    background: string;
    headline_color: string;
    subcopy_color: string;
    cta_background: string;
    cta_text: string;
  };
  concept_adaptation: string;
  logo_treatment: string;
  compliance_notes: string;
}

const ASSET_ROLE_INSTRUCTIONS: Record<string, string> = {
  "Logo": "Place as brand mark — exact fidelity required. Top-left or top-right with contrast backing.",
  "Hero Image": "Use as the primary hero visual. Feature prominently in the main visual zone.",
  "Product": "Feature prominently with high detail preservation. Center of visual attention.",
  "Lifestyle": "Use as atmospheric background or lifestyle context. Can crop/blend into layout.",
  "Icon": "Small supporting element. Use at specified position, maintain clarity.",
  "Pattern/Texture": "Use as background texture, border accent, or subtle overlay pattern.",
  "Banner": "Use as a full-width visual strip or header element.",
  "Infographic": "Include as data/information visual. Maintain readability.",
  "Style Reference": "Use as mood/style guide — match its aesthetic, don't reproduce literally.",
  "Elevation": "Use as hero architectural visual. Preserve exact building form, materials, and proportions.",
  "Interior": "Showcase interior space. Preserve design details, furniture, and spatial feel.",
  "Exterior": "Feature building/project exterior. Maintain architectural accuracy and surroundings.",
  "Amenity": "Showcase project amenity (pool, gym, garden). Feature prominently with lifestyle appeal.",
  "RERA QR": "Place as regulatory compliance element. Position in top-right or bottom corner, keep scannable.",
  "Render": "Use as hero 3D render. Preserve exact form, lighting, and materials.",
  "Room/Suite": "Feature the space prominently. Preserve luxury/comfort feel.",
  "Aerial View": "Use as dramatic top-down or elevated perspective visual.",
  "Lookbook": "Use as fashion editorial visual. Maintain styling and composition.",
  "On-Model": "Feature model wearing product. Preserve outfit details.",
  "Swatch": "Use as color/material reference element. Place in supporting zone.",
  "Flat Lay": "Use as product arrangement visual. Maintain composition.",
  "Fabric Close-up": "Use as texture/detail reference. Supporting visual element.",
  "Screenshot": "Use as product UI showcase. Maintain sharpness and readability.",
  "UI Mockup": "Feature as product interface visual. Keep pixel-perfect.",
  "Device Render": "Showcase product on device. Maintain device frame and screen content.",
  "Dashboard": "Feature as product analytics/interface visual.",
  "Dish/Menu Item": "Feature food prominently. Preserve appetizing presentation.",
  "Packaging": "Showcase product packaging. Maintain label details and branding.",
  "Store/Venue": "Feature retail/venue space. Preserve atmosphere.",
  "Facility": "Showcase facility/building. Maintain professional look.",
  "Data Visualization": "Include as chart/graph element. Maintain readability.",
  "Other": "Use in appropriate zone based on visual content.",
};

function getAssetRoleInstruction(label: string): string {
  if (label.startsWith("Other:")) {
    const customDesc = label.replace(/^Other:\s*/, "").trim();
    return customDesc
      ? `Use as "${customDesc}" — place in appropriate zone based on this description.`
      : ASSET_ROLE_INSTRUCTIONS["Other"];
  }
  return ASSET_ROLE_INSTRUCTIONS[label] || ASSET_ROLE_INSTRUCTIONS["Other"];
}

async function adaptDirective(
  framework: Record<string, unknown>,
  brand: any,
  brandAssets: any[],
  referenceImageUrl: string,
  spec: { width: number; height: number; label: string },
  apiKey: string
): Promise<CreativeDirective> {
  const extraColorsText =
    brand.extra_colors && Array.isArray(brand.extra_colors) && brand.extra_colors.length > 0
      ? brand.extra_colors.map((c: any) => `${c.name || "Color"}: ${c.hex}`).join(", ")
      : "";

  const assetList = brandAssets
    .map(
      (a: any, i: number) =>
        `[${i}] "${a.label || "Unlabeled"}" — Role: ${getAssetRoleInstruction(a.label || "")}`
    )
    .join("\n");

  const nevers = splitNevers(brand.negative_prompts);
  // Mood derivation = content-side signal (visual nevers shouldn't disqualify "Playful").
  const moodNeverCorpus = [nevers.content, nevers.general].filter(Boolean).join("\n");

  const exampleCopy = extractExampleCopy(brand.brand_brief);
  const exampleCopyBlock = exampleCopy ? toCompactText(exampleCopy, 4000) : "";

  const brandContext = [
    `Brand: ${brand.name}`,
    `Primary: ${brand.primary_color} | Secondary: ${brand.secondary_color}`,
    extraColorsText ? `Extra colors: ${extraColorsText}` : "",
    brand.brand_voice_rules ? `Voice/Audience: ${toCompactText(brand.brand_voice_rules, 4000)}` : "",
    brand.brand_brief ? `Brand Brief: ${toCompactText(brand.brand_brief, 8000)}` : "",
    exampleCopyBlock
      ? `EXAMPLE COPY MENU (multiple options — read EVERY line, then pick the ONE that best fits the reference's mood, layout, and creative direction; you may also lightly adapt or remix lines, but do NOT default to the first entry, do NOT ignore the rest):\n${exampleCopyBlock}`
      : "",
    nevers.content ? `CONTENT NEVERS (copy): ${toCompactText(nevers.content, 2000)}` : "",
    nevers.visual ? `VISUAL NEVERS (image): ${toCompactText(nevers.visual, 2000)}` : "",
    nevers.general ? `NEVER include: ${toCompactText(nevers.general, 3000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const { allowed: allowedMoods, reason: moodReason } = deriveBrandMoods(
    brand.brand_brief || "",
    brand.brand_voice_rules || "",
    moodNeverCorpus,
  );
  const creativeMood = pickMoodFromAllowed(allowedMoods);
  console.log(
    `[Adapt] Brand "${brand.name}" mood pool: ${moodReason}. Allowed: [${allowedMoods.map((m) => m.label).join(", ")}]. Picked: "${creativeMood.split(" — ")[0]}"`,
  );

  const systemPrompt = `You are a senior creative director. Your job is to MAP a reference advertisement's concept, layout, and energy to a specific brand — making every creative decision so the image model only needs to render.

CRITICAL — CONTENT ISOLATION:
The reference image is for LAYOUT, COMPOSITION, and VISUAL STYLE only.
IGNORE ALL text, names, locations, prices, currencies, phone numbers, addresses, URLs, and any written content visible in the reference image.
ALL copy (headline, subcopy, CTA) must come EXCLUSIVELY from the brand data below.

CRITICAL — IMAGE ISOLATION:
NEVER reproduce, copy, or recreate the IMAGERY from the reference image. The reference shows a layout structure — but ALL visuals in the output must come from the brand's OWN uploaded assets. If the reference shows people, buildings, products, or scenes — do NOT generate similar-looking imagery. Instead, select the brand's own assets that best fit each visual zone. The reference dictates WHERE images go and HOW they're composed, NOT WHAT images to use.

CREATIVE DIRECTION FOR THIS GENERATION:
${creativeMood}
Write copy that embodies this mood. Do NOT just repeat the brand's tagline — interpret the brand brief through this creative lens. Each generation should feel fresh and different.

You receive:
1. A reference advertisement image (for concept/style/layout inspiration ONLY)
2. The extracted design framework (structural analysis of the reference)
3. Full brand data (name, colors, voice, brief)
4. The actual brand asset images — you can SEE each one to evaluate visual fit
5. The output format/dimensions

Your task:
- Write the EXACT headline (≤8 words), subcopy (≤20 words), and CTA text — sourced ONLY from brand data
- Select which 2-4 assets (by index) to use, evaluating visual fit with the reference layout
- Decide exact color hex values for each element
- Explain how the reference concept adapts to this brand
- Specify logo treatment (light/dark version, backing panel if needed)
- Flag any compliance concerns from the brand brief

ASSET SELECTION RULES:
- Always include ONE logo if available
- VISUALLY MATCH assets to the reference layout zones
- Pick 1-3 visual assets (not just one!) if the reference has multiple visual zones
- Each visual zone in the reference should map to a DIFFERENT asset
- Skip assets that don't fit this layout
- Maximum 5 assets total (1 logo + up to 4 visuals)

COPY RULES:
- Headlines must be original, punchy, and aligned to the CREATIVE DIRECTION above
- ALL text MUST come from the brand brief and brand data
- If an "EXAMPLE COPY MENU" is provided, treat it as a pool of pre-approved options. Scan the FULL list, then pick (or lightly adapt) the entry that best matches the reference's mood, layout zones (headline length, subcopy length, CTA tone) and the CREATIVE DIRECTION for this generation. Do not default to the first entry. Do not ignore later entries. Different references should map to different entries.
- You may remix words across entries or tighten phrasing to fit the layout, but stay within the brand's voice and the menu's intent.
- CTA should be actionable and brand-appropriate
- DO NOT repeat the same headlines across generations — be creative and varied

COLOR RULES:
- Use brand primary for dominant elements (headlines, accent strips, CTA)
- Use secondary for supporting elements
- Ensure sufficient contrast for text readability

TEXT PLACEMENT:
- Text MUST be on solid color zones, gradient overlays, or panels — NEVER on photos/renders

FORMAT: ${spec.label} (${spec.width}×${spec.height})`;

  const userMessage = `DESIGN FRAMEWORK (abstract structural analysis — zone names are normalized):
${JSON.stringify(sanitizeFramework(framework), null, 2)}

BRAND DATA:
${brandContext}

AVAILABLE ASSETS (select by index — you can see each one below):
${assetList || "No assets available — design must be text-prominent."}

Look at the reference image AND each brand asset image. Visually evaluate which assets best fit the reference layout zones. Pre-decide all copy, colors, and asset selections.

Return the result by calling creative_directive. If function calling is unavailable, return ONLY one valid JSON object with the exact same fields as creative_directive.`;

  const userContent: any[] = [
    { type: "text", text: userMessage },
    { type: "text", text: "REFERENCE IMAGE (layout/style inspiration only — ignore all text/content in it):" },
    { type: "image_url", image_url: { url: referenceImageUrl } },
  ];

  for (let i = 0; i < brandAssets.length && i < 15; i++) {
    const asset = brandAssets[i];
    userContent.push(
      { type: "text", text: `BRAND ASSET [${i}] "${asset.label || "Unlabeled"}":` },
      { type: "image_url", image_url: { url: asset.image_url } }
    );
  }

  // Shared chat body — identical for kie primary and Lovable AI fallback so
  // output character stays consistent. Don't include `model` here; kieChat
  // uses kie's default and lovableChat injects google/gemini-2.5-pro.
  const adaptBody = {
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "creative_directive",
          description: "Output the complete creative directive mapping the reference concept to the brand.",
          parameters: {
            type: "object",
            properties: {
              headline: { type: "string", description: "Exact headline text, ≤8 words" },
              subcopy: { type: "string", description: "Exact subcopy text, ≤20 words" },
              cta_text: { type: "string", description: "Exact CTA text" },
              selected_assets: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    index: { type: "number" },
                    role: { type: "string" },
                    placement: { type: "string" },
                    reason: { type: "string" },
                  },
                  required: ["index", "role", "placement", "reason"],
                  additionalProperties: false,
                },
              },
              color_usage: {
                type: "object",
                properties: {
                  background: { type: "string" },
                  headline_color: { type: "string" },
                  subcopy_color: { type: "string" },
                  cta_background: { type: "string" },
                  cta_text: { type: "string" },
                },
                required: ["background", "headline_color", "subcopy_color", "cta_background", "cta_text"],
                additionalProperties: false,
              },
              concept_adaptation: { type: "string" },
              logo_treatment: { type: "string" },
              compliance_notes: { type: "string" },
            },
            required: ["headline", "subcopy", "cta_text", "selected_assets", "color_usage", "concept_adaptation", "logo_treatment", "compliance_notes"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: { type: "function", function: { name: "creative_directive" } },
  } as Record<string, unknown>;

  const forceLogo = (directive: CreativeDirective): CreativeDirective => {
    const hasLogoSelected = directive.selected_assets?.some(
      (sa) => sa.role.toLowerCase() === "logo"
    );
    if (!hasLogoSelected) {
      const logoIndex = brandAssets.findIndex((a: any) => /\b(logo|logomark|brand\s*mark|brand\s*logo|symbol|monogram|emblem)\b/i.test(a.label || ""));
      if (logoIndex >= 0) {
        console.log(`Force-adding logo asset at index ${logoIndex}`);
        directive.selected_assets = [
          { index: logoIndex, role: "logo", placement: "top-left corner, with contrast backing if needed", reason: "Force-included: brand logo must appear" },
          ...(directive.selected_assets || []),
        ];
      }
    }
    return directive;
  };

  const processAdaptResponse = (data: any): CreativeDirective | null => {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const directive: CreativeDirective = JSON.parse(toolCall.function.arguments);
      console.log("Adapt directive:", JSON.stringify({
        headline: directive.headline,
        subcopy: directive.subcopy,
        cta: directive.cta_text,
        assetsSelected: directive.selected_assets?.length ?? 0,
      }));
      return forceLogo(directive);
    }
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const contentStr = typeof content === "string" ? content : JSON.stringify(content);
      console.warn("Adapt: No tool_calls, trying directive content extraction...");
      console.log("Adapt response content preview:", contentStr.slice(0, 300));
      const extracted = extractDirectiveFromContent(contentStr);
      if (extracted) {
        console.log("Adapt: Successfully extracted directive from content fallback");
        return forceLogo(extracted);
      }
    }
    return null;
  };

  // Build a GPT-5.5 Responses API body equivalent to adaptBody.
  // Reuses the same systemPrompt, userMessage, reference + asset images,
  // and the same `creative_directive` function schema.
  const responsesInputContent: any[] = [
    { type: "input_text", text: userMessage },
    { type: "input_text", text: "REFERENCE IMAGE (layout/style inspiration only — ignore all text/content in it):" },
    { type: "input_image", image_url: referenceImageUrl },
  ];
  for (let i = 0; i < brandAssets.length && i < 15; i++) {
    const asset = brandAssets[i];
    responsesInputContent.push(
      { type: "input_text", text: `BRAND ASSET [${i}] "${asset.label || "Unlabeled"}":` },
      { type: "input_image", image_url: asset.image_url },
    );
  }
  const adaptResponsesBody: Record<string, unknown> = {
    model: "gpt-5-5",
    input: [
      { role: "developer", content: [{ type: "input_text", text: systemPrompt }] },
      { role: "user", content: responsesInputContent },
    ],
    tools: [
      {
        type: "function",
        name: "creative_directive",
        description: "Output the complete creative directive mapping the reference concept to the brand.",
        parameters: (adaptBody as any).tools[0].function.parameters,
        strict: true,
      },
    ],
    tool_choice: "auto",
    reasoning: { effort: "high" },
  };

  const processResponsesAdapt = (data: any): CreativeDirective | null => {
    const output = Array.isArray(data?.output) ? data.output : [];
    const allObjects: any[] = [];
    const walk = (value: any) => {
      if (!value || typeof value !== "object") return;
      if (Array.isArray(value)) {
        for (const item of value) walk(item);
        return;
      }
      allObjects.push(value);
      for (const nested of Object.values(value)) walk(nested);
    };
    walk(data);

    // 1) Prefer any function_call item from GPT-5.5 Responses output, including nested variants.
    const fnCall = allObjects.find(
      (o: any) =>
        (o?.type === "function_call" || o?.type === "tool_call" || o?.type === "function") &&
        (o?.name === "creative_directive" || o?.function?.name === "creative_directive") &&
        (o?.arguments || o?.function?.arguments),
    );
    const args = fnCall?.arguments || fnCall?.function?.arguments;
    if (args) {
      try {
        const directive: CreativeDirective = typeof args === "string" ? JSON.parse(args) : args;
        console.log("Adapt directive (GPT-5.5):", JSON.stringify({
          headline: directive.headline,
          subcopy: directive.subcopy,
          cta: directive.cta_text,
          assetsSelected: directive.selected_assets?.length ?? 0,
        }));
        return forceLogo(directive);
      } catch (e: any) {
        console.warn("Failed to parse function_call arguments:", e.message);
      }
    }
    // 2) Fallback: parse any textual content from the Responses payload.
    const text = [
      data?.output_text,
      ...allObjects
        .filter((o: any) => o?.type === "output_text" || o?.type === "text" || typeof o?.text === "string")
        .map((o: any) => o.text),
      ...output
        .filter((o: any) => typeof o?.content === "string")
        .map((o: any) => o.content),
    ]
      .filter((part) => typeof part === "string" && part.trim())
      .join("\n");
    if (text) {
      console.warn("Adapt (GPT-5.5): No function_call, trying content extraction...");
      const extracted = extractDirectiveFromContent(typeof text === "string" ? text : JSON.stringify(text));
      if (extracted) return forceLogo(extracted);
    }
    console.warn("Adapt (GPT-5.5): no directive found in response keys:", JSON.stringify(Object.keys(data || {})));
    return null;
  };

  // Try kie.ai GPT-5.5 once, then fail fast to Lovable AI if it's slow/degraded.
  let lastAdaptError: Error | null = null;
  for (let attempt = 1; attempt <= 1; attempt++) {
    try {
      if (attempt > 1) console.log(`Adapt step retry attempt ${attempt}...`);
      const data = await kieResponses(apiKey, adaptResponsesBody, KIE_REASONING_TIMEOUT_MS);
      const directive = processResponsesAdapt(data);
      if (directive) return directive;
      throw new Error("No directive extracted from Adapt step (GPT-5.5)");
    } catch (err: any) {
      lastAdaptError = err;
      console.error(`Adapt attempt ${attempt} failed:`, err.message);
      if (err.message === "CREDITS_EXHAUSTED" || err.message === "KIE_RATE_LIMITED") {
        console.warn(`kie.ai Adapt unavailable (${err.message}); moving to fallback provider.`);
        break;
      }
      if (attempt < 1) await sleep(3000);
    }
  }


  // kie.ai exhausted — try Lovable AI Gateway fallback with the same body.
  console.warn("⚠️ All kie.ai Adapt attempts failed. Trying Lovable AI Gateway fallback...");
  try {
    const fallbackUserContent: any[] = [
      { type: "text", text: userMessage },
      { type: "text", text: "REFERENCE IMAGE (layout/style inspiration only — ignore all text/content in it):" },
    ];
    const referencePart = await buildLovableImagePart(referenceImageUrl, "adapt reference image");
    if (referencePart) fallbackUserContent.push(referencePart);

    let includedAssets = 0;
    for (let i = 0; i < brandAssets.length && includedAssets < 6; i++) {
      const asset = brandAssets[i];
      const imagePart = await buildLovableImagePart(asset.image_url, `adapt brand asset [${i}]`);
      if (!imagePart) continue;
      fallbackUserContent.push(
        { type: "text", text: `BRAND ASSET [${i}] "${asset.label || "Unlabeled"}":` },
        imagePart,
      );
      includedAssets += 1;
    }

    if (!referencePart && includedAssets === 0) {
      throw new Error("No fallback-safe images available for Adapt step");
    }

    const fallbackAdaptBody = {
      ...adaptBody,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: fallbackUserContent },
      ],
    } as Record<string, unknown>;

    const data = await lovableChat(fallbackAdaptBody, LOVABLE_REASONING_TIMEOUT_MS);
    const directive = processAdaptResponse(data);
    if (directive) {
      console.log("✅ Adapt directive produced via Lovable AI fallback");
      return directive;
    }
    throw new Error("Lovable AI fallback returned no directive");
  } catch (fallbackErr: any) {
    console.error("Lovable AI Adapt fallback also failed:", fallbackErr.message);
    console.warn("Adapt fallback unavailable — continuing with local directive so generation can proceed.");
    return forceLogo(buildLocalDirectiveFallback(brand, brandAssets, creativeMood));
  }
}


// ─────────────────────────────────────────────────────
// Step 3 — Generate creative using kie.ai image API
// ─────────────────────────────────────────────────────
function buildDirectivePrompt(
  directive: CreativeDirective,
  framework: Record<string, unknown>,
  brand: any,
  selectedAssets: any[],
  spec: { width: number; height: number; label: string; aspectRatio: string }
): string {
  const aspectRatioLabel = spec.aspectRatio;

  const assetRoleLines = directive.selected_assets
    .map((sa) => {
      const matchedAsset = selectedAssets.find((a: any) =>
        (a._originalIndex ?? -1) === sa.index
      );
      const assetLabel = matchedAsset ? (matchedAsset.label || "Asset") : `Asset #${sa.index}`;
      const roleHint = getAssetRoleInstruction(assetLabel);
      return `  • [${sa.role.toUpperCase()}] "${assetLabel}" → ${sa.placement} | ${roleHint}`;
    })
    .join("\n");

  const _nevers = splitNevers(brand.negative_prompts);
  // Image prompt = visual nevers + general (legacy). Content nevers go to copy only.
  const negativePrompts = toCompactText([_nevers.visual, _nevers.general].filter(Boolean).join(" "), 3000);

  return `⚠️⚠️⚠️ CRITICAL — OUTPUT SIZE IS ${spec.width}x${spec.height} PIXELS (${aspectRatioLabel}). THIS IS THE #1 RULE. ⚠️⚠️⚠️

═══ IMAGE ROLES (READ FIRST) ═══
• IMAGE 1 = REFERENCE. Use ONLY for layout, composition, zoning, type hierarchy, and visual energy.
  ⛔ NEVER reuse its subjects, characters, people, buildings, products, mascots, locations, prices, currencies, logos, or text.
  Treat IMAGE 1 like a wireframe overlay: read its STRUCTURE, ignore its CONTENT.
• IMAGE 2 = BRAND LOGO. MUST appear in the output with exact letterforms, shapes, and colors.
• IMAGES 3..N = BRAND ASSETS. These are the ONLY allowed visual subjects in the output.

ANTI-LEAK: All people, places, buildings, products, mascots, graphics, and text in the final output MUST come from IMAGES 2..N and the brand data below. NOTHING visible in IMAGE 1 may appear in the output.

═══ CREATIVE DIRECTIVE ═══
HEADLINE: "${directive.headline}"
SUBCOPY: "${directive.subcopy}"
CTA: "${directive.cta_text}"

COLORS: bg ${directive.color_usage.background} | headline ${directive.color_usage.headline_color} | subcopy ${directive.color_usage.subcopy_color} | CTA bg ${directive.color_usage.cta_background} text ${directive.color_usage.cta_text}

ASSETS:
${assetRoleLines}

CONCEPT: ${directive.concept_adaptation}
LOGO: ${directive.logo_treatment}

═══ RULES ═══
• Follow IMAGE 1 layout/composition/energy ONLY — rebuild it using BRAND assets and BRAND colors. NEVER recreate or imitate IMAGE 1's imagery or copy.
• Logo: reproduce EXACT letterforms, shapes, colors from the provided logo image. NEVER write "LOGO" as text
• Architecture/3D: preserve exact building geometry from brand assets. May enhance lighting/angle
• Text on solid zones or panels only — NEVER on photos/renders
• Headline bold + large, subcopy medium, CTA clean. Max 3 hierarchy levels
• If logo contains brand name, do NOT repeat as text
${negativePrompts ? `• ⛔ NEVER: ${negativePrompts}` : ""}

⚠️⚠️⚠️ FINAL CHECK: Output MUST be ${spec.width}x${spec.height} pixels (${aspectRatioLabel}). Generate NOW.`;
}

function buildFallbackPrompt(
  framework: Record<string, unknown>,
  brand: any,
  brandAssets: any[],
  spec: { width: number; height: number; label: string; aspectRatio: string }
): string {
  const extraColorsText =
    brand.extra_colors && Array.isArray(brand.extra_colors) && brand.extra_colors.length > 0
      ? `Additional Colors:\n${brand.extra_colors.map((c: any) => `  - ${c.name || "Unnamed"}: ${c.hex}`).join("\n")}`
      : "";

  const brandVoice = toCompactText(brand.brand_voice_rules, 4000);
  const _fbNevers = splitNevers(brand.negative_prompts);
  const negativePrompts = toCompactText([_fbNevers.visual, _fbNevers.general].filter(Boolean).join(" "), 3000);
  const brandBrief = toCompactText(brand.brand_brief, 8000);

  const brandContext = [
    `Brand Name: ${brand.name}`,
    `Primary Color: ${brand.primary_color}`,
    `Secondary Color: ${brand.secondary_color}`,
    extraColorsText,
    brandVoice ? `Tone & Audience: ${brandVoice}` : "",
    negativePrompts ? `STRICT EXCLUSIONS (never include these): ${negativePrompts}` : "",
    brandBrief ? `Brand Guidelines & Brief: ${brandBrief}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const selectedAssets = brandAssets.slice(0, 5);
  const hasAssets = selectedAssets.length > 0;

  const logoAssets = selectedAssets.filter((a: any) => /\b(logo|logomark|brand\s*mark|brand\s*logo|symbol|monogram|emblem)\b/i.test(a.label || ""));
  const architectureAssets = selectedAssets.filter((a: any) =>
    /architect|3d|render|building|elevation|facade/i.test(a.label || "")
  );
  const heroAssets = selectedAssets.filter((a: any) =>
    /hero|lifestyle|product|mascot|master/i.test(a.label || "")
  );
  const otherAssets = selectedAssets.filter(
    (a: any) =>
      !logoAssets.includes(a) && !architectureAssets.includes(a) && !heroAssets.includes(a)
  );

  const assetRoleDescriptions = [
    ...logoAssets.map((a: any) => `  🔷 LOGO: "${a.label || "Logo"}" — Place in brand mark zone.`),
    ...architectureAssets.map((a: any) => `  🏗️ 3D RENDER: "${a.label || "Architecture"}" — Hero visual.`),
    ...heroAssets.map((a: any) => `  🖼️ HERO: "${a.label || "Visual"}" — Primary/secondary visual.`),
    ...otherAssets.map((a: any) => `  📎 ASSET: "${a.label || "Asset"}" — Use in appropriate zone.`),
  ].join("\n");

  const aspectRatioLabel = spec.aspectRatio;
  const frameworkJson = JSON.stringify(sanitizeFramework(framework), null, 2);

  return `⚠️⚠️⚠️ CRITICAL — OUTPUT SIZE IS ${spec.width}×${spec.height} PIXELS (${aspectRatioLabel}). THIS IS THE #1 RULE. ⚠️⚠️⚠️

CONTENT ISOLATION: The reference image (IMAGE 1) is for LAYOUT and VISUAL STYLE only. NEVER copy any text, names, locations, prices, currencies from it. ALL text comes from brand data below.
IMAGE ISOLATION: NEVER reproduce, copy, or recreate imagery from the reference. ALL visuals must come from the brand's own uploaded assets.

═══ DESIGN DIRECTION ═══
Follow the reference image's layout, composition, and visual energy. Adapt it to the brand assets and colors below.

LOGO: The brand logo is provided as a separate labeled image. Study it carefully and reproduce its EXACT letterforms, icon shapes, colors, and proportions. NEVER write "LOGO" as text.
TEXT PLACEMENT: Text MUST be on solid color zones, gradient overlays, or dedicated panels — NEVER on photos/renders.
TYPOGRAPHY: Headline ≤8 words bold. Subcopy ≤20 words. CTA clean. All text legible.

═══ BRAND DATA ═══
${brandContext}
${brandBrief ? `\nBrand Brief instructions are MANDATORY.` : ""}
${negativePrompts ? `\n⛔ NEVER INCLUDE: ${negativePrompts}` : ""}

═══ REFERENCE FRAMEWORK ═══
${frameworkJson}

${hasAssets ? `BRAND ASSETS (${selectedAssets.length} images provided after reference):
${assetRoleDescriptions}` : `No assets. Use "${brand.name}" text with brand colors.`}

⚠️⚠️⚠️ FINAL CHECK: Output MUST be ${spec.width}×${spec.height} pixels (${aspectRatioLabel}). Generate NOW.`;
}


// ─── Image generation via kie.ai async task API ───
async function generateCreative(
  framework: Record<string, unknown>,
  brand: any,
  brandAssets: any[],
  referenceImageUrl: string,
  spec: { width: number; height: number; label: string; aspectRatio: string },
  apiKey: string,
  directive: CreativeDirective | null,
  onTaskCreated?: (taskId: string) => Promise<void> | void,
): Promise<{ imageBase64: string; captionText: string }> {
  let systemPrompt: string;
  let selectedAssets: any[];

  if (directive) {
    // Dedupe selected asset indices, validate against brandAssets bounds
    const seen = new Set<number>();
    const validIndices = directive.selected_assets
      .map((sa) => sa.index)
      .filter((i) => {
        if (i < 0 || i >= brandAssets.length) return false;
        if (seen.has(i)) return false;
        seen.add(i);
        return true;
      });
    selectedAssets = validIndices.map((i) => {
      return { ...brandAssets[i], _originalIndex: i };
    });

    if (selectedAssets.length === 0 && brandAssets.length > 0) {
      selectedAssets = brandAssets.slice(0, 3).map((a: any, i: number) => ({ ...a, _originalIndex: i }));
    }

    systemPrompt = buildDirectivePrompt(directive, framework, brand, selectedAssets, spec);
  } else {
    selectedAssets = brandAssets.slice(0, 5);
    systemPrompt = buildFallbackPrompt(framework, brand, brandAssets, spec);
  }

  // Build the full prompt text for kie.ai image generation
  // Include the system prompt + asset descriptions
  const promptParts: string[] = [systemPrompt];

  // Reinforce reference role at the image-input level — the model sees this right
  // before the multimodal image_input array. Reference is IMAGE 1 (layout only),
  // logo is IMAGE 2 (mandatory), and brand assets follow as IMAGES 3..N.
  promptParts.push(
    "\nIMAGE 1 — REFERENCE (layout/composition/zoning blueprint ONLY). " +
    "Do NOT depict any subject, person, building, product, text, location, price, or logo visible in IMAGE 1. " +
    "Read its structure; ignore its content."
  );

  // Collect all image URLs for image_input
  const imageInputUrls: string[] = [referenceImageUrl];

  if (directive) {
    // Dedupe sort key so the same asset can't appear twice in the input list.
    const seenIdx = new Set<number>();
    const sortedAssets = [...directive.selected_assets]
      .filter((sa) => {
        if (seenIdx.has(sa.index)) return false;
        seenIdx.add(sa.index);
        return true;
      })
      .sort((a, b) => {
        const aIsLogo = a.role.toUpperCase() === "LOGO" ? 0 : 1;
        const bIsLogo = b.role.toUpperCase() === "LOGO" ? 0 : 1;
        return aIsLogo - bIsLogo;
      });

    for (const sa of sortedAssets) {
      const asset = selectedAssets.find((a: any) => (a._originalIndex ?? -1) === sa.index);
      if (!asset) continue;
      const roleLabel = sa.role.toUpperCase();
      const imgNum = imageInputUrls.length + 1;
      if (roleLabel === "LOGO") {
        promptParts.push(`\nIMAGE ${imgNum} — BRAND LOGO (mandatory in output): reproduce EXACT letterforms, colors, shapes, and proportions. This is the ONLY logo to use.`);
      } else {
        promptParts.push(`\nIMAGE ${imgNum} — BRAND ${roleLabel} (allowed visual subject): ${sa.placement}`);
      }
      imageInputUrls.push(asset.image_url);
    }
  } else {
    for (const asset of selectedAssets) {
      const isLogo = /\b(logo|logomark|brand\s*mark|brand\s*logo|symbol|monogram|emblem)\b/i.test(asset.label || "");
      const roleHint = isLogo ? "BRAND LOGO — must appear in output" : `BRAND ASSET (${(asset.label || "Asset").toUpperCase()})`;
      const imgNum = imageInputUrls.length + 1;
      promptParts.push(`\nIMAGE ${imgNum} — ${roleHint}`);
      imageInputUrls.push(asset.image_url);
    }
  }

  promptParts.push(`\n⚠️ FINAL REMINDER — OUTPUT DIMENSIONS: This image MUST be ${spec.aspectRatio} aspect ratio (${spec.width}×${spec.height} pixels). Do NOT match the reference image dimensions.`);

  const fullPrompt = promptParts.join("\n");

  // Model fallback plan for kie.ai (slugs verified against docs.kie.ai 2026-04)
  //   - nano-banana-2          → up to 14 image_input, most reliable
  //   - google/nano-banana-edit → up to 10 image_urls (different schema, handled in kieGenerateImage)
  //   - nano-banana-pro        → up to 8 image_input, highest quality but E006-prone with many inputs
  // GPT Image 2 supports 2K for non-1:1 ratios; 1:1 is capped at 1K per kie.ai docs.
  // Primary: Nano Banana Pro @ 1K (best quality model, 1K is materially faster than 2K).
  // Fallbacks preserved for resilience if Pro fails or input count exceeds its cap.
  // Primary: GPT Image 2 (per user request 2026-07). Nano Banana Pro/2/Edit stay as fallbacks.
  // GPT Image 2 supports 2K for non-1:1 aspect ratios; 1:1 capped at 1K per kie.ai docs.
  const gptResolution = spec.aspectRatio === "1:1" ? "1K" : "2K";
  const modelPlan = [
    { model: "gpt-image-2-image-to-image", label: "GPT Image 2", resolution: gptResolution, maxInputs: 10 },
    { model: "nano-banana-pro", label: "Nano Banana Pro", resolution: "1K", maxInputs: 8 },
    { model: "nano-banana-2", label: "Nano Banana 2", resolution: "1K", maxInputs: 14 },
    { model: "google/nano-banana-edit", label: "Nano Banana Edit", resolution: "1K", maxInputs: 10 },
  ];

  let lastError: Error | null = null;

  for (const { model, label, resolution, maxInputs } of modelPlan) {
    // Skip if input count exceeds model's hard limit (avoids guaranteed E006).
    // Pro is also empirically flaky above 4 inputs even though spec allows 8.
    const effectiveCap = model === "nano-banana-pro" ? Math.min(maxInputs, 4) : maxInputs;
    if (imageInputUrls.length > effectiveCap) {
      console.warn(`[${label}] skipped — ${imageInputUrls.length} inputs exceeds cap of ${effectiveCap}`);
      continue;
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`Using model: ${label} @ ${resolution} (attempt ${attempt}/2)`);

      try {
        const resultUrl = await kieGenerateImage(
          apiKey,
          fullPrompt,
          imageInputUrls,
          spec.aspectRatio,
          model,
          resolution,
          onTaskCreated,
        );

        // Download the generated image
        console.log(`Downloading generated image from kie.ai...`);
        const { base64, bytes } = await downloadImageAsBase64(resultUrl);

        const dims = extractImageDimensions(bytes);
        if (dims) {
          console.log(`[${label}] Generated image: ${dims.width}×${dims.height}`);
        }

        const captionText = directive
          ? `${directive.headline}\n${directive.subcopy}\n${directive.cta_text}`
          : "";

        return { imageBase64: base64, captionText };
      } catch (err: any) {
        lastError = err;
        console.error(`[${label}] attempt ${attempt} failed:`, err.message);

        if (err.message === "CREDITS_EXHAUSTED") throw err;

        if (err.message === "KIE_RATE_LIMITED") {
          const waitMs = 5000 * attempt;
          console.warn(`[${label}] rate limited, waiting ${waitMs}ms...`);
          await sleep(waitMs);
          continue;
        }

        if (attempt < 2) {
          await sleep(3000);
          continue;
        }
      }
    }
  }

  if (lastError?.message === "CREDITS_EXHAUSTED") throw lastError;
  throw new Error(lastError?.message || "All kie.ai models failed");
}

// ─────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────
// Long-running pipeline extracted so it can run in the background via
// EdgeRuntime.waitUntil(). Image generation can take >150s (the edge runtime
// idle timeout), which previously surfaced to the client as a 504
// IDLE_TIMEOUT even though the work succeeded server-side. We now return 202
// immediately and the client polls the `generations` row for completion.
async function runGenerationPipeline(params: {
  brandId: string;
  referenceImageUrl: string;
  generationId: string;
  outputFormat: string;
  apiKey: string;
  usingKie: boolean;
}) {
  const { brandId, referenceImageUrl, generationId, outputFormat, apiKey } = params;
  const spec = FORMAT_SPECS[outputFormat] || FORMAT_SPECS.landscape;
  console.log(`[gen ${generationId}] pipeline started brand=${brandId} format=${outputFormat} provider=${params.usingKie ? "kie" : "lovable"}`);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let generationUserId: string | null = null;
  let creditConsumed = false;

  const markFailed = async (reason: string) => {
    console.error(`[gen ${generationId}] FAILED:`, reason);
    await supabase.from("generations").update({ status: "failed" }).eq("id", generationId);
    // Refund the optimistically-consumed credit so failures don't burn user credit.
    if (creditConsumed && generationUserId) {
      const { error: refundErr } = await supabase.rpc("refund_credit", { _user_id: generationUserId });
      if (refundErr) console.error("Credit refund failed:", refundErr);
      else console.log("Refunded 1 credit to", generationUserId);
      creditConsumed = false;
    }
  };

  try {
    // Re-fetch user for credit accounting
    const { data: genRec } = await supabase
      .from("generations")
      .select("user_id")
      .eq("id", generationId)
      .single();
    generationUserId = genRec?.user_id ?? null;
    // Credit was consumed atomically by the request handler before this pipeline
    // started; on failure we refund it.
    creditConsumed = !!generationUserId;

    // Fetch brand + assets in parallel
    const [brandRes, assetsRes] = await Promise.all([
      supabase.from("brands").select("*").eq("id", brandId).single(),
      supabase.from("brand_assets").select("image_url, label").eq("brand_id", brandId),
    ]);

    if (brandRes.error || !brandRes.data) {
      await markFailed("Brand not found");
      return;
    }

    const brand = brandRes.data;
    const SUPPORTED_IMAGE_EXTS = /\.(png|jpe?g|webp|gif)(\?.*)?$/i;
    const brandAssets = (assetsRes.data || []).filter((a: any) => {
      if (!a.image_url) return false;
      try {
        const pathname = new URL(a.image_url).pathname;
        if (!SUPPORTED_IMAGE_EXTS.test(pathname)) return false;
      } catch {
        if (!SUPPORTED_IMAGE_EXTS.test(a.image_url)) return false;
      }
      return true;
    });

    const { data: existingGeneration } = await supabase
      .from("generations")
      .select("status, layout_guide, copywriting, output_image_url")
      .eq("id", generationId)
      .maybeSingle();

    const existingFramework = parseStoredFramework(existingGeneration?.layout_guide);

    // ── Step 1: Analyze ──
    let framework: Record<string, unknown>;
    if (existingFramework) {
      console.log(`[gen ${generationId}] reusing valid stored framework`);
      framework = existingFramework;
      await supabase.from("generations").update({ status: "generating" }).eq("id", generationId);
    } else {
      if (existingGeneration?.layout_guide) {
        console.warn(`[gen ${generationId}] stored layout_guide is empty/invalid — re-analyzing`);
      }
      await supabase.from("generations").update({ status: "analyzing" }).eq("id", generationId);
      const analyzeStart = Date.now();
      try {
        framework = await analyzeFramework(referenceImageUrl, apiKey, spec.aspectRatio, brand);
        console.log(`[Timing] framework_analysis total=${Date.now() - analyzeStart}ms`);
      } catch (err) {
        console.error(`[Timing] framework_analysis failed total=${Date.now() - analyzeStart}ms`, err);
        await markFailed(
          `AI is temporarily degraded (framework step). Please retry — no credit was used. (${err instanceof Error ? err.message : err})`,
        );
        return;
      }

      if (!isValidFramework(framework)) {
        console.warn(`[gen ${generationId}] analyzed framework is incomplete — coercing to safe shape`);
        framework = ensureFrameworkShape(framework);
      }

      await supabase
        .from("generations")
        .update({
          layout_guide: JSON.stringify(framework),
          status: "adapting",
          output_format: outputFormat,
          requested_aspect_ratio: spec.aspectRatio,
          requested_width: spec.width,
          requested_height: spec.height,
        })
        .eq("id", generationId);
    }

    // ── Step 2: Adapt ──
    // Hard-fail if Adapt fails on all tiers (kie primary + retry + Lovable AI fallback).
    // No silent fallback to a generic directive — credits are only deducted on success,
    // so the user is never charged for a degraded output.
    let directive: CreativeDirective;
    const adaptStart = Date.now();
    try {
      await supabase.from("generations").update({ status: "adapting" }).eq("id", generationId);
      directive = await adaptDirective(framework, brand, brandAssets, referenceImageUrl, spec, apiKey);
      console.log(`[Timing] adapt_directive total=${Date.now() - adaptStart}ms`);
    } catch (err) {
      console.error(`[Timing] adapt_directive failed total=${Date.now() - adaptStart}ms`, err);
      await markFailed(
        `AI is temporarily degraded (adapt step). Please retry — no credit was used. (${err instanceof Error ? err.message : err})`,
      );
      return;
    }

    // ── Step 3: Generate ──
    await supabase.from("generations").update({ status: "generating" }).eq("id", generationId);

    let imageBase64: string;
    let captionText: string;

    // Persist Kie task id on the generations row so a recovery endpoint can
    // finalize this row if the edge worker is killed during the long poll.
    const persistTaskId = async (taskId: string) => {
      await supabase.from("generations").update({ kie_task_id: taskId }).eq("id", generationId);
    };

    const renderStart = Date.now();
    try {
      const result = await generateCreative(
        framework, brand, brandAssets, referenceImageUrl, spec, apiKey, directive, persistTaskId,
      );
      imageBase64 = result.imageBase64;
      captionText = result.captionText;
      console.log(`[Timing] image_render total=${Date.now() - renderStart}ms`);
    } catch (err: any) {
      console.error(`[Timing] image_render failed total=${Date.now() - renderStart}ms`);
      await markFailed(err?.message || "AI generation failed");
      return;
    }

    let finalImageBase64 = imageBase64;
    let base64Data = finalImageBase64.replace(/^data:image\/\w+;base64,/, "");
    let imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    let actualDims = extractImageDimensions(imageBytes);
    let ratioMatch = actualDims ? isAspectRatioMatch(actualDims, spec) : null;

    if (ratioMatch === false && actualDims) {
      await supabase.from("generations").update({ status: "retrying_aspect_ratio" }).eq("id", generationId);
      try {
        const retryResult = await generateCreative(
          framework, brand, brandAssets, referenceImageUrl, spec, apiKey, directive, persistTaskId,
        );
        const retryBase64 = retryResult.imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const retryBytes = Uint8Array.from(atob(retryBase64), (c) => c.charCodeAt(0));
        const retryDims = extractImageDimensions(retryBytes);
        const retryMatch = retryDims ? isAspectRatioMatch(retryDims, spec) : null;
        if (retryMatch !== false) {
          finalImageBase64 = retryResult.imageBase64;
          base64Data = retryBase64;
          imageBytes = retryBytes;
          actualDims = retryDims;
          ratioMatch = retryMatch;
          if (retryResult.captionText) captionText = retryResult.captionText;
        }
      } catch (retryErr) {
        console.warn("Aspect ratio retry failed:", retryErr);
      }
    }

    const outputPath = `generations/${generationId}.png`;
    const { error: uploadError } = await supabase.storage
      .from("brand-assets")
      .upload(outputPath, imageBytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      await markFailed(`Upload failed: ${uploadError.message}`);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("brand-assets").getPublicUrl(outputPath);

    const finalCaption =
      captionText ||
      (directive ? `${directive.headline}\n${directive.subcopy}\n${directive.cta_text}` : "");

    const copywritingData: Record<string, any> = { caption: finalCaption };
    if (ratioMatch === false) {
      copywritingData.aspect_ratio_mismatch = true;
      copywritingData.qc_issues = [
        `Aspect ratio mismatch: expected ${spec.aspectRatio} (${spec.width}×${spec.height}), got ${actualDims?.width}×${actualDims?.height}`
      ];
    }

    const { error: updateError } = await supabase
      .from("generations")
      .update({
        output_image_url: publicUrlData.publicUrl,
        layout_guide: JSON.stringify(framework),
        copywriting: copywritingData,
        status: "completed",
        output_format: outputFormat,
        requested_aspect_ratio: spec.aspectRatio,
        requested_width: spec.width,
        requested_height: spec.height,
        actual_width: actualDims?.width ?? 0,
        actual_height: actualDims?.height ?? 0,
      })
      .eq("id", generationId);

    if (updateError) {
      console.error("CRITICAL: Final DB update failed!", updateError);
    }

    // Credit was atomically consumed before pipeline started; mark as committed
    // so the failure handler doesn't refund it.
    creditConsumed = false;

    console.log(`[gen ${generationId}] completed`);
  } catch (e) {
    await markFailed(e instanceof Error ? e.message : "Unknown background error");
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    // ── Authentication: require a valid JWT ──
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const callerId = userData.user.id;

    const { brandId, referenceImageUrl, generationId, outputFormat = "landscape" } =
      await req.json();

    if (!brandId || !referenceImageUrl || !generationId) {
      return new Response(
        JSON.stringify({ error: "brandId, referenceImageUrl, and generationId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── SSRF guard: only allow reference URLs from our own Supabase storage ──
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const storagePrefix = `${supabaseUrl}/storage/v1/`;
    if (!referenceImageUrl.startsWith(storagePrefix)) {
      return new Response(
        JSON.stringify({ error: "referenceImageUrl must be a Supabase storage URL" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const KIE_KEY = Deno.env.get("KIE_API_KEY");
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    const apiKey = KIE_KEY || LOVABLE_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "No AI API key configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const usingKie = !!KIE_KEY;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── Ownership check: caller must own the generation row (or be admin) ──
    const { data: genRec } = await supabase
      .from("generations")
      .select("user_id")
      .eq("id", generationId)
      .single();
    const generationUserId: string | null = genRec?.user_id ?? null;
    if (!generationUserId) {
      return new Response(
        JSON.stringify({ error: "Generation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (generationUserId !== callerId) {
      const { data: roleRow } = await supabase
        .from("user_roles").select("role").eq("user_id", callerId).eq("role", "admin").maybeSingle();
      if (!roleRow) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (generationUserId) {
      // Atomic check-and-decrement — eliminates the TOCTOU race where two
      // concurrent requests both see credits>0 and both run.
      const { data: consumed, error: consumeErr } = await supabase.rpc(
        "try_consume_credit",
        { _user_id: generationUserId }
      );
      if (consumeErr) {
        console.error("try_consume_credit failed:", consumeErr);
        await supabase.from("generations").update({ status: "failed" }).eq("id", generationId);
        return new Response(
          JSON.stringify({ error: "Credit check failed" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!consumed) {
        await supabase.from("generations").update({ status: "failed" }).eq("id", generationId);
        return new Response(
          JSON.stringify({ error: "No credits remaining" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Kick off the long-running pipeline in the background ──
    // EdgeRuntime.waitUntil keeps the worker alive after we send the response,
    // so kie.ai polling (often >150s) no longer hits the request idle timeout.
    const work = runGenerationPipeline({
      brandId,
      referenceImageUrl,
      generationId,
      outputFormat,
      apiKey,
      usingKie,
    });

    // @ts-ignore – EdgeRuntime is provided by the Supabase edge runtime
    if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(work);
    } else {
      // Fallback: detach so the response isn't blocked
      work.catch((err) => console.error("Background pipeline error:", err));
    }

    return new Response(
      JSON.stringify({
        status: "accepted",
        generationId,
        message: "Generation started — poll the generations row for completion.",
      }),
      { status: 202, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-creative OUTER error:", e);
    try {
      const body = await req.clone().json().catch(() => ({}));
      const gId = body?.generationId;
      if (gId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase.from("generations").update({ status: "failed" }).eq("id", gId);
      }
    } catch (cleanupErr) {
      console.error("Failed to mark generation as failed:", cleanupErr);
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
