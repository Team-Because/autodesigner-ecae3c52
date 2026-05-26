
# Analysis

## Issue 1 — Creek / Amansara have no imagery in outputs

Both brands have **only a Logo asset in their library** (1 row each in `brand_assets`, labeled "Logo"). No architecture render, no hero/lifestyle photo, no mascot.

Recent comparison:
- **17–23 May completions**: visuals were synthesized from the brand brief + reference style (architectural mood, dusk skies, etc.) and logo was overlaid.
- **24–26 May completions** (e.g. ecd355b3, 97c10273): mostly text-on-color with logo, no synthesized imagery.

Cause is in `buildDirectivePrompt` / render-prompt assembly inside `supabase/functions/generate-creative/index.ts`:

```text
IMAGE ISOLATION: NEVER reproduce, copy, or recreate imagery from the reference.
ALL visuals must come from the brand's own uploaded assets.
```

…combined with the new per-image labels:

```text
IMAGE 1 — REFERENCE (layout/composition/zoning blueprint ONLY).
Do NOT depict any subject, person, building, product, text, location, price,
or logo visible in IMAGE 1. Read its structure; ignore its content.
```

When a brand has **only a logo** (no hero/architecture/product assets), the model is told:
1. Don't borrow any subject from the reference.
2. Use only brand-uploaded assets — of which there are none beyond the logo.

So it has nothing left to render and ships text + logo on a color field. Pre-Phase 3 prompts allowed the renderer to invent on-brief imagery from the brand brief, which is what Creek/Amansara used to get.

## Issue 2 — ~48% generation failures over the last 3 days

`generations` last 3 days: 35 completed, 32 failed, 1 processing. Edge function logs show the failure mode clearly:

- kie.ai Framework Analysis: `Signal timed out` (45s cap) or `server is currently being maintained`
- Lovable AI Gateway fallback: also `Signal timed out` (60s cap)
- Both legs fail → hard-fail `AI is temporarily degraded`, no credit charged

So kie is currently slow/flaky, and our fallback budget (45s kie + 60s Lovable, single attempt each) is too tight when both providers run hot.

# Plan

Single file: `supabase/functions/generate-creative/index.ts`. No schema, frontend, or memory changes.

## A — Bring back synthesized imagery when brand has no visual assets

1. Detect "no hero visuals available": `brandAssets.filter(non-logo).length === 0`.
2. When true, replace the strict IMAGE ISOLATION block in `buildDirectivePrompt` (and the parallel fallback prompt) with a softer variant:
   - Still forbid copying reference **subjects, text, names, locations, prices, logos**.
   - **Allow** synthesizing on-brief imagery from the brand brief (`Brand Guidelines & Brief` + Visual Direction) using the reference's composition/mood.
   - Add explicit instruction: "Since no brand visual assets were uploaded, **invent** an image that visually represents the brand category (e.g. an original architectural render for a real-estate brand) honoring the brand brief, color palette, and visual nevers — do not recreate the reference's specific building/person/product."
3. Keep the strict isolation behavior unchanged when the brand DOES have ≥1 non-logo asset (so Vaikunth / Kalrav / brands with proper asset libraries keep the existing strict behavior).
4. Update the IMAGE 1 reinforcement line right before `image_input` so it conditionally allows "category-appropriate invented imagery" only in the asset-less case.

This restores the May 17–23 behavior for asset-less brands without re-introducing the leak problem for asset-rich brands.

## B — Reduce failure rate from reasoning-stage timeouts

1. Raise `KIE_REASONING_TIMEOUT_MS` from 45s → 75s (kie.ai p95 on its good days is ~40–55s).
2. Raise `LOVABLE_REASONING_TIMEOUT_MS` from 60s → 90s.
3. Bump kie `maxRetries` for Framework + Adapt from 1 → 2 (one quick retry on transient maintenance errors).
4. Add a **second Lovable AI fallback model** after `google/gemini-2.5-pro` fails: `google/gemini-2.5-flash` (faster, lighter — last-resort safety net before hard-fail). Same prompts, same tool schema.
5. Total worst-case budget stays under the edge runtime ceiling: kie (2×75s) + Lovable Pro (90s) + Lovable Flash (60s) ≈ 5 min for framework + same for adapt — within `EdgeRuntime.waitUntil` async path that's already in place.
6. Keep timing logs (`[Timing] framework_analysis`, `adapt_directive`) and add per-attempt provider/model labels so we can see which leg passed.

## C — Verification

After deploy:
- Re-generate for Creek and Amansara → expect synthesized architectural/lifestyle imagery + logo, like the May 17 outputs.
- Re-generate for a brand with proper hero assets (e.g. Vaikunth) → expect no leak from reference, only brand assets used.
- Watch `[Timing]` logs over the next ~30 mins: expect failure rate to drop materially as the second Lovable fallback absorbs cases where both first attempts time out.

# Technical scope

**File touched:** `supabase/functions/generate-creative/index.ts` only.

**Functions modified:**
- `buildDirectivePrompt` — branch on `nonLogoAssetCount === 0` for the isolation/synthesis block.
- `buildFallbackPrompt` — same branching.
- `generateCreative` — adjust the IMAGE 1 reinforcement line based on the same flag.
- `analyzeFramework` / `adaptDirective` — raise timeouts, add second Lovable fallback model, bump kie retries to 2.

**Constants changed:** `KIE_REASONING_TIMEOUT_MS`, `LOVABLE_REASONING_TIMEOUT_MS`, kie `maxRetries`.

**Unchanged:** image-generation kie path, RLS, frontend, schema, all memory rules, credit logic.

**Risk:** Low. Asset-less path only loosens for brands that already had no imagery anyway; asset-rich brands keep the strict rules that protect Vaikunth/Kalrav.

# What I need from you

A "go" to implement A + B together.
