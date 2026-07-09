# Switch Primary Models to GPT-5.5 + GPT Image 2

## Goal
Move the pipeline's primary models to the ones you asked for, while keeping today's fallback chain (Lovable AI Gateway) intact so nothing gets more fragile.

## New model plan

| Stage | Primary (new) | Fallback 1 | Fallback 2 |
|---|---|---|---|
| **1. Framework Analysis** | **GPT-5.5** via kie.ai `/codex/v1/responses` (`gpt-5-5`, reasoning: high) | Gemini 3 Pro thinking via kie.ai (current primary) | Lovable AI `google/gemini-2.5-pro` |
| **2. Adapt Directive (mood/style/copy)** | **GPT-5.5** via kie.ai Responses API (already wired) | Lovable AI `openai/gpt-5.5` (structured output) | Local safety directive (already exists) |
| **3. Image Render** | **GPT Image 2** via kie.ai (`/gpt-image/…` job endpoint) | Nano Banana Pro via kie.ai (current primary → demoted) | Lovable AI `google/gemini-3.1-flash-image` |

Reasoning stays "thinking" everywhere; only the model changes.

## What actually changes in code (`supabase/functions/generate-creative/index.ts`)

1. **`analyzeFramework`**
   - Swap the current kie chat call (`gemini-3-pro/v1/chat/completions`) for a `kieResponses` call to `gpt-5-5` on `/codex/v1/responses`, reusing the existing `framework_analysis` tool schema converted to the Responses `tools` shape (already done for Adapt, same pattern).
   - Attach the reference image as an `input_image` block (Responses supports vision).
   - On timeout/parse-fail → fall through to existing Gemini 3 Pro thinking call → then Lovable AI fallback.

2. **`adaptDirective`**
   - Already on GPT-5.5. No change beyond confirming timeouts (keep the shortened values from the last fix).

3. **Image render (`renderNanoBanana` → rename `renderImage`)**
   - New primary path: create kie GPT Image 2 job (`/gpt-image/generate` or the current kie image job endpoint — will confirm from the kie docs when building), poll same way as Nano Banana today.
   - Reuse the identical prompt, reference-image, and logo-image payload builder — no prompt changes.
   - On failure → fall back to Nano Banana Pro (existing code path, unchanged) → then Lovable AI image fallback.

4. **Logging**
   - Extend the existing `[Timing]` and `[gen …]` logs to record which model actually served each stage, so the next time quality drifts we can tell at a glance whether the primary or a fallback served it.

## What does NOT change
- Prompts, framework JSON schema, adapt tool schema, asset ordering (Image 1 = reference, Image 2 = logo), negative prompts, mood rotation, credit deduction, refund logic, RLS, brand-autofill, Studio UI.
- No new secrets — `KIE_API_KEY` and `LOVABLE_API_KEY` already cover everything.
- No DB migrations.

## Verification before I say "done"
- Deploy the function.
- Run one live generation for **Absolute** and one for **Vaikunth** via the studio.
- Read `[Timing]` + `[model]` logs to confirm the primaries served both runs end-to-end, and the output images render.
- If either primary 4xx's, I fix the request body against the kie doc (per model, not carry-over) and rerun before closing out.

## Risk / rollback
- Single-file change. If GPT Image 2 quality disappoints, flipping the primary back to Nano Banana Pro is a one-line swap in `renderImage`.
- Fallbacks stay identical to today, so worst case behavior = today's behavior.
